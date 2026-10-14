export const formatTime=time=>`${String(Math.floor(time/60)).padStart(2,'0')}:${(time%60).toFixed(3).padStart(6,'0')}`;
export function mountNavigation(project,playback,renderer){
 const list=document.querySelector('#stage-list'),buttons=new Map();
 for(const unit of project.units){
  const button=document.createElement('button');button.className='stage-item';button.dataset.stage=unit.id;
  const image=document.createElement('img');image.className='stage-thumb';image.alt='';image.loading='lazy';
  image.src=`exports/overview/stage-${String(unit.id).padStart(2,'0')}-frame-${String(unit.thumbnailFrame).padStart(4,'0')}.jpg`;
  const details=document.createElement('span'),title=document.createElement('span'),meta=document.createElement('span');
  title.className='stage-title';title.textContent=String(unit.id).padStart(2,'0')+' · '+unit.name;
  meta.className='stage-meta';meta.textContent=formatTime(unit.start)+' · '+(unit.end-unit.start).toFixed(1)+'秒';
  details.append(title,meta);button.append(image,details);button.onclick=()=>playback.seek(unit.start);list.append(button);buttons.set(unit.id,button);
 }
 let selected=null;
 renderer.events.addEventListener('frame',event=>{
  const unit=event.detail.unit;if(selected===unit.id)return;
  buttons.get(selected)?.removeAttribute('aria-current');buttons.get(unit.id).setAttribute('aria-current','true');selected=unit.id;
  document.querySelector('#scene-number').textContent='STAGE '+String(unit.id).padStart(2,'0');document.querySelector('#scene-name').textContent=unit.name;
 });
 return {jump(delta){const unit=renderer.state.unit,index=project.units.indexOf(unit);playback.seek(project.units[Math.max(0,Math.min(project.units.length-1,index+delta))].start);}};
}
