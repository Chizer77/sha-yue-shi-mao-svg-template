import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from '../config.mjs';
import { serveStatic } from './static.mjs';
import { saveTiming } from './timing.mjs';
import { getJob, startJob } from './export-jobs.mjs';
import { requestJSON, json } from './http.mjs';
import { handleLocalFiles } from './local-files.mjs';
import { createAssetGeneration } from './asset-generation.mjs';
const assetGeneration = createAssetGeneration(root);
export { root };
async function route(request, response, { exportsEnabled }) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (pathname === '/api/asset-generation') {
    if (!exportsEnabled) {
      json(response, 403, { error: '渲染服务不接受素材生成操作' });
      return;
    }
    try {
      if (request.method === 'GET') {
        json(response, 200, await assetGeneration.status());
        return;
      }
      const input = await requestJSON(request);
      json(response, 202, { job: await assetGeneration.start(input) });
    } catch (error) {
      json(response, error.status || 400, { error: error.message });
    }
    return;
  }
  if (['/api/local/open-folder', '/api/local/replace-asset'].includes(pathname)) {
    if (!exportsEnabled) {
      json(response, 403, { error: '渲染服务不接受文件操作' });
      return;
    }
    if (
      pathname.endsWith('replace-asset') &&
      ['starting', 'rendering'].includes(getJob('current')?.status)
    ) {
      json(response, 409, { error: '请等待视频导出完成后再替换素材' });
      return;
    }
    await handleLocalFiles(request, response, root);
    return;
  }
  if (pathname === '/api/meow-timing') {
    await saveTiming(request, response, root);
    return;
  }
  if (pathname.startsWith('/api/exports')) {
    if (!exportsEnabled) {
      json(response, 403, { error: '渲染服务不接受导出任务' });
      return;
    }
    try {
      if (pathname === '/api/exports' && request.method === 'POST') {
        json(response, 202, { job: startJob(await requestJSON(request)) });
        return;
      }
      const id = pathname.split('/').at(-1),
        job = getJob(id);
      json(response, job || id === 'current' ? 200 : 404, { job });
    } catch (error) {
      json(response, error.status || 400, { error: error.message });
    }
    return;
  }
  serveStatic(request, response, root, pathname);
}
export function serve(port = Number(process.env.PORT || 8767), { exportsEnabled = true } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) =>
      route(request, response, { exportsEnabled }).catch((error) =>
        json(response, 500, { error: error.message }),
      ),
    );
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () =>
      resolve({ server, url: `http://127.0.0.1:${server.address().port}` }),
    );
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await serve();
  console.log('sha-yue-shi-mao-svg-template ' + url);
}
