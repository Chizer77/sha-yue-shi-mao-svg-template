import {encounterPortrait} from '../../characters/protagonist/encounter.js';
// Existing background/foreground-hand timing remains from the measured reaction scene.
export const reactionData=await fetch(new URL('./reaction.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('reaction data unavailable');return r.json();});
export const headMotionData=await fetch(new URL('./head-motion.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('headMotion whole-image data unavailable');return r.json();});
const url=p=>new URL('../../../'+p,import.meta.url).href;
const n=x=>Number(x.toFixed(6));
const frameAt=t=>{const f=t*60,k=Math.round(f);return Math.abs(f-k)<1e-8?k:f;};
function sample(keys,f){if(f<=keys[0][0])return keys[0].slice(1);for(let i=1;i<keys.length;i++)if(f<=keys[i][0]){const a=keys[i-1],b=keys[i],q=(f-a[0])/(b[0]-a[0]);return a.slice(1).map((x,k)=>x+(b[k+1]-x)*q);}return keys.at(-1).slice(1);}
export function reactionState(t){
 const r=reactionData,m=headMotionData,frame=frameAt(t),[dx,dy,rx,ry]=sample(m.keys,frame),[ax,ay]=m.anchorNative;
 const scaleX=r.base.scale*rx,scaleY=r.base.scale*ry;
 const anchorScreen={x:r.base.x+ax*r.base.scale+dx,y:r.base.y+ay*r.base.scale+dy};
 const x=anchorScreen.x-ax*scaleX,y=anchorScreen.y-ay*scaleY;
 const projected=p=>({x:x+p[0]*scaleX,y:y+p[1]*scaleY});
 const [fx,fy]=sample(r.foreground.positionKeys,frame),[fx0]=sample(r.foreground.positionKeys,r.sleeve.referenceFrame);
 return {frame,active:frame>=r.frameInterval[0]&&frame<r.frameInterval[1],assetId:r.assetId,mirror:false,method:'whole-image-translate-scale',dx,dy,
  character:{image:{x,y,width:r.nativeSize[0]*scaleX,height:r.nativeSize[1]*scaleY},scale:r.base.scale,scaleX,scaleY,relativeScale:{x:rx,y:ry},anchorScreen,matrix:[scaleX,0,0,scaleY,x,y],rotation:0,eyeCenter:projected(r.nativeEyeCenter),neck:projected([553,768]),chest:projected([580,1090]),leftHair:projected([100,1200]),rightHair:projected([990,1200])},
  background:{...r.background,x:sample(r.background.positionKeys,frame)[0],y:sample(r.background.positionKeys,frame)[1]},
  foreground:{x:fx,y:fy,width:1920*r.foreground.nativeSize[0]/r.foreground.sourceNativeSize[0],height:1080,rotation:0,mirror:false,file:r.foreground.file},
  sleeve:{x:r.sleeve.baseX+fx-fx0,y:r.sleeve.baseY,width:r.sleeve.width*r.sleeve.scale,height:r.sleeve.height*r.sleeve.scale,file:r.sleeve.file}};
}
export function reactionCharacter(t){
 const r=reactionData,s=reactionState(t),b=s.character.image;
 return `<g data-reaction-character data-asset-id="${r.assetId}" data-motion-rig="whole-image-translate-scale" data-scale-x="${n(s.character.scaleX)}" data-scale-y="${n(s.character.scaleY)}" transform="translate(${b.x} ${b.y}) scale(${s.character.scaleX} ${s.character.scaleY})">${encounterPortrait('front',r.nativeSize[0],r.nativeSize[1],t)}</g>`;
}
export function renderReaction(t){
 const r=reactionData,s=reactionState(t);if(!s.active)return '';const h=s.foreground,c=s.sleeve,cuffDx=c.x-r.sleeve.baseX;
 return `<g data-scene="reaction" data-frame="${n(s.frame)}"><image data-reaction-background href="${url(r.background.file)}" x="${s.background.x}" y="${s.background.y}" width="${s.background.width}" height="1080"/>${reactionCharacter(t)}<g data-reaction-foreground data-x="${h.x}" data-y="${h.y}"><image href="${url(h.file)}" x="${h.x}" y="${h.y}" width="${h.width}" height="${h.height}"/></g><defs><filter id="h22-sleeve-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${r.sleeve.blur}"/></filter><clipPath id="h22-cuff-clip"><path d="${r.sleeve.path}"/></clipPath></defs><g data-reaction-sleeve transform="translate(${cuffDx} 0)" filter="url(#h22-sleeve-blur)"><g clip-path="url(#h22-cuff-clip)"><image href="${url(c.file)}" x="${r.sleeve.baseX}" y="${c.y}" width="${c.width}" height="${c.height}" preserveAspectRatio="none"/></g></g></g>`;
}
