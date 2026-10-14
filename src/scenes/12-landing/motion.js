import {E,S,M,descentLine,descent,flow} from '../../sequences/scifi/shared.js';
export function ufoDescentState(t){
 const frame=t*60,active=frame>=descent.frameInterval[0]&&frame<descent.frameInterval[1];
 const q=E((t-85.05)/2.8),zoom=M(.985,1.025,q),ship={x:970,y:M(351,447,q),scale:M(.98,1.26,q)};
 const port={x:ship.x+descent.hatchLocal[0]*ship.scale,y:ship.y+descent.hatchLocal[1]*ship.scale};
 const projectedPort={x:960+(port.x-960)*zoom,y:650+(port.y-650)*zoom};
 return {frame,active,sourceCount:descent.sourceCount,requestedCount:descent.requestedCount,zoom,ship,port,projectedPort,
  passengers:active?descent.passengers.map(p=>{
   const offset=descentLine(p.feetOffsetKeys,frame),b=p.subjectBBox,scale=p.displayHeight/(b[3]-b[1])/zoom;
   const centerX=port.x+p.offsetX/zoom,feetY=port.y+offset/zoom;
   return {id:p.id,file:p.file,centerX,feetY,feetOffset:offset,displayHeight:p.displayHeight,
    image:{x:centerX-(b[0]+b[2])*.5*scale,y:feetY-b[3]*scale,width:p.width*scale,height:p.height*scale},
    projected:{centerX:projectedPort.x+p.offsetX,feetY:projectedPort.y+offset,topY:projectedPort.y+offset-p.displayHeight,width:(b[2]-b[0])*scale*zoom,height:p.displayHeight}};
  }):[]};
}
export function ufoFlowState(t){
 const frame=t*60,s=ufoDescentState(t),active=frame>=flow.activeStartFrame&&frame<flow.frameInterval[1]&&s.active;
 const hatch={...s.projectedPort},opacity=active?S((frame-flow.activeStartFrame)/(flow.fullOpacityFrame-flow.activeStartFrame)):0;
 const beam={topY:hatch.y+flow.beam.topOffset,bottomY:hatch.y+flow.beam.topOffset+flow.beam.height,topHalfWidth:flow.beam.topHalfWidth,bottomHalfWidth:flow.beam.bottomHalfWidth};
 const motionFrame=flow.activeStartFrame+Math.floor((frame-flow.activeStartFrame+1e-7)/flow.stepFrames)*flow.stepFrames;
 const elapsed=(motionFrame-flow.activeStartFrame)/60;
 const streaks=active?flow.lanes.map(l=>{
  const travel=elapsed*l.speed+l.phase*flow.cycleDistance,cycle=Math.floor(travel/flow.cycleDistance);
  const offset=travel-cycle*flow.cycleDistance+flow.spawnOffset;
  return {id:l.id,cycle,x:hatch.x+l.x,y:beam.topY+offset,length:l.length,width:l.width,opacity:l.opacity,speed:l.speed};
 }):[];
 return {frame,motionFrame,stepFrames:flow.stepFrames,active,opacity,hatch,beam,streaks,groundCameraZoom:s.zoom};
}
