// Measured source-frame curves, transferred to each supplied character's scale.
const data=await fetch(new URL('./motion.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Character motion data unavailable');return r.json();});
const sample=(keys,f)=>{if(f<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++){if(f<=keys[i][0]){const [a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*(f-a)/(b-a);}}return keys.at(-1)[1];};
export function characterMotion(kind,localFrame){const track=data.tracks[kind];if(!track)throw Error('Unknown motion track '+kind);const amount=sample(track.amplitude_gate,localFrame);const values=Object.fromEntries(Object.entries(track.channels).map(([k,v])=>[k,sample(v,localFrame)*(['arm','armRest'].includes(k)&&track.arm_channel_has_independent_gate?1:amount)]));const {bodyY=0,...motion}=values;return {bodyY,motion};}
export const characterMotionData=data;
