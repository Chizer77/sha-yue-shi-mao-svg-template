export async function mountAssets(renderer){
 const inventory=await fetch('config/media.json').then(response=>response.json());
 const list=document.querySelector('#asset-list');let active=null;
 function show(unit){
  if(active===unit.id)return;active=unit.id;list.replaceChildren();
  const grouped=new Map();
  for(const asset of inventory.assets.filter(asset=>asset.stages.includes(unit.id))){if(!grouped.has(asset.group))grouped.set(asset.group,{...asset,count:0});grouped.get(asset.group).count++;}
  for(const asset of grouped.values())list.append(assetCard(asset));
  document.querySelector('#scene-code').href=unit.directory+'/scene.js';
 }
 renderer.events.addEventListener('frame',event=>show(event.detail.unit));
 if(renderer.state)show(renderer.state.unit);
 document.querySelector('#close-assets').onclick=()=>{document.body.classList.add('assets-hidden');document.body.classList.remove('info-open');};
 document.querySelector('#toggle-assets').onclick=()=>{document.body.classList.remove('assets-hidden');document.body.classList.toggle('info-open');};
}
function assetCard(asset){
 const card=document.createElement('article');card.className='asset-card';
 const row=document.createElement('div');row.className='asset-summary';
 const image=document.createElement('img');image.src=asset.file;image.alt=asset.label;image.loading='lazy';
 const info=document.createElement('div'),title=document.createElement('strong'),subtitle=document.createElement('span');
 title.textContent=asset.label;subtitle.textContent=asset.count>1?`${asset.count} 张差分 / 动画帧`:asset.category;
 info.append(title,subtitle);row.append(image,info);card.append(row);
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='素材文件';details.append(summary);
 const original=document.createElement('a');original.href=asset.file;original.target='_blank';original.textContent='打开正式素材 ↗';details.append(original);
 card.append(details);return card;
}
