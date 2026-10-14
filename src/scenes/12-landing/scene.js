import {C,E,M,tx,img,descent,flow,passengerURLs,earth,ufo,aperture} from '../../sequences/scifi/shared.js';
import {ufoDescentState,ufoFlowState} from './motion.js';
function descentPassengers(s){
 const blur=(descent.appearance?.screenBlur??0)/s.zoom,opacity=descent.appearance?.opacity??1;
 // 远景滤镜按屏幕像素控制，摄像机缩放后仍保持相同的柔化程度。
 return `<g data-ufo-passengers="two" data-passenger-count="${s.passengers.length}"><defs><filter id="sfDescentSoft" x="-30%" y="-15%" width="160%" height="130%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>${s.passengers.map(p=>`<g data-ufo-passenger="${p.id}" data-center-x="${p.projected.centerX}" data-feet-y="${p.projected.feetY}" data-feet-offset="${p.feetOffset}" opacity="${opacity}" filter="url(#sfDescentSoft)"><image href="${passengerURLs[p.id]}" x="${p.image.x}" y="${p.image.y}" width="${p.image.width}" height="${p.image.height}" preserveAspectRatio="xMidYMid meet"/></g>`).join('')}</g>`;
}
function ufoFlowLayers(s){
 if(!s.active||s.opacity<=0)return '';
 const b=s.beam,x=s.hatch.x,h=b.bottomY-b.topY,fadeStart=(flow.beam.fadeStartOffset-flow.beam.topOffset)/h;
 const ground=flow.groundOcclusion,camera=`translate(960 650) scale(${s.groundCameraZoom}) translate(-960 -650) scale(${ground.designScale})`;
 const shape=`M${x-b.topHalfWidth} ${b.topY}H${x+b.topHalfWidth}L${x+b.bottomHalfWidth} ${b.bottomY}H${x-b.bottomHalfWidth}Z`;
 return `<g data-ufo-flow="downward" opacity="${s.opacity}"><defs>
  <clipPath id="flowClip" clipPathUnits="userSpaceOnUse"><path d="${shape}"/></clipPath>
  <linearGradient id="flowFade" x1="0" y1="${b.topY}" x2="0" y2="${b.bottomY}" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset="${fadeStart}" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
  <mask id="flowMask" maskUnits="userSpaceOnUse" x="${x-b.bottomHalfWidth-5}" y="${b.topY}" width="${b.bottomHalfWidth*2+10}" height="${h}"><rect x="${x-b.bottomHalfWidth-5}" y="${b.topY}" width="${b.bottomHalfWidth*2+10}" height="${h}" fill="url(#flowFade)"/><g data-ufo-flow-ground-mask="five" transform="${camera}" fill="black">${ground.paths.map(d=>`<path d="${d}"/>`).join('')}</g></mask>
  <linearGradient id="flowTrail" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${flow.tailColor}" stop-opacity="0"/><stop offset=".3" stop-color="${flow.tailColor}" stop-opacity=".28"/><stop offset=".82" stop-color="${flow.headColor}"/><stop offset="1" stop-color="${flow.headColor}" stop-opacity=".52"/></linearGradient>
  <linearGradient id="flowHaze"><stop stop-color="${flow.beam.color}" stop-opacity="0"/><stop offset=".14" stop-color="${flow.beam.color}" stop-opacity=".6"/><stop offset=".5" stop-color="${flow.beam.color}"/><stop offset=".86" stop-color="${flow.beam.color}" stop-opacity=".6"/><stop offset="1" stop-color="${flow.beam.color}" stop-opacity="0"/></linearGradient>
  <filter id="flowGlow" x="-200%" y="-15%" width="500%" height="130%"><feGaussianBlur stdDeviation="1.1"/></filter>
 </defs><g clip-path="url(#flowClip)" mask="url(#flowMask)"><path data-ufo-flow-haze="soft" d="${shape}" fill="url(#flowHaze)" opacity="${flow.beam.opacity}"/>
 ${s.streaks.map(p=>`<g data-ufo-flow-streak="${p.id}" data-cycle="${p.cycle}" data-x="${p.x}" data-y="${p.y}" data-length="${p.length}" data-speed="${p.speed}" opacity="${p.opacity}"><rect x="${p.x-p.width/2}" y="${p.y-p.length}" width="${p.width}" height="${p.length}" rx="${p.width/2}" fill="url(#flowTrail)" stroke="${flow.tailColor}" stroke-opacity=".25" stroke-width="1.6" filter="url(#flowGlow)"/><rect data-ufo-flow-core="true" x="${p.x-p.width/2}" y="${p.y-p.length}" width="${p.width}" height="${p.length}" rx="${p.width/2}" fill="url(#flowTrail)"/></g>`).join('')}
 </g></g>`;
}
function fieldWide(t){
 const s=ufoDescentState(t),zoom=s.zoom;
 const camera=`translate(960 650) scale(${zoom}) translate(-960 -650)`;
 const lyric=t<87.84?tx('这无法无天的行径',960,795,112,'text-anchor="middle" textLength="1080" lengthAdjust="spacingAndGlyphs"'):tx('似曾相识',960,795,118,'text-anchor="middle"');
 return `<g data-scene="ufo-descent"><g transform="${camera}">${img('wide')}</g>${ufoFlowLayers(ufoFlowState(t))}${lyric}<g transform="${camera}">${descentPassengers(s)}</g><g transform="${camera}"><g data-ufo-craft="foreground">${ufo(s.ship.x,s.ship.y,s.ship.scale)}</g></g></g>`;
}
export function render(t){
 if(t>=85.05)return aperture(fieldWide(t));
 const q=C((t-81.666687)/(85.05-81.666687));
 const inner=`<rect width="1920" height="1080" fill="#000"/>${earth(725,528,1.09,q*2)}${ufo(M(1490,1170,q),M(598,676,q),M(2.1,.047,E(q)),M(-32,-16,q))}`+
 `<g opacity="${C((t-82.15)/.3)*C((84.88-t)/.25)}">${tx('和那目中无人',956,475,72,'text-anchor="middle"')}${tx('的神情',1080,562,72,'text-anchor="middle"')}</g>`;
 return aperture(inner);
}
