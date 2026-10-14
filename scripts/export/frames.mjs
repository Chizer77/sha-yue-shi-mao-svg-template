import fs from 'node:fs/promises';
import path from 'node:path';
import {root,composition} from '../config.mjs';
import {openCapture} from './browser.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...parts]=value.replace(/^--/,'').split('=');return [key,parts.join('=')||true];}));
const frames=String(args.frames??'0').split(',').map(Number);
if(frames.some(frame=>!Number.isInteger(frame)||frame<0||frame>=composition.frameCount))throw Error('帧号超出工程范围');
await Promise.all(['exports/frames/png','exports/frames/svg'].map(folder=>fs.mkdir(path.join(root,folder),{recursive:true})));
const capture=await openCapture(args.browser);
try{
 for(const frame of frames){
  const name='frame-'+String(frame).padStart(4,'0'),png=await capture.frame(frame);
  const svg=await capture.page.evaluate(embedAssets=>window.animation.exportSVG({embedAssets,basePath:'../../../'}),Boolean(args.embed));
  await fs.writeFile(path.join(root,'exports/frames/png',name+'.png'),png);
  await fs.writeFile(path.join(root,'exports/frames/svg',name+'.svg'),svg,'utf8');
  console.log(JSON.stringify({frame,svg:'exports/frames/svg/'+name+'.svg'}));
 }
}finally{await capture.close();}
