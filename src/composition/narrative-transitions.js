import {C,clamp,lerp,ease,esc,use,rect,tx,vertical,keys,poseKeys,bodyTrack,choirBackdrop,native,motion,timeline,phoneScene,treeScene,photoScene,renderDisplayTitle,meowScreen,meowState,choirSpectator,wrapMeowScene,bedArtwork,bedExpression,thinkingArtwork,thinkingExpression,thinkingCameraState,phoneState,treeSceneState,photoState} from '../sequences/narrative/shared.js';
import {bed} from '../scenes/03-bed/scene.js';
import {game} from '../scenes/08-meow-choir/scene.js';
export function narrativeTransition(t, ctx) {
  // Continuous transitions confirmed by source boundary sheets. The sequence
  // intentionally overlaps phone/hand and incoming bed instead of a hard cut.
  if(t>=19.8&&t<20.75){
    const bx=keys([[19.8,1920],[19.85,1790],[19.9833333,1320],[20.15,1130],[20.25,1000],[20.6,100],[20.75,0]],t);
    return rect(0,0,1920,1080,C.purple)+phoneScene(t,false)+`<g transform="translate(${bx} 0)">${bed(t,ctx,false)}</g>`;
  }
  if(t>=23.6&&t<24.15){
    return rect(0,0,1920,1080,'#68bcb7')+bed(t,ctx,false)+treeScene(t,{background:false});
  }
  if(t>=51.3&&t<51.5166666667){
    const u=clamp((t-51.3)/.2166666667);
    return rect(0,0,1920,1080,choirBackdrop(t))+`<path d="M${960-820*u} 540H${960+820*u}" stroke="#e3f8e2" stroke-width="${3+u*6}"/>`;
  }
  if(t>=51.5166666667&&t<51.8){
    const sy=ease((t-51.5166666667)/.2833333333);
    return rect(0,0,1920,1080,choirBackdrop(t))+`<g transform="translate(0 ${540*(1-sy)}) scale(1 ${sy})">${game(t,ctx)}</g>`;
  }
  return null;
}
