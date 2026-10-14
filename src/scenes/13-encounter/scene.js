import {img,sprite,landing,ufo,closeLandscape,rod,aperture,renderReaction,renderRepresentatives,encounterPortrait,encounterPortraitBounds,encounterBack} from '../../sequences/scifi/shared.js';
import {landingState,handShotState} from './motion.js';
function landingFigure(p){
 const id=`landing-${p.id}`,bottom=p.height;
 const key=p.id==='main'?'side':'little',bounds=encounterPortraitBounds(key,p.width,p.height),padding=Math.max(12,p.blur*4);
 const area=`x="${bounds.x-padding}" y="${bounds.y-padding}" width="${bounds.width+padding*2}" height="${bounds.height+padding*2}"`;
 // 包含放大后伸出旧坐标框的两侧发尾，纵向淡出仍沿用原落地节奏。
 return `<g data-landing-person="${p.id}" data-asset-id="${p.assetId}" data-dy="${p.dy}" data-blur="${p.blur}" data-edge-feather="${p.cropFade}" transform="translate(${p.x} ${p.y})"><defs><filter id="${id}-focus" filterUnits="userSpaceOnUse" ${area}><feGaussianBlur stdDeviation="${p.blur}"/></filter>${p.cropFade>0?`<linearGradient id="${id}-edge" gradientUnits="userSpaceOnUse" x1="0" y1="${bottom-p.cropFade}" x2="0" y2="${bottom}"><stop stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="${id}-mask" maskUnits="userSpaceOnUse" ${area}><rect ${area} fill="url(#${id}-edge)"/></mask>`:''}</defs><g filter="url(#${id}-focus)" ${p.cropFade>0?`mask="url(#${id}-mask)"`:''}>${encounterPortrait(key,p.width,p.height)}</g></g>`;
}
function landingLight(s,front=false){
 if(s.lightOpacity<=0)return '';
 const l=landing.light;
 if(!front)return `<g data-landing-light="background" opacity="${s.lightOpacity}"><defs><linearGradient id="sfLandingWash18" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${l.rightEdgeX}" y2="0"><stop stop-color="${l.color}" stop-opacity=".68"/><stop offset=".42" stop-color="${l.color}"/><stop offset=".74" stop-color="${l.color}" stop-opacity=".7"/><stop offset="1" stop-color="${l.color}" stop-opacity="0"/></linearGradient><linearGradient id="sfLandingBand18"><stop stop-color="${l.color}" stop-opacity="0"/><stop offset=".5" stop-color="${l.color}"/><stop offset="1" stop-color="${l.color}" stop-opacity="0"/></linearGradient><linearGradient id="sfLandingBandY18" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity=".3"/><stop offset=".7" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity=".2"/></linearGradient><mask id="sfLandingBandFade18"><rect width="1500" height="1080" fill="url(#sfLandingBandY18)"/></mask></defs><rect width="${l.rightEdgeX}" height="1080" fill="url(#sfLandingWash18)" opacity="${l.backgroundStrength}"/></g>`;
 return `<g data-landing-light="foreground" opacity="${s.lightOpacity}"><defs><radialGradient id="sfLandingGround18"><stop stop-color="${l.color}" stop-opacity=".72"/><stop offset=".55" stop-color="${l.color}" stop-opacity=".38"/><stop offset="1" stop-color="${l.color}" stop-opacity="0"/></radialGradient></defs><rect width="${l.rightEdgeX}" height="1080" fill="url(#sfLandingWash18)" opacity="${l.foregroundStrength}"/><ellipse cx="620" cy="905" rx="840" ry="390" fill="url(#sfLandingGround18)"/><g opacity=".18" mask="url(#sfLandingBandFade18)">${l.softBands.map(b=>`<rect x="${b.x}" y="${-230+(s.frame-5403)*2.1+b.phase*90}" width="${b.width}" height="1250" fill="url(#sfLandingBand18)"/>`).join('')}</g></g>`;
}
function frontField(t,ctx){
 const s=landingState(t),back=Array.from({length:7},(_,i)=>sprite(i%2?'alien2':'alien',[1101,120,457,920],[2160,1215],915+i*135,452,91,184)).join('');
 return `<g data-scene="ufo-landing">${img('field')}<g data-landing-background-figures="seven" opacity=".34" filter="url(#sfSoft)">${back}</g>${landingLight(s)}${landingFigure(s.figures.find(p=>p.id==='companion'))}${landingFigure(s.figures.find(p=>p.id==='main'))}${landingLight(s,true)}</g>`;
}
function reverseField(t,ctx){
 return img('field')+renderRepresentatives(t)+
 `<g filter="url(#sfNearDepth)">${encounterBack()}</g>`;
}
function handReverse(t,ctx){
 return renderReaction(t);
}
export function handShot(t){
 const s=handShotState(t);
 // 手只沿原轨迹移入；画面收窄与展开交由最外层上下黑边控制。
 return closeLandscape()+`<g data-hand-shot-motion="fixed-size-translation" transform="translate(${s.x} ${s.y})">${img('hand')}</g>`+(t>=102.78?rod(t):'');
}
export function render(t,ctx){
 if(t<5521/60)return aperture(frontField(t,ctx));
 if(t<5701/60)return aperture(reverseField(t,ctx));
 if(t<98.4)return aperture(handReverse(t,ctx),117);
 const bars=handShotState(t);
 return aperture(handShot(t),bars.topBars,bars.bottomBars);
}
