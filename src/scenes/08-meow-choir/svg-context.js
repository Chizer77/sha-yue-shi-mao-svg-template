const escapeText = value => String(value).replace(/[&<>"']/g, char =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const initialState = () => ({matrix:[1,0,0,1,0,0],font:'10px sans-serif',
  globalAlpha:1,fillStyle:'#000',textAlign:'start',textBaseline:'alphabetic'});

function multiply(left, right) {
  const [a,b,c,d,e,f]=left,[g,h,i,j,k,l]=right;
  return [a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f];
}

// 只转换绘制指令，不在 SVG 端重新设计倾斜、拉伸或歌词运动。
export function createMeowSVGContext(measurementContext, glyph = null) {
  let current=initialState(),stack=[],elements=[];
  const context={
    reset(){current=initialState();stack=[];elements=[];},
    markup(){return elements.join('');},
    save(){stack.push({...current,matrix:[...current.matrix]});},
    restore(){current=stack.pop();},
    transform(...matrix){current.matrix=multiply(current.matrix,matrix);},
    translate(x,y){this.transform(1,0,0,1,x,y);},
    scale(x,y){this.transform(x,0,0,y,0,0);},
    measureText(text){
      if(glyph && text===glyph.text){
        const size=Number(current.font.match(/([\d.]+)px/)[1]);
        return {width:glyph.advance*size/glyph.unitsPerEm};
      }
      measurementContext.font=current.font;return measurementContext.measureText(text);
    },
    drawImage(image,x,y,width,height){
      let matrix=current.matrix;
      if(image.placement){
        matrix=multiply(matrix,image.placement);
        x=0;y=0;width=image.width;height=image.height;
      }
      elements.push(`<image data-meow-character="${escapeText(image.name)}" data-mouth="${image.mouth}" href="${escapeText(image.src)}" x="${x}" y="${y}" width="${width}" height="${height}" transform="matrix(${matrix.join(' ')})"/>`);
    },
    fillText(text,x,y){
      const [,weight,size,family]=current.font.match(/^(\d+)\s+([\d.]+)px\s+(.+)$/);
      if(glyph && text===glyph.text){
        const scale=Number(size)/glyph.unitsPerEm;
        const left=current.textAlign==='center'?x-glyph.advance*scale/2:x;
        const baseline=current.textBaseline==='middle'?y+(glyph.ascent+glyph.descent)*scale/2:y;
        // 直接使用源程序字体的轮廓，避免不同电脑回退到另一种“喵”字。
        elements.push(`<path data-meow-lyric="${escapeText(text)}" data-font-family="${glyph.family}" d="${glyph.path}" fill="${current.fillStyle}" opacity="${current.globalAlpha}" transform="translate(${left} ${baseline}) scale(${scale} ${-scale})"/>`);
        return;
      }
      const anchor=current.textAlign==='center'?'middle':'start';
      const baseline=current.textBaseline==='middle'?'central':'alphabetic';
      elements.push(`<text x="${x}" y="${y}" font-family="${escapeText(family)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" dominant-baseline="${baseline}" fill="${current.fillStyle}" opacity="${current.globalAlpha}" transform="matrix(${current.matrix.join(' ')})">${escapeText(text)}</text>`);
    },
  };
  for(const key of ['font','globalAlpha','fillStyle','textAlign','textBaseline']){
    Object.defineProperty(context,key,{get:()=>current[key],set:value=>{current[key]=value;}});
  }
  return context;
}
