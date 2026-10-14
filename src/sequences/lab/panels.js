// Supplied scene derivatives and editable panel labels, driven by parent scene time.
const data=await fetch(new URL('./panels.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Missing revision20 scene data');return r.json();});
const urls=Object.fromEntries(Object.entries(data.images).map(([key,path])=>[key,new URL('../../../'+path,import.meta.url).href]));
const raster=key=>`<image href="${urls[key]}" width="1920" height="1080" preserveAspectRatio="none"/>`;
function panelLabel(label){
 let x=0;const glyphs=[...label.text].map((c,i)=>{const glyph=data.glyphs[c];if(!glyph)throw Error('Missing panel glyph '+c);const result=`<path d="${glyph.path}" transform="translate(${x} ${label.jitter[i]??0})"/>`;x+=glyph.advance;return result;}).join('');
 return `<g data-panel-label="${label.text}" aria-label="${label.text}" transform="translate(${label.x} ${label.y})" fill="none" stroke="#f1faf4" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${glyphs}</g>`;
}
const lettering=await fetch(new URL('../../../assets/props/board-lettering.svg',import.meta.url)).then(response=>response.text());
const boardLettering=lettering.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
export function renderRoomBackdrop(){return `<g data-panel-scene="room-backdrop">${raster('room')}${data.labels.map(panelLabel).join('')}${boardLettering}</g>`;}
export function renderTomatoOutline(kind){
 const layout=data.charms[kind],c=data.charm;
 return `<g data-prop20="${kind}" data-source-asset="tomato-wand" transform="translate(${layout.x} ${layout.y}) scale(${layout.scale}) translate(${-c.anchor[0]} ${-c.anchor[1]})"><path d="${c.path}" fill="${layout.fill}" stroke="${layout.stroke??'none'}" stroke-width="${layout.strokeWidth??0}" ${layout.dash?`stroke-dasharray="${layout.dash}"`:''} stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
function bubbleMascot(){
 const p=data.bubbleMascot;
 // 干净角色独立放在解释框里，不携带原表情包的文字、水印或原猫图层。
 return `<image data-bubble-mascot="marshtomp-protagonist" href="${urls.bubbleMascot}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="xMidYMid meet"/>`;
}
export function renderExplanationBubble(){return `<g data-panel-scene="tomato-toy-diagram">${raster('bubble')}${renderTomatoOutline('bubble')}${bubbleMascot()}</g>`;}
export const panelData=data;
