import fs from 'node:fs';
import path from 'node:path';
import {requestJSON,json} from './http.mjs';
const fields=['songTimeOffsetSeconds','mouthTimeOffsetSeconds','lyricTimeOffsetSeconds'];
export async function saveTiming(request,response,root){
 try{
  const body=await requestJSON(request),values={};
  for(const field of fields){const value=body?.[field];if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>2)throw Error('偏移必须在前后120帧以内');values[field]=value;}
  const file=path.join(root,'config/meow-adjustments.json'),settings=JSON.parse(fs.readFileSync(file,'utf8'));
  fs.writeFileSync(file+'.tmp',JSON.stringify({...settings,...values},null,2)+'\n','utf8');fs.renameSync(file+'.tmp',file);
  json(response,200,{saved:true,timings:values});
 }catch(error){json(response,400,{error:error.message});}
}
