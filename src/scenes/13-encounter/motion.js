import {descentLine,landing,handShotMotion} from '../../sequences/scifi/shared.js';
export function landingState(t){
 const frame=t*60,active=frame>=landing.frameInterval[0]&&frame<landing.frameInterval[1];
 const figures=active?landing.figures.map(p=>{
  const dy=descentLine(p.dyKeys,frame),blur=descentLine(p.blurKeys,frame),bottom=p.y+dy+p.height;
  const cropFade=frame<landing.cropHandling.fadeEndFrame?landing.cropHandling.maximumFeatherPx*(landing.cropHandling.fadeEndFrame-frame)/(landing.cropHandling.fadeEndFrame-landing.frameInterval[0]):0;
  return {id:p.id,assetId:p.assetId,x:p.x,y:p.y+dy,dy,width:p.width,height:p.height,blur,cropFade};
 }):[];
 return {frame,active,figures,lightOpacity:active?descentLine(landing.light.opacityKeys,frame):0};
}
export function handShotState(t){
 const frame=t*60;
 return {x:descentLine(handShotMotion.positionX,frame),y:descentLine(handShotMotion.positionY,frame),topBars:descentLine(handShotMotion.topBars,frame),bottomBars:descentLine(handShotMotion.bottomBars,frame)};
}
