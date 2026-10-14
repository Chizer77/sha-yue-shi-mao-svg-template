const find=id=>document.getElementById(id);
function showJob(job){
 const running=['starting','rendering'].includes(job.status);
 find('export-progress').hidden=false;find('show-export').disabled=running;
 find('export-label').textContent=job.status==='complete'?'视频导出完成':job.status==='starting'?'正在准备素材和字体':running?'正在导出视频':'导出未完成';
 find('export-percent').textContent=Math.round(job.progress*100)+'%';find('export-meter').value=job.progress;
 find('export-detail').textContent=job.error||`${job.completedFrames} / ${job.totalFrames} 帧 · 导出期间可继续浏览页面`;
 const link=find('export-download');link.hidden=job.status!=='complete';link.href=job.url;
}
export function createExportProgress(){
 let timer=null;
 async function poll(id){
  try{
   const response=await fetch('/api/exports/'+id),{job}=await response.json();if(!job)return;
   showJob(job);if(['starting','rendering'].includes(job.status))timer=setTimeout(()=>poll(id),1500);
  }catch{find('export-detail').textContent='连接暂时中断，正在重新获取导出进度…';timer=setTimeout(()=>poll(id),3000);}
 }
 function watch(job){clearTimeout(timer);showJob(job);if(['starting','rendering'].includes(job.status))poll(job.id);}
 fetch('/api/exports/current').then(response=>response.ok?response.json():null).then(result=>{if(result?.job)watch(result.job);}).catch(()=>{});
 window.addEventListener('pagehide',()=>clearTimeout(timer));
 return {watch};
}
