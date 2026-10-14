const response=await fetch(new URL('./encounter.json',import.meta.url));
if(!response.ok)throw Error('无法读取正反打人物数据');
const data=await response.json();
const expressions=await fetch(new URL('./expressions.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('无法读取伸手镜头表情');return r.json();});
const urls=Object.fromEntries(Object.entries(data.sprites).map(([key,sprite])=>
  [key,new URL('../../../'+sprite.file,import.meta.url).href]));
const expressionURLs=expressions.files.map(file=>new URL('../../../'+file,import.meta.url).href);

function valueAt(keys,frame){
  if(frame<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++)if(frame<=keys[i][0]){
    const [a,b]=[keys[i-1],keys[i]],fraction=(frame-a[0])/(b[0]-a[0]);
    return a[1]+(b[1]-a[1])*fraction;
  }
  return keys.at(-1)[1];
}

export function encounterExpressionState(t){
  const progress=valueAt(expressions.expressionKeys,t*60);
  const amount=progress*(expressionURLs.length-1);
  const lower=Math.floor(amount),upper=Math.min(lower+1,expressionURLs.length-1);
  return {progress,smile:progress,lower,upper,blend:amount-lower,eyeAmount:progress};
}

function expressionArtwork(t){
  const state=encounterExpressionState(t);
  if(state.smile<=0)return '';
  const [x,y,width,height]=expressions.patchBox;
  const image=(index,opacity)=>`<image href="${expressionURLs[index]}" x="${x}" y="${y}" width="${width}" height="${height}" opacity="${opacity}"/>`;
  // 首张补片就是原始张嘴睁眼，完整覆盖后统一补间，避免再叠加嘴部透明度造成延迟。
  return `<g data-encounter-expression="smile" data-expression-progress="${state.progress}" data-eye-amount="${state.eyeAmount}">${image(state.lower,1)}${state.blend>0?image(state.upper,state.blend):''}</g>`;
}

function daylight(id){
  // 草地日光只轻微调冷暗部，避免沿用科技室的室内聚光。
  return `<defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".91 .02 .01 0 .005 .015 .96 .015 0 .008 .02 .035 .94 0 .008 0 0 0 1 0"/></filter></defs>`;
}

export function encounterPortrait(key,width,height,t=0){
  const sprite=data.sprites[key],p=sprite.placement,[nativeWidth,nativeHeight]=sprite.nativeSize;
  const id=`encounter-light-${key}`;
  // 新素材先等比放入旧人物坐标系，再沿用模板整体位移/形变，眼位不会跳变。
  return `<g data-protagonist-encounter="${key}" transform="scale(${width/sprite.targetSize[0]} ${height/sprite.targetSize[1]})">${daylight(id)}<g transform="translate(${p.x} ${p.y}) scale(${p.scale})" filter="url(#${id})"><image href="${urls[key]}" width="${nativeWidth}" height="${nativeHeight}"/>${key==='front'?expressionArtwork(t):''}</g></g>`;
}

export function encounterPortraitBounds(key,width,height){
  const sprite=data.sprites[key],p=sprite.placement;
  const scaleX=width/sprite.targetSize[0],scaleY=height/sprite.targetSize[1];
  // 蒙版必须跟随替换人物的实际放大和偏移，不能继续使用旧人物的矩形宽度。
  return {x:p.x*scaleX,y:p.y*scaleY,width:sprite.nativeSize[0]*p.scale*scaleX,height:sprite.nativeSize[1]*p.scale*scaleY};
}

export function encounterBack(){
  const w=data.sprites.back.world;
  // 前景仍有背光压暗，但保留金发的暖黄关系，避免蓝绿色通道增益把头发染灰。
  return `<g data-protagonist-encounter="back"><defs><filter id="encounter-light-back" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".72 0 0 0 0 0 .70 0 0 0 0 0 .64 0 0 0 0 0 1 0"/></filter></defs><image href="${urls.back}" x="${w.x}" y="${w.y}" width="${w.width}" height="${w.height}" filter="url(#encounter-light-back)"/></g>`;
}
