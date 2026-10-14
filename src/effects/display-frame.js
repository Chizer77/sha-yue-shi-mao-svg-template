const titleMotion=await fetch(new URL('../scenes/08-meow-choir/display-motion.json',import.meta.url)).then(r=>r.json());
const glyphs=await fetch(new URL('../scenes/08-meow-choir/title-glyphs.json',import.meta.url)).then(r=>r.json());
const between=(frame,range)=>frame>=range[0]&&frame<range[1];
export function line(keys,f){if(f<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(f<=keys[i][0])return keys[i-1][1]+(keys[i][1]-keys[i-1][1])*(f-keys[i-1][0])/(keys[i][0]-keys[i-1][0]);return keys.at(-1)[1];}
export function renderDisplayFrame(t,world){
 const f=Math.round(t*60);
 const screenPath='M324 62H1596Q1755 62 1755 218V889Q1755 1022 1624 1022H299Q164 1022 164 886V220Q164 62 324 62Z';
 const amp=f<3138?Math.max(0,(3138-f)/30)*30:0;
 let content=`<defs><clipPath id="game-screen-clip"><path d="${screenPath}"/></clipPath><filter id="game-entry-wave" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".003 .045" numOctaves="1" seed="7" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="${amp}" xChannelSelector="R" yChannelSelector="B"/></filter></defs><g clip-path="url(#game-screen-clip)" ${amp>0?'filter="url(#game-entry-wave)"':''}>${world}</g>`;
 const wave=(i,a)=>Math.sin(f*.06+i*2.14)*a;
 content+=`<path d="M${137+wave(0,10)} 61Q508 ${62+wave(1,13)} 966 64T1780 70Q${1776+wave(2,9)} 433 1791 568Q1797 811 1786 1009Q1370 ${1020+wave(3,9)} 974 1024Q555 ${1015+wave(4,10)} 142 1019Q${111+wave(5,9)} 797 125 557Q141 266 ${137+wave(0,10)} 61Z" fill="none" stroke="#e9ffed" stroke-width="6"/>`;
 if(f<3138){const z=line([[3091,.60],[3108,.79],[3120,.90],[3130,.98],[3138,1]],f);content=`<g transform="translate(${960*(1-z)} ${540*(1-z)}) scale(${z})">${content}</g>`;}
 return content;
}
function glyph(char,x,y,w,h){const g=glyphs.glyphs[char];return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${g.viewBox.join(' ')}" preserveAspectRatio="none" overflow="visible" data-title-text="${char}"><path d="${g.path}" transform="scale(1 -1)" fill="#fffef8"/></svg>`;}
export function renderDisplayTitle(t){const f=Math.round(t*60),title=titleMotion;let str='';
 if(between(f,[3138,3180]))str+=glyph('人',-27,line(title.human.topYFrames,f),656,504);
 if(between(f,[3150,3180]))str+=glyph('は',654,line(title.ha.topYFrames,f),602,474);
 if(between(f,[3178,3230])){const opacity=line(title.cat.opacityFramesApprox,f),a=line([[3178,-500],[3182,-110],[3187,-32],[3193,-14],[3213,0]],f),b=line([[3178,500],[3182,100],[3187,32],[3193,14],[3213,0]],f);
  str+=`<g opacity="${opacity}"><defs><clipPath id="game-cat-upper"><path d="M0 0H840V312H290V700H0Z"/></clipPath><clipPath id="game-cat-lower"><rect x="290" y="312" width="550" height="388"/></clipPath></defs><g transform="translate(174 ${56+a})" clip-path="url(#game-cat-upper)">${glyph('猫',0,0,828,662)}</g><g transform="translate(174 ${56+b})" clip-path="url(#game-cat-lower)">${glyph('猫',0,0,828,662)}</g></g>`;}
 return str;
}
