import fs from 'node:fs';
import path from 'node:path';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml',
 '.ttf':'font/ttf','.woff2':'font/woff2','.m4a':'audio/mp4','.mp4':'video/mp4','.png':'image/png',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};

export function serveStatic(request,response,root,pathname){
 if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
 const relative=pathname==='/'?'/index.html':pathname;
 const file=path.resolve(root,'.'+relative);
 if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
 fs.stat(file,(error,stat)=>{
  if(error||!stat.isFile()){response.writeHead(404).end('Not found');return;}
  let start=0,end=stat.size-1,status=200;
  const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
  const range=/^bytes=(\d+)-(\d*)$/.exec(request.headers.range||'');
  if(range){start=Number(range[1]);if(range[2])end=Math.min(end,Number(range[2]));status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
  if(start>end||start>=stat.size){response.writeHead(416).end();return;}
  headers['Content-Length']=end-start+1;response.writeHead(status,headers);
  if(request.method==='HEAD'){response.end();return;}
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>response.destroy());stream.pipe(response);
  response.on('close',()=>stream.destroy());
 });
}
