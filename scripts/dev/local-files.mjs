import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requestJSON, json } from './http.mjs';
import { prepareImage } from './image-upload.mjs';
import { loadGenerationGroups } from '../build-assets/catalog.mjs';
import { acquireOperation } from './operation-lock.mjs';

const uploadLimit = 32 * 1024 * 1024;
const pending = new Set();
const readJSON = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

function checkLocalRequest(request) {
  const host = request.headers.host;
  if (!/^(?:127\.0\.0\.1|localhost):\d+$/.test(host || ''))
    throw Error('仅允许本机预览服务操作文件');
  if (request.headers.origin !== `http://${host}`) throw Error('请从本机预览页面操作文件');
  if (request.method !== 'POST') throw Error('请使用 POST 请求');
}

async function projectFile(root, relative, { allowMissing = false } = {}) {
  if (typeof relative !== 'string' || relative.includes('\\')) throw Error('文件路径无效');
  const file = path.resolve(root, relative),
    base = await fs.realpath(root);
  let resolved;
  try {
    resolved = await fs.realpath(file);
  } catch (error) {
    if (!allowMissing || error.code !== 'ENOENT') throw error;
    resolved = path.join(await fs.realpath(path.dirname(file)), path.basename(file));
  }
  // 白名单之外再校验真实路径，避免符号链接将写入指向工程外。
  if (!resolved.startsWith(base + path.sep)) throw Error('只允许访问本工程文件');
  return resolved;
}

function folderLauncher(directory) {
  if (process.platform !== 'win32')
    return {
      command: process.platform === 'darwin' ? 'open' : 'xdg-open',
      args: [directory],
      options: {},
    };
  // 由 Shell 复用目录窗口并显式恢复显示；隐藏的只是辅助控制台。
  const script = fileURLToPath(new URL('./open-folder.ps1', import.meta.url));
  return {
    command: 'powershell.exe',
    args: ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', script],
    options: { windowsHide: true, env: { ...process.env, TOMATO_OPEN_FOLDER: directory } },
  };
}

export function openDirectory(directory) {
  const { command, args, options } = folderLauncher(directory);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'ignore', 'pipe'] });
    let detail = '';
    child.stderr.on('data', (chunk) => {
      detail = (detail + chunk.toString('utf8')).slice(-4096);
    });
    child.once('error', reject);
    // 进程创建成功不等于打开成功，等待系统启动命令的结果再向页面返回。
    child.once('close', (code) =>
      code === 0 ? resolve() : reject(Error(detail.trim() || '系统文件管理器启动失败')),
    );
  });
}

async function openFolder(request, root, opener) {
  const input = await requestJSON(request);
  const inventory = await readJSON(path.join(root, 'config/media.json'));
  const sources = (await loadGenerationGroups(root)).flatMap((group) => group.sources);
  const composition = await readJSON(path.join(root, 'config/composition.json'));
  const asset = [...inventory.assets, ...sources].find((asset) => asset.file === input.asset);
  const unit = composition.units.find((unit) => unit.id === input.stage);
  if (!asset && !unit) throw Error('未找到对应素材或阶段');
  const directory = asset ? path.posix.dirname(asset.file) : unit.directory;
  const resolved = await projectFile(root, directory);
  if (!(await fs.stat(resolved)).isDirectory()) throw Error('目标文件夹不存在');
  await opener(resolved);
  return { opened: true, directory };
}

async function readUpload(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > uploadLimit) throw Error('图片不能超过 32 MB');
    chunks.push(chunk);
  }
  if (!size) throw Error('请选择图片文件');
  return Buffer.concat(chunks, size);
}

async function saveReplacement(root, file, buffer, allowMissing = false) {
  const relative = path.relative(root, file);
  const backup = path.join('exports', 'asset-backups', randomUUID(), relative);
  const backupFile = path.join(root, backup),
    temporary = file + '.' + randomUUID() + '.tmp';
  await fs.mkdir(path.dirname(backupFile), { recursive: true });
  let backedUp = true;
  try {
    await fs.copyFile(file, backupFile);
  } catch (error) {
    if (!allowMissing || error.code !== 'ENOENT') throw error;
    backedUp = false;
  }
  try {
    await fs.writeFile(temporary, buffer);
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return backedUp ? backup.split(path.sep).join('/') : null;
}

async function replacementTarget(root, relative) {
  const inventory = await readJSON(path.join(root, 'config/media.json')),
    groups = await loadGenerationGroups(root);
  if (groups.some((group) => group.files.includes(relative)))
    throw Error('此文件由脚本生成，请替换基础图后重新生成整组帧');
  const group = groups.find((group) => group.sources.some((source) => source.file === relative));
  const source = group?.sources.find((source) => source.file === relative);
  if (!source && !inventory.assets.some((asset) => asset.file === relative))
    throw Error('只能替换素材清单中的文件或基础图');
  return {
    file: await projectFile(root, relative, { allowMissing: Boolean(source) }),
    source,
    group,
  };
}

async function replaceAsset(request, root, url) {
  const relative = url.searchParams.get('file');
  const { file, source, group } = await replacementTarget(root, relative);
  if (pending.has(file)) throw Error('该素材正在保存，请稍后重试');
  const release = acquireOperation('replacement');
  pending.add(file);
  try {
    const image = await prepareImage(await readUpload(request), path.extname(file));
    if (
      source &&
      (image.metadata.width !== source.size[0] || image.metadata.height !== source.size[1])
    )
      throw Error(`基础图必须保持 ${source.size.join(' × ')} 像素，才能正确生成动画帧`);
    const backup = await saveReplacement(root, file, image.buffer, Boolean(source));
    return {
      saved: true,
      file: relative,
      backup,
      width: image.metadata.width,
      height: image.metadata.height,
      rebuild: group ? { id: group.id, label: group.label } : null,
    };
  } finally {
    pending.delete(file);
    release();
  }
}

export async function handleLocalFiles(request, response, root, { opener = openDirectory } = {}) {
  try {
    checkLocalRequest(request);
    const url = new URL(request.url, 'http://localhost');
    const result =
      url.pathname === '/api/local/open-folder'
        ? await openFolder(request, root, opener)
        : await replaceAsset(request, root, url);
    json(response, 200, result);
  } catch (error) {
    json(response, error.status || 400, { error: error.message });
  }
}
