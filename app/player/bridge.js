import {MEOW_TIMING_STORAGE_KEY} from '../../src/scenes/08-meow-choir/timing.js';

export function exposeAnimation(renderer,playback){
 const api={ready:renderer.ready,project:renderer.project,duration:renderer.project.duration,
  fps:renderer.project.fps,frameCount:renderer.project.frameCount,
  renderFrame:renderer.renderFrame,renderAt:renderer.renderAt,exportSVG:renderer.exportSVG,
  get frameReady(){return renderer.settle();},
  play:playback.play,pause:playback.pause,seek:playback.seek,reset:playback.reset,
  setPlaybackRate:playback.setPlaybackRate,get playbackRate(){return playback.playbackRate;},
  get time(){return playback.time;},get playing(){return playback.playing;}};
 api.meowTiming={...renderer.meowTiming,
  set(values){const value=renderer.meowTiming.set(values);renderer.renderAt(playback.time);return value;},
  reset(){const value=renderer.meowTiming.reset();renderer.renderAt(playback.time);return value;}};
 window.animation=api;window.renderFrame=api.renderFrame;window.setTime=api.renderAt;
 window.addEventListener('storage',event=>{
  if(event.key!==MEOW_TIMING_STORAGE_KEY)return;
  renderer.meowTiming.loadSaved();renderer.ready.then(()=>renderer.renderAt(playback.time));
 });
 window.addEventListener('message',event=>{
  if(event.origin===location.origin&&event.data?.type==='seek')renderer.ready.then(()=>playback.seek(Number(event.data.time)));
 });
 return api;
}
