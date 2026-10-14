import {avatarURL,phoneArtwork} from './assets.js';
const names={hand:'props/phone/hand.png'};
const url=k=>new URL('../../../assets/'+names[k],import.meta.url).href;
let data;
export const ready=fetch(new URL('./motion.json',import.meta.url)).then(response=>{if(!response.ok)throw Error('无法读取手机动画参数');return response.json();}).then(value=>{data=value;});
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function keys(k,t){if(t<=k[0][0])return k[0][1];for(let i=1;i<k.length;i++)if(t<=k[i][0]){const u=(t-k[i-1][0])/(k[i][0]-k[i-1][0]);return k[i-1][1]+(k[i][1]-k[i-1][1])*u;}return k.at(-1)[1];}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text=(s,x,y,size,more='')=>`<text x="${x}" y="${y}" font-family="'MV Serif',serif" font-size="${size}" font-weight="900" ${more.includes('fill=')?'':'fill="#fffff9"'} ${more.includes('stroke=')?'':`stroke="${more.includes('fill=')?'#350557':'#fffff9'}" stroke-width="${size*.026}" paint-order="stroke fill" stroke-linejoin="round"`} ${more}>${esc(s)}</text>`;
const rect=(x,y,w,h,c,more='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${more}/>`;
const fade=(t,a,b)=>smooth((t-a)/(b-a));
const native=(k,transform='')=>`<g data-formal-asset="${names[k]}" transform="${transform}"><image href="${url(k)}" x="0" y="0" width="1920" height="1080"/></g>`;
function vertical(s,x,y,size,spacing=size*1.15){return [...s].map((c,i)=>text(c,x,y+i*spacing,size,'text-anchor="middle"')).join('');}
function headline(t){
 const e=data.headlineEvents;let s='';
 if(t>=e.dingEntry&&t<e.dingFadeEnd){
  const layout=data.dingLayout;
  const dx=keys(layout.xKeys,t);
  const alpha=1-fade(t,e.dingFadeStart,e.dingFadeEnd);
  // Fit actual ink bounds, since equal font sizes do not reproduce the source's two glyph proportions.
  const glyph=(dy=0,outlined=false)=>`<g transform="translate(0 ${dy})">${layout.glyphs.map(g=>`<g data-headline-glyph="${g.text}" transform="matrix(${g.matrix.join(' ')})">${text(g.text,g.x,g.y,g.size,`${g.rotate?`transform="rotate(${g.rotate.join(' ')})"`:''} ${outlined?'fill="none" stroke="#c0a4d1" stroke-width="1.1"':''}`)}</g>`).join('')}</g>`;
  s+=`<g data-phone-headline="ding-dong" transform="translate(${dx} 0)" opacity="${alpha}">${layout.outlineOffsets.map(d=>`<g opacity=".30">${glyph(d,true)}</g>`).join('')}${glyph()}</g>`;
 }
 // Separate dark echoes are real text events, not a repeating text oscillator.
 for(const a of [{time:14.416667,end:15.42,text:'叮',x:1542,y:280,angle:0},{time:14.683333,end:15.38,text:'叮',x:420,y:280,angle:0},{time:14.883333,end:15.43,text:'咚',x:1542,y:741,angle:16},{time:15.1,end:15.55,text:'咚',x:407,y:741,angle:16}]){
  if(t>=a.time&&t<a.end)s+=`<g opacity="${1-fade(t,a.end-.32,a.end)}">${text(a.text,a.x,a.y,162,`fill="#350557" text-anchor="middle" transform="rotate(${a.angle} ${a.x} ${a.y})"`)}</g>`;
 }
 if(t>=e.orderFadeIn[0]&&t<e.orderFadeOut[1])s+=`<g opacity="${fade(t,...e.orderFadeIn)*(1-fade(t,...e.orderFadeOut))}">${vertical('收到总部',1650,352,120,144)}${vertical('命令',1510,268,120,142)}</g>`;
 if(t>=e.blueStarFadeIn[0]&&t<e.blueStarOut)s+=`<g opacity="${fade(t,...e.blueStarFadeIn)}">${text('前往蓝星',355,315,223,'letter-spacing="60" textLength="1270" lengthAdjust="spacing"')}</g>`;
 if(t>=e.investigationFadeIn[0]&&t<e.investigationFadeOut[1])s+=`<g opacity="${Math.pow(clamp((t-e.investigationFadeIn[0])/.42),.7)*(1-fade(t,...e.investigationFadeOut))}">${text('调查人类习性',198,289,210,'letter-spacing="15" textLength="1516" lengthAdjust="spacing"')}</g>`;
 return s;
}
function messageIcon(index){
 const id=`phone-avatar-${index}`;
 return `<clipPath id="${id}"><rect width="81" height="82" rx="15"/></clipPath><image data-asset-id="protagonist-phone-avatar" data-role="message-avatar" href="${avatarURL}" width="81" height="82" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}
function notifications(t){
 const l=data.noticeLayout;const entries=data.notices.filter(e=>t>=e.time);let s='';
 for(let n=0;n<entries.length;n++){
  const e=entries[n],age=t-e.time;let y=l.y;
  // First notice rises from below. Later notices fade at the top while the existing stack moves down first.
  for(let j=n+1;j<data.notices.length;j++)y+=l.step*keys([[0,0],[.08,.48],[.18,1.09],[.28,.99],[.38,1]],t-data.notices[j].time+.06);
  const local=n===0?keys([[0,222],[.1,90],[.2,29],[.3,-8],[.4,0]],age):0;y+=local;
  const opacity=n===0?clamp((age+.025)/.26):clamp(age/.12);
  s+=`<g data-phone-notice="${n}" transform="translate(${l.x} ${y})" opacity="${opacity}">${rect(0,0,l.width,l.height,'#e1f2ef','rx="21"')}<g transform="translate(20 18)">${messageIcon(n)}</g><text x="117" y="43" font-family="'MV Sans',sans-serif" font-size="26" fill="#79968d">总部</text><text x="117" y="78" font-family="'MV Sans',sans-serif" font-size="26" fill="#90aaa3">${esc(e.text)}</text></g>`;
 }
 return s;
}
function device(t){
 const top=309+771*Math.pow(1-clamp((t-13)/1),2.5),y=top-309;
 // 日期、时间和通知中心已从原手机图片提取合成，仅消息卡片继续用 SVG。
 return `<g data-phone-device="true" transform="translate(0 ${y})">${phoneArtwork()}<clipPath id="phone-r3-notify-clip"><path d="M674 677H1224V1420H674Z"/></clipPath><g clip-path="url(#phone-r3-notify-clip)">${notifications(t)}</g></g>`;
}
export function phoneScene(t,bg=true){
 if(!data)throw Error('Await phone-scene ready before rendering');
 if(!Number.isFinite(t))throw TypeError('phoneScene requires a finite absolute time');
 const x=keys(data.exitX,t),a=keys(data.exitRotation,t);
 let subject=device(t);
 if(t>=19.1)subject+=`<g transform="translate(${keys(data.handX,t)} 30) scale(.98)">${rect(0,1078,1480,630,'#f6eee2')}${native('hand')}</g>`;
 return (bg?rect(0,0,1920,1080,data.background):'')+headline(t)+`<g data-phone-exit="true" transform="translate(${x} 0) rotate(${a} 950 670)">${subject}</g>`;
}
export function phoneState(t){if(!data)throw Error('Await ready');return {time:t,top:309+771*Math.pow(1-clamp(t-13),2.5),exitX:keys(data.exitX,t),rotation:keys(data.exitRotation,t),notices:data.notices.filter(e=>t>=e.time).map(e=>e.text),handX:t>=19.1?keys(data.handX,t):null};}
