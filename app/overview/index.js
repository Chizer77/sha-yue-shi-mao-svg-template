import {formatTime} from '../player/navigation.js';
const status=document.querySelector('#overview-status');
try{
 const [project,overview]=await Promise.all([fetch('config/composition.json').then(response=>response.json()),fetch('exports/overview/index.json').then(response=>{if(!response.ok)throw Error('尚未生成代表帧，请运行 npm run overview');return response.json();})]);
 const container=document.querySelector('#overview-sections'),filter=document.querySelector('#stage-filter');
 status.textContent=`${project.units.length} 个阶段 · ${overview.frames.length} 张当前版本代表帧 · 更新于 ${new Date(overview.generatedAt).toLocaleString('zh-CN')}`;
 for(const unit of project.units){
  const option=document.createElement('option');option.value=unit.id;option.textContent=String(unit.id).padStart(2,'0')+' · '+unit.name;filter.append(option);
  const section=document.createElement('section');section.className='overview-section';section.dataset.stage=unit.id;
  const heading=document.createElement('h2');heading.textContent=option.textContent;const grid=document.createElement('div');grid.className='overview-grid';
  for(const frame of overview.frames.filter(frame=>frame.stageId===unit.id))grid.append(card(frame));
  section.append(heading,grid);container.append(section);
 }
 filter.onchange=()=>container.querySelectorAll('section').forEach(section=>{section.hidden=filter.value!=='all'&&section.dataset.stage!==filter.value;});
}catch(error){status.textContent=error.message;}
function card(frame){
 const figure=document.createElement('figure');figure.className='overview-card';
 const link=document.createElement('a');link.href=`index.html#frame=${frame.frame}`;
 const image=document.createElement('img');image.src=frame.thumbnail;image.alt=frame.title+' '+formatTime(frame.time);image.loading='lazy';link.append(image);
 const caption=document.createElement('figcaption');caption.textContent=`${formatTime(frame.time)} · 第 ${frame.frame} 帧`;
 const links=document.createElement('div');links.className='card-links';
 for(const [label,url,download] of [['定位播放',link.href,false],['PNG',frame.png,true],['独立 SVG',`index.html?download=svg#frame=${frame.frame}`,false]]){
  const item=document.createElement('a');item.textContent=label;item.href=url;if(download)item.download='';if(label==='独立 SVG')item.target='_blank';links.append(item);
 }
 caption.append(links);figure.append(link,caption);return figure;
}
