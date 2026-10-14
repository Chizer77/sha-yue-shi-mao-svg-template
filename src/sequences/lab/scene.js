const data=await fetch(new URL('./motion.json',import.meta.url)).then(response=>response.json());
// One camera applies to the room, title size, actor, audience and native table.
import {renderRoomBackdrop} from './panels.js';
import {roomLitCharacter} from '../../effects/character-lighting.js';
const protagonist=await fetch(new URL('./characters.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Missing Protagonist room data');return r.json();});
// 科技室首次出现与片尾共用已确认人物；各自镜头和特效时序仍独立。
const roomCharacter=protagonist.character;
const urls=Object.fromEntries(Object.entries(data.images).map(([k,p])=>[k,new URL('../../../'+p,import.meta.url).href]));
const protagonistURLs={character:new URL('../../../'+roomCharacter.file,import.meta.url).href,
 audience:new URL('../../../'+protagonist.audienceFile,import.meta.url).href,
 assistant:new URL('../../../'+protagonist.assistant.file,import.meta.url).href};
export const roomData=data;
export const ready=Promise.resolve();
const frameAt=t=>{const x=t*60,n=Math.round(x);return Math.abs(x-n)<1e-8?n:x;};
const sample=(a,f)=>{if(f<=a[0][0])return a[0].slice(1);for(let i=1;i<a.length;i++)if(f<=a[i][0]){const q=(f-a[i-1][0])/(a[i][0]-a[i-1][0]);return a[i-1].slice(1).map((v,j)=>v+(a[i][j+1]-v)*q);}return a.at(-1).slice(1);};
const project=(p,c)=>({x:960+c.scale*(p[0]-960)+c.dx,y:540+c.scale*(p[1]-540)+c.dy});
export function roomState(t,{credits=false}={}){
 const frame=frameAt(t),[scale,dx,dy]=credits?sample(data.camera.creditsKeys,frame):sample(data.camera.keys,frame),camera={scale,dx,dy,center:[960,540]},r=roomCharacter;
 const residual=credits?r.creditsResidual:sample(r.residualKeys,frame),world={x:r.worldPosition[0]+residual[0],y:r.worldPosition[1]+residual[1],width:r.nativeSize[0]*r.worldScale,height:r.nativeSize[1]*r.worldScale};
 const screen=project([world.x,world.y],camera),landmark=p=>project([world.x+p[0]*r.worldScale,world.y+p[1]*r.worldScale],camera);
 const opacity=credits?0:sample(data.title.opacityKeys,frame)[0],xScreen=sample(data.title.xScreenKeys,frame)[0],titleX=960+(xScreen-960-dx)/scale;
 const scanlines=credits?[]:data.effects.scanlineEvents.filter(e=>frame>=e.start&&frame<e.end);
 const rgb=sample(credits?data.effects.creditsRGBKeys:data.effects.rgbKeys,frame)[0],tear=credits?0:Math.max(0,Math.min(1,(data.effects.tearEnd-frame)/(data.effects.tearEnd-data.frameInterval[0])));
 return {frame,credits,active:credits||(frame>=data.frameInterval[0]&&frame<data.frameInterval[1]),camera,barHeight:credits?0:data.bars,
  character:{assetId:r.assetId,transformMode:r.mode,mirror:false,rotation:0,world,residual,image:{...screen,width:world.width*scale,height:world.height*scale},eyeCenter:landmark(r.nativeEyeCenter),eyeDistance:r.nativeEyeDistance*r.worldScale*scale,neck:landmark(r.nativeNeck),shoulders:r.nativeShoulders.map(landmark)},
  table:{nativeCanvas:[3840,2160],designScale:.5,topCorners:[[584,892.5],[1329.5,892.5]].map(p=>project(p,camera)),bottomCorners:[[349.5,1079.5],[1564,1079.5]].map(p=>project(p,camera)),anisotropicStretch:false},
  title:{opacity,xWorld:titleX,xScreen,lines:data.title.lines.map(l=>({...l,screenBaseline:project([titleX,l.baseline],camera).y,screenWidth:l.width*scale,screenFontSize:l.size*scale})),behindActor:true},
  effects:{scanlines,rgbOffset:rgb,tearAmount:tear,waveAmount:credits&&frame>=7120&&frame<7134?1:0,mode:'per-scene-absolute-frame-deterministic'}};
}
function defs(s){const a=s.effects.rgbOffset;return `<defs>
 <linearGradient id="labbeam" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c4ffe8" stop-opacity=".6"/><stop offset=".75" stop-color="#a9eed2" stop-opacity=".30"/><stop offset="1" stop-color="#a9eed2" stop-opacity="0"/></linearGradient>
 <linearGradient id="labfloor" gradientUnits="userSpaceOnUse" x1="0" y1="1030" x2="0" y2="1095"><stop stop-color="#10182b" stop-opacity="0"/><stop offset=".72" stop-color="#10182b" stop-opacity=".93"/><stop offset="1" stop-color="#10182b"/></linearGradient>
 <radialGradient id="labambient"><stop stop-color="#a7efd3" stop-opacity=".30"/><stop offset=".62" stop-color="#8ee6c7" stop-opacity=".11"/><stop offset="1" stop-color="#81c6b9" stop-opacity="0"/></radialGradient>
 <linearGradient id="labscan" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#53ffd4" stop-opacity="0"/><stop offset=".18" stop-color="#4cffe0" stop-opacity=".3"/><stop offset=".4" stop-color="#2fff63" stop-opacity=".45"/><stop offset=".48" stop-color="#34ff57"/><stop offset=".65" stop-color="#35ff51" stop-opacity=".6"/><stop offset=".85" stop-color="#d5ec38" stop-opacity=".3"/><stop offset="1" stop-color="#2fed59" stop-opacity="0"/></linearGradient>
 <radialGradient id="labtable"><stop stop-color="#ffe9c7" stop-opacity=".84"/><stop offset="1" stop-color="#b58b65" stop-opacity="0"/></radialGradient>
 <filter id="labbeamSoft" x="-30%" y="-15%" width="160%" height="130%"><feGaussianBlur stdDeviation="24"/></filter>
 <filter id="labwave" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0 .026" numOctaves="1" seed="17" result="wave"/><feColorMatrix in="wave" values="1 0 0 0 0 0 0 0 0 .5 0 0 0 0 0 0 0 0 1 0" result="horizontal"/><feOffset in="horizontal" dy="${(s.frame-7120)*7}" result="shifted"/><feDisplacementMap in="SourceGraphic" in2="shifted" scale="600" xChannelSelector="R" yChannelSelector="G"/></filter>
 <filter id="labrgb" x="-5%" y="-3%" width="110%" height="106%" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="${a}" result="rr"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feOffset in="b" dx="${-a}" result="bb"/><feBlend in="rr" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="bb" mode="screen"/></filter>
 </defs>`;}
