// User-supplied wand and already-held replacement pose. Time is always explicit.
const d=await fetch(new URL('./props.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Missing props19 layout');return r.json();});
const urls=Object.fromEntries(Object.entries(d.assets).map(([id,a])=>[id,new URL('../../../'+a.file,import.meta.url).href]));
const line=(keys,f)=>{if(f<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(f<=keys[i][0]){const a=keys[i-1],b=keys[i],q=(f-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*q;}return keys.at(-1)[1];};
const rad=a=>a*Math.PI/180;
const rotate=([x,y],a)=>[x*Math.cos(rad(a))-y*Math.sin(rad(a)),x*Math.sin(rad(a))+y*Math.cos(rad(a))];
export function wandState(t){
 const f=t*60,c=d.close,n=d.native,active=f>=c.startFrame&&f<c.endFrame;
 const tip=[line(c.tipX,f),line(c.tipY,f)],rodAngle=line(c.rodAngle,f),stringAngle=line(c.stringAngle,f),rodRotation=rodAngle-n.rodAngle;
 const offset=rotate([n.joint[0]-n.tip[0],n.joint[1]-n.tip[1]],rodRotation);
 return {frame:f,active,tip,rodAngle,stringAngle,rodRotation,pendulumRotation:n.stringAngle-stringAngle,scale:c.scale,joint:[tip[0]+offset[0]*c.scale,tip[1]+offset[1]*c.scale]};
}
const raster=(id,attrs='')=>`<image href="${urls[id]}" width="${d.assets[id].width}" height="${d.assets[id].height}" preserveAspectRatio="xMidYMid meet" ${attrs}/>`;
export function renderWand(t,{held=false}={}){
 if(held){const h=d.heldStandalone;return `<g data-wand="held-standalone" data-asset-id="tomato-wand" transform="translate(${h.x} ${h.y}) scale(${h.scale})">${raster('tomato-wand')}</g>`;}
 const s=wandState(t);if(!s.active)return '';const n=d.native;
 return `<g data-wand="close" data-asset-id="tomato-wand" data-frame="${s.frame}"><defs><clipPath id="wandRodClip"><path d="${n.rodClip}"/></clipPath><clipPath id="wandHangClip"><path d="${n.hangingClip}"/></clipPath></defs><g data-wand-part="hanging" data-angle="${s.pendulumRotation}" transform="translate(${s.joint.join(' ')}) rotate(${s.pendulumRotation}) scale(${s.scale}) translate(${-n.joint[0]} ${-n.joint[1]})">${raster('tomato-wand','clip-path="url(#wandHangClip)"')}</g><g data-wand-part="rod" data-angle="${s.rodRotation}" transform="translate(${s.tip.join(' ')}) rotate(${s.rodRotation}) scale(${s.scale}) translate(${-n.tip[0]} ${-n.tip[1]})">${raster('tomato-wand','clip-path="url(#wandRodClip)"')}</g></g>`;
}
export function renderWandHolder(){const a=d.character;return `<g data-wand="holder" data-asset-id="holder-portrait" data-source="protagonist-tomato-holder" transform="translate(${a.x} ${a.y}) scale(${a.scale})">${raster('holder-portrait')}</g>`;}
