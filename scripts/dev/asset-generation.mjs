import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { randomUUID } from 'node:crypto';
import { generationStatus, generationTasks } from '../build-assets/catalog.mjs';
import { acquireOperation } from './operation-lock.mjs';

function runGenerator(root, id, onOutput) {
  const [script, ...args] = generationTasks[id];
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(root, 'scripts/build-assets', script), ...args],
      {
        cwd: root,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1' },
      },
    );
    for (const stream of [child.stdout, child.stderr]) {
      const decoder = new StringDecoder('utf8');
      let pending = '';
      stream.on('data', (chunk) => {
        pending += decoder.write(chunk);
        const lines = pending.split('\n');
        pending = lines.pop();
        if (lines.length) onOutput(lines.join('\n') + '\n');
      });
      stream.on('end', () => onOutput(pending + decoder.end()));
    }
    child.once('error', reject);
    child.once('close', (code) =>
      code === 0 ? resolve() : reject(Error(`生成进程退出，代码 ${code}。请查看下方日志。`)),
    );
  });
}

function previousJob(file) {
  try {
    const job = JSON.parse(fs.readFileSync(file, 'utf8'));
    return job.status === 'running'
      ? { ...job, status: 'interrupted', error: '服务已重启，请重新生成未完成的素材。' }
      : job;
  } catch {
    return null;
  }
}

export function createAssetGeneration(root, { run = runGenerator } = {}) {
  const record = path.join(root, 'exports/jobs/assets-current.json');
  let job = previousJob(record);
  const persist = () => {
    fs.mkdirSync(path.dirname(record), { recursive: true });
    fs.writeFileSync(record, JSON.stringify(job, null, 2) + '\n', 'utf8');
  };
  function output(text) {
    if (!text) return;
    job.log = (job.log + text).slice(-12000);
    const progress = [...text.matchAll(/(\d+)\/(\d+)/g)].at(-1);
    if (progress) job.currentFrames = Math.min(Number(progress[1]), job.currentTotal);
    persist();
  }
  async function execute(groups, release) {
    try {
      for (const group of groups) {
        job.current = group.id;
        job.label = group.label;
        job.currentFrames = 0;
        job.currentTotal = group.total;
        output(`\n开始生成 ${group.label}（${group.total} 帧）\n`);
        await run(root, group.id, output);
        const state = (await generationStatus(root)).find((item) => item.id === group.id);
        if (state.missingFiles.length)
          throw Error(`${group.label}仍缺少 ${state.missingFiles.length} 帧，请查看日志。`);
        job.completed.push(group.id);
        job.completedFrames += group.total;
        job.currentFrames = 0;
        persist();
      }
      job.status = 'complete';
      job.current = null;
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
    } finally {
      job.finishedAt = new Date().toISOString();
      try {
        persist();
      } finally {
        release();
      }
    }
  }
  async function start(input) {
    if (
      !input ||
      !Array.isArray(input.ids) ||
      !input.ids.length ||
      input.ids.some((id) => !Object.hasOwn(generationTasks, id))
    )
      throw Error('请选择有效的生成任务');
    const release = acquireOperation('generation');
    try {
      const groups = (await generationStatus(root)).filter((group) => input.ids.includes(group.id));
      if (groups.length !== new Set(input.ids).size) throw Error('找不到生成任务配置');
      const missing = groups.flatMap((group) => group.missingSources);
      if (missing.length) throw Error('基础图缺失，请先恢复或替换：' + missing.join('、'));
      job = {
        id: randomUUID(),
        status: 'running',
        ids: groups.map((group) => group.id),
        current: null,
        label: '准备生成',
        completed: [],
        completedFrames: 0,
        totalFrames: groups.reduce((total, group) => total + group.total, 0),
        log: '',
        createdAt: new Date().toISOString(),
      };
      persist();
      void execute(groups, release).catch((error) =>
        console.error('无法记录素材生成任务：' + error.message),
      );
      return job;
    } catch (error) {
      release();
      throw error;
    }
  }
  return {
    start,
    async status() {
      return { groups: await generationStatus(root), job };
    },
  };
}
