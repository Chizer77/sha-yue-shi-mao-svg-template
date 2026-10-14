import fs from 'node:fs/promises';
import path from 'node:path';
import {root,composition} from '../config.mjs';
import {sharp} from '../runtime.mjs';
import {openCapture} from '../export/browser.mjs';
await Promise.all(['exports/frames/png','exports/frames/svg','exports/overview'].map(folder=>fs.mkdir(path.join(root,folder),{recursive:true})));
const capture=await openCapture();const records=[];
try{
 for(const unit of composition.units){
  for(const frame of unit.previewFrames){
   const basename=`stage-${String(unit.id).padStart(2,'0')}-frame-${String(frame).padStart(4,'0')}`;
   const png=`exports/frames/png/${basename}.png`,svg=`exports/frames/svg/${basename}.svg`,thumbnail=`exports/overview/${basename}.jpg`;
   const buffer=await capture.frame(frame);
   await fs.writeFile(path.join(root,png),buffer);
   await sharp(buffer).resize(640,360).jpeg({quality:86}).toFile(path.join(root,thumbnail));
   await fs.writeFile(path.join(root,svg),await capture.page.evaluate(()=>window.animation.exportSVG({basePath:'../../../'})),'utf8');
   records.push({stageId:unit.id,frame,time:frame/composition.fps,title:unit.name,png,svg,thumbnail});
  }
  console.log(JSON.stringify({stage:unit.id,frames:records.length}));
 }
 const meowTiming=await capture.page.evaluate(()=>window.animation.meowTiming.get());
 await fs.writeFile(path.join(root,'exports/overview/index.json'),JSON.stringify({generatedAt:new Date().toISOString(),meowTiming,frames:records},null,2)+'\n','utf8');
}finally{await capture.close();}
