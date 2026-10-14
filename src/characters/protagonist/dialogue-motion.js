import {track} from '../../core/svg.js';

const dialogueData=await fetch(new URL('../../sequences/chorus/dialogue.json',import.meta.url)).then(response=>response.json());
const dialogue=dialogueData.refrains.find(part=>part.offset_frames===0);
const start=dialogue.start_frame,end=dialogue.end_frame;
const rawFrames=Array.from({length:end-start},()=>null);
const radius=5,sigma=2;
const weights=Array.from({length:radius*2+1},(_,index)=>Math.exp(-.5*((index-radius)/sigma)**2));
const weightSum=weights.reduce((sum,weight)=>sum+weight,0);
const bound=index=>Math.max(0,Math.min(rawFrames.length-1,index));

function smoothChannel(read){
 const source=rawFrames.map((motion,index)=>read(motion,start+index));
 // 对称滤波消除测量噪声，不引入播放状态或向后的时间延迟。
 return source.map((_,index)=>weights.reduce((sum,weight,offset)=>sum+source[bound(index+offset-radius)]*weight,0)/weightSum);
}
function interpolate(values,frame){
 const position=Math.max(0,Math.min(values.length-1,frame-start)),lower=Math.floor(position),fraction=position-lower;
 const previous=values[bound(lower-1)],current=values[lower],next=values[bound(lower+1)],after=values[bound(lower+2)];
 const tangent=(next-previous)/2,nextTangent=(after-current)/2,square=fraction*fraction,cube=square*fraction;
 // 连续切线让小数帧和关键帧交界处保持相同的运动速度。
 return (2*cube-3*square+1)*current+(cube-2*square+fraction)*tangent+(-2*cube+3*square)*next+(cube-square)*nextTangent;
}
const stageChannels=Object.fromEntries(['characterX','characterY','headAngle','headY'].map(name=>[name,
 smoothChannel((_,frame)=>track(dialogue.channels[name],frame))
]));

export function protagonistDialogueMotion(frame){
 const stage=Object.fromEntries(Object.entries(stageChannels).map(([name,values])=>[name,interpolate(values,frame)]));
 return stage;
}
