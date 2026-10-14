import {renderDisplayFrame} from '../../effects/display-frame.js';
import {createMeowRenderer} from './renderer.js';
import {createMeowSVGContext} from './svg-context.js';
import {createMeowTimingController} from './timing.js';

const response=await fetch(new URL('./song.json',import.meta.url));
if(!response.ok)throw Error('无法读取实时喵喵合唱数据');
const data=await response.json();
const settingsResponse=await fetch(new URL('../../../config/meow-adjustments.json',import.meta.url));
if(!settingsResponse.ok)throw Error('无法读取工程喵喵偏移');
const settings=await settingsResponse.json();
data.songTimeOffset=settings.songTimeOffsetSeconds??data.songTimeOffset;
for(const key of ['mouthTimeOffsetSeconds','lyricTimeOffsetSeconds'])data.canvas[key]=settings[key]??data.canvas[key];
// 导出只读取工程配置，避免浏览器私有存储覆盖已经保存的制作参数。
const exporting=typeof location!=='undefined'&&new URLSearchParams(location.search).has('export');
export const meowTiming=createMeowTimingController(data,exporting?null:undefined);
const assets=new URL('../../../assets/characters/protagonist-dark/',import.meta.url);
const mouthAssets=new URL(data.mouthAssetFolder||'../../../assets/characters/protagonist-dark/',import.meta.url);
const spectatorURL=new URL('choir-spectator.png',assets).href;
const characters=[...data.characters].sort((left,right)=>left.trackIndex-right.trackIndex);
const song={tracks:characters.map(character=>character.track)};
const context=createMeowSVGContext(null,data.glyph);
const renderer=createMeowRenderer(context,song,data.canvas);
const descriptor=(character,mouth)=>({src:new URL(character[mouth],mouthAssets).href,
  name:character.name,mouth,width:character.width,height:character.pixelHeight,
  placement:character.placement});
const configurations=characters.map(character=>({...character,
  closedImage:descriptor(character,'closed'),openImage:descriptor(character,'open')}));

export function meowState(t){
  const states=renderer.states(t+data.songTimeOffset,configurations);
  const named=new Map(characters.map((character,index)=>[character.name,states[index]]));
  return data.characters.map(character=>({name:character.name,...named.get(character.name)}));
}

export function meowSlotWorld(t){
  // 直接读取歌曲的绝对时间；51.3秒进入时不会重播前面的音符。
  context.reset();renderer.frame(t+data.songTimeOffset,configurations);
  const view=data.viewport;
  // 合唱层保持透明，让模板背景及其转场颜色直接透出。
  return `<svg data-meow-canvas x="${view.x}" y="${view.y}" width="${view.width}" height="${view.height}" viewBox="0 0 ${data.canvas.width} ${data.canvas.height}" overflow="hidden">`
    +`<g data-meow-art>${context.markup()}</g></svg>`;
}

export function meowScreen(t){return `<g data-meow-viewport>${renderDisplayFrame(t,meowSlotWorld(t))}</g>`;}
export function wrapMeowScene(t,body){return `<!--protagonist-meow:${JSON.stringify({time:t})}-->${body}<!--protagonist-meow:end-->`;}
export function choirSpectator(){return `<image data-protagonist-spectator="eri" href="${spectatorURL}" x="1472" y="649" width="466" height="620" preserveAspectRatio="xMidYMin meet"/>`;}
