export const W=1920, H=1080;
export const palette={yellow:'#FCB900',purple:'#6B3F94',teal:'#67BCB6',deepTeal:'#33746E',cyan:'#54C9E0',cream:'#F5F1E7',white:'#FDFDFD',gray:'#969794',ink:'#343737'};
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=x=>{x=clamp(x);return 1-(1-x)**3;};
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const g=(body,transform='',attrs='')=>`<g${transform?` transform="${transform}"`:''} ${attrs}>${body}</g>`;
export const text=(value,x,y,size=80,fill='#fff',attrs='')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="MV Sans" ${attrs.includes("font-weight")?"":'font-weight="900"'} font-size="${size}" ${attrs}>${esc(value)}</text>`;
export const serif=(value,x,y,size=80,fill='#fff',attrs='')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="MV Serif" ${attrs.includes("font-weight")?"":'font-weight="900"'} font-size="${size}" ${attrs}>${esc(value)}</text>`;
export const background=color=>`<path d="M0 0H1920V1080H0Z" fill="${color}"/>`;
export function track(keys,t){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){let a=keys[i-1],b=keys[i];let q=(t-a[0])/(b[0]-a[0]);if(b[2]==='hold')q=0;else if(b[2]==='ease')q=ease(q);else if(b[2]==='smooth')q=smooth(q);return mix(a[1],b[1],q);}}return keys.at(-1)[1];}
export function handFrame(t){let d=track([[0,0],[.2,3],[.42,-2],[.68,1],[1,0]],((t%1)+1)%1);return `<path d="M143 ${75+d} L839 ${65-d} L1484 ${70+d} L1788 ${66-d} L1797 552 L1782 ${1017+d} L1121 1030 L720 1017 L139 1020 L125 750Z" fill="none" stroke="#e8fffa" stroke-width="5" stroke-linejoin="round"/>`;}
export function alien(x,y,s=1,color='#bbbcb4',gesture=0){return g(`<path d="M-15 -44q-3 -35 -17 -39m55 39q12 -21 2 -36" stroke="${color}" stroke-width="7" fill="none"/><path d="M-43 57 L-69 176Q-73 190 -61 192L-43 160L-34 282L1 291L8 271L21 290L54 279L45 154L64 188Q76 194 78 178L46 53Z" fill="${color}"/><ellipse cy="15" rx="56" ry="59" fill="${color}"/><ellipse cx="-18" cy="13" rx="4.3" ry="7" fill="#77796f"/><ellipse cx="22" cy="13" rx="4.3" ry="7" fill="#77796f"/>`, `translate(${x} ${y}) scale(${s}) rotate(${gesture})`);}
export const commonDefs=`<filter id="soft4" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="4"/></filter><filter id="soft16" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter><linearGradient id="creamShade" x2="0" y2="1"><stop stop-color="#fffbee"/><stop offset="1" stop-color="#ece2c6"/></linearGradient>`;
