import {composeAt,project,definitions} from '../composition/frame.js';
import {renderProtagonistStage,initialiseProtagonistDialogueStage} from './dialogue-stage.js';
import {prepareResources,settleFrame} from './resources.js';
import {serializeSVG} from './svg-export.js';
import {meowTiming} from '../scenes/08-meow-choir/characters.js';

export function createStage(stage){
 const content=stage.querySelector('#stage-content'),events=new EventTarget();let state=null;
 stage.querySelector('#stage-defs').innerHTML=definitions;
 function renderAt(time,{playing=false}={}){
  state=composeAt(time);renderProtagonistStage(content,state.body,{playing});
  Object.assign(stage.dataset,{frame:String(state.frame),unit:String(state.unit.id),time:state.time.toFixed(9)});
  events.dispatchEvent(new CustomEvent('frame',{detail:state}));return state;
 }
 const ready=(async()=>{
  initialiseProtagonistDialogueStage(content);
  // 只预载全片实际引用的素材，历史候选图不进入播放缓存。
  const inventory=await fetch(new URL('../../config/media.json',import.meta.url)).then(response=>response.json());
  await prepareResources(inventory.assets.map(asset=>new URL('../../'+asset.file,import.meta.url).href));return renderAt(0);
 })();
 const renderFrame=frame=>{
  if(!Number.isFinite(frame))throw new TypeError('帧号必须是有限数值');
  return renderAt(Math.max(0,Math.min(project.frameCount-1,Math.floor(frame)))/project.fps);
 };
 return {project,events,ready,renderAt,renderFrame,meowTiming,settle:()=>settleFrame(content),
  exportSVG:options=>serializeSVG(stage,options),get state(){return state;}};
}
