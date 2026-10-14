const data=await fetch(new URL('./miniature.json',import.meta.url)).then(response=>response.json());
const url=file=>new URL('../../../'+file,import.meta.url).href;
const bitmap=asset=>`<image href="${url(asset.file)}" width="${asset.nativeSize[0]}" height="${asset.nativeSize[1]}"/>`;
function restoredTrio(a){
 const w=a.world,[width,height]=a.nativeSize,sticker=a.faceSticker;
 // 贴纸跟随整个解释三人图层缩放，定位在右侧伸手代表脸上。
 const overlay=sticker?`<g data-mini-face-sticker="captain-censored" transform="translate(${sticker.center.join(' ')}) rotate(${sticker.rotation})"><image href="${url(sticker.file)}" x="${-sticker.width/2}" y="${-sticker.height/2}" width="${sticker.width}" height="${sticker.height}"/></g>`:'';
 return `<g transform="translate(${w.x} ${w.y}) scale(${w.width/width} ${w.height/height})">${bitmap(a)}${overlay}</g>`;
}
export function renderMiniRepresentatives(time){const frame=time*60;if(frame<data.frameInterval[0]||frame>=data.frameInterval[1])return '';return `<g data-scene="representatives-explanation" data-frame="${frame}">${restoredTrio(data.restoredGroup)}</g>`;}
