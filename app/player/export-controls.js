import {formatTime} from './navigation.js';
import {createExportProgress} from './export-progress.js';
const find=id=>document.getElementById(id);

function rangeControls(renderer){
 const scope=find('export-scope'),project=renderer.project;
 find('export-start').max=project.frameCount-1;find('export-end').max=project.frameCount;find('export-end').value=project.frameCount;
 function get(){
  if(scope.value==='stage')return {start:renderer.state.unit.start_frame,end:renderer.state.unit.end_frame};
  if(scope.value==='custom')return {start:Number(find('export-start').value),end:Number(find('export-end').value)};
  return {start:0,end:project.frameCount};
 }
 function update(){const value=get();find('custom-range').hidden=scope.value!=='custom';find('export-range-label').textContent=`${formatTime(value.start/project.fps)} — ${formatTime(value.end/project.fps)} · ${value.end-value.start} 帧`;}
 scope.onchange=update;find('custom-range').oninput=update;
 return {get,update};
}
function bindDialog(renderer,progress){
 const dialog=find('export-dialog'),range=rangeControls(renderer);
 find('show-export').onclick=()=>{range.update();dialog.showModal();};find('close-export').onclick=()=>dialog.close();
 find('export-form').onsubmit=async event=>{
  event.preventDefault();const button=find('start-export'),error=find('export-error');button.disabled=true;error.textContent='';
  try{
   const response=await fetch('/api/exports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(range.get())});
   const result=await response.json();if(!response.ok)throw Error(result.error||'无法启动导出');
   dialog.close();progress.watch(result.job);
  }catch(problem){error.textContent=problem.message;}finally{button.disabled=false;}
 };
}
function bindSVG(renderer,notice){
 find('download-svg').onclick=async()=>{
  try{
   notice('正在打包当前帧及字体、图片…');await renderer.settle();const frame=renderer.state.frame;
   const svg=await renderer.exportSVG({embedAssets:true});
   const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),link=document.createElement('a');
   link.href=url;link.download=`frame-${frame}.svg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
   notice('已导出可独立打开的SVG。');
  }catch(error){notice(error.message);}
 };
}
export function mountExport(renderer,notice){
 bindDialog(renderer,createExportProgress());bindSVG(renderer,notice);
}
