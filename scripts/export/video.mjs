import fs from 'node:fs/promises';
import path from 'node:path';
import {root,composition} from '../config.mjs';
import {openCapture} from './browser.mjs';
import {createEncoder,muxAudio} from './encoder.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...rest]=value.replace(/^--/,'').split('=');return [key,rest.join('=')||true];}));
const start=Number(args.start??0),end=Number(args.end??composition.frameCount);
if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>composition.frameCount||start>=end)throw Error('导出帧区间无效');
const output=path.resolve(root,args.out||'exports/video/animation.mp4'),silent=output.replace(/\.mp4$/i,'.silent.mp4');
await fs.mkdir(path.dirname(output),{recursive:true});
const capture=await openCapture(args.browser);let encoder;
try{
 const meowTiming=await capture.page.evaluate(()=>window.animation.meowTiming.get());console.log(JSON.stringify({meowTiming}));
 encoder=await createEncoder(silent,end-start);const before=Date.now();
 for(let frame=start;frame<end;frame++){
  await encoder.write(await capture.frame(frame));
  if((frame-start)%60===0||frame===end-1)console.log(JSON.stringify({frame,end,seconds:Math.round((Date.now()-before)/1000)}));
 }
 await encoder.finish();muxAudio(silent,output,start,end);await fs.unlink(silent);
 await fs.writeFile(output.replace(/\.mp4$/i,'.render.json'),JSON.stringify({start,end,frameCount:end-start,fps:composition.fps,width:composition.width,height:composition.height,meowTiming,seconds:(Date.now()-before)/1000},null,2)+'\n','utf8');
 console.log(JSON.stringify({done:output}));
}finally{encoder?.dispose();await capture.close();}