export function renderRoom(t,{credits=false}={}){
 const s=roomState(t,{credits}),c=s.camera,r=s.character.world;
 const actorURL=protagonistURLs.character,audienceURL=protagonistURLs.audience;
 const image=k=>`<image data-room22-layer="${k}" href="${k==='audience'?audienceURL:urls[k]}" width="1920" height="1080" preserveAspectRatio="xMidYMid meet"/>`;
 // 小主角替换原有左侧群像，随同一个镜头缩放；前景群像和桌子仍负责遮挡。
 const a=protagonist.assistant.world;
 const assistant=`<g data-room22-layer="little-protagonist">${roomLitCharacter({id:'lab-little-light',href:protagonistURLs.assistant,world:a,side:true})}</g>`;
 const actor=roomLitCharacter({id:'lab-eri-light',href:actorURL,world:r});
 const title=s.title.opacity>0?`<g data-room22-layer="title" opacity="${s.title.opacity}" fill="#f7faf1" font-family="MV Serif" font-weight="900">${s.title.lines.map(l=>`<text x="${s.title.xWorld}" y="${l.baseline}" font-size="${l.size}" textLength="${l.width}" lengthAdjust="spacingAndGlyphs">${l.text}</text>`).join('')}</g>`:'';
 const scans=s.effects.scanlines.map(l=>`<rect data-room22-layer="scan-line" x="${960+(l.x-960-c.dx)/c.scale}" y="${540+(l.y-l.height/2-540-c.dy)/c.scale}" width="${l.width/c.scale}" height="${l.height/c.scale}" fill="url(#labscan)" opacity="${l.opacity}"/>`).join('');
 const camera=`translate(${960+c.dx} ${540+c.dy}) scale(${c.scale}) translate(-960 -540)`;
 const content=`<g data-room22-camera="shared" transform="${camera}"><image data-room22-layer="background-edge-extension" href="${urls.extendedBackground}" x="-256" y="-256" width="2432" height="1592" preserveAspectRatio="none"/>${renderRoomBackdrop()}<path data-room22-layer="poster-cover" d="M1728 334L2432 94V877L1740 639Z" fill="#24364b"/><path d="M1768 417L1889 374M1768 449L1889 406M1768 481L1889 438" stroke="#456077" stroke-width="5"/><rect data-room22-layer="floor-shade" x="-256" y="1030" width="2432" height="550" fill="url(#labfloor)"/><ellipse cx="980" cy="535" rx="730" ry="790" fill="url(#labambient)"/><path data-room22-layer="rear-light" d="M815 -230H1118L1260 940Q960 1090 650 940Z" fill="url(#labbeam)" filter="url(#labbeamSoft)"/>${title}${scans}<g data-room22-layer="character" data-room-asset="${s.character.assetId}" data-asset-id="${s.character.assetId}">${actor}</g>${assistant}${image('audience')}<svg data-room22-layer="audience-edge-extension" x="0" y="1079" width="1920" height="500" viewBox="0 2158 3840 2" preserveAspectRatio="none" overflow="hidden"><image href="${audienceURL}" width="3840" height="2160"/></svg><path data-room22-layer="table-edge-extension" d="M349.5 1078.5L1564 1078.5L2154 1550H-240Z" fill="rgb(150,113,99)"/>${image('table')}<ellipse data-room22-layer="table-light" cx="960" cy="983" rx="448" ry="142" fill="url(#labtable)"/><path data-room22-layer="front-light" d="M845 -220H1070L1195 930Q960 1010 725 930Z" fill="url(#labbeam)" opacity=".14" filter="url(#labbeamSoft)"/></g>`;
 const tear=s.effects.tearAmount;let tears='';if(tear>0){const strips=[[148,22,76],[221,57,-113],[357,18,154],[418,73,-66],[630,25,108],[747,54,-130],[887,16,54]];tears=strips.map(([y,h,dx],i)=>`<clipPath id="labstrip${i}"><rect x="0" y="${y}" width="1920" height="${h}"/></clipPath><g clip-path="url(#labstrip${i})"><use href="#labscene" transform="translate(${dx*tear} 0)"/></g>`).join('');}
 return `<g data-room22="${credits?'credits':'intro'}" data-frame="${s.frame}" data-camera-scale="${c.scale}" data-camera-dx="${c.dx}" data-camera-dy="${c.dy}"><rect data-room22-layer="screen-wall-fill" width="1920" height="1080" fill="#1b293d"/>${defs(s)}<g ${s.effects.waveAmount?'filter="url(#labwave)"':''}><g ${s.effects.rgbOffset>0?'filter="url(#labrgb)"':''}><g id="labscene">${content}</g>${tears}</g></g></g>`;
}
