export function json(response, status, body) {
  response
    .writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })
    .end(JSON.stringify(body));
}
export async function requestJSON(request) {
  if (request.method !== 'POST') throw Error('请使用POST请求');
  if (request.headers.origin && request.headers.origin !== `http://${request.headers.host}`)
    throw Error('仅允许本预览页面提交');
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw Error('请使用JSON参数');
  let body = '';
  for await (const chunk of request) {
    body += chunk.toString('utf8');
    if (Buffer.byteLength(body) > 8192) throw Error('请求内容过大');
  }
  return JSON.parse(body);
}
