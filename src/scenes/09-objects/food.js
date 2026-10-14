const data=await fetch(new URL('./food.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Missing renderFood.json');return r.json();});
const urls=Object.fromEntries(Object.entries(data.foods).map(([k,a])=>[k,new URL('../../../'+a.file,import.meta.url).href]));
export const food23Data=data;
export function food23State(key,x,bottom){
 const a=data.foods[key];if(!a)throw Error('Unknown renderFood '+key);
 const scale=a.scale,image={x:x-a.anchor[0]*scale,y:bottom-a.anchor[1]*scale,width:a.nativeSize[0]*scale,height:a.nativeSize[1]*scale};
 const box=b=>({x:image.x+b[0]*scale,y:image.y+b[1]*scale,width:(b[2]-b[0])*scale,height:(b[3]-b[1])*scale});
 return {key,assetId:a.assetId,file:a.file,anchor:{x,bottom},nativeAnchor:a.anchor,scale,rotation:0,mirror:false,image,visibleEntity:box(a.layoutEntityBBox),body:box(a.mainBodyBBox),preserveOriginalAlpha:true};
}
export function renderFood(key,x,bottom){const s=food23State(key,x,bottom),b=s.image;return `<g data-food23="${key}" data-asset-id="${s.assetId}" data-source="supplied-artwork" data-anchor-x="${x}" data-anchor-bottom="${bottom}" data-native-scale="${s.scale}"><image href="${urls[key]}" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" preserveAspectRatio="xMidYMid meet"/></g>`;}
