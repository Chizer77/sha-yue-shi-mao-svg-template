const credits=await fetch(new URL('../../../config/credits.json',import.meta.url)).then(response=>response.json());
import {C,E,S,M,esc,tx,earth,room} from '../../sequences/scifi/shared.js';
function creditTitle(label,name,t,start,end){
 let a=E((t-start)/.3)*C((end-t)/.28),chars=C((t-start-.4)/.32)*name.length;
 if(a<=0)return '';
 let shown=name.slice(0,Math.ceil(chars));
 if(t>end-.55)shown=name.slice(0,Math.max(0,Math.ceil(name.length*(end-t)/.55)));
 return `<g opacity="${a}">${tx(label,960,425,55,'font-family="MV Sans" text-anchor="middle"')}${tx(shown,960,706,231,'font-family="MV Sans" text-anchor="middle" letter-spacing="8"')}</g>`;
}
function secondaryCreditExit(t){
 // 沿用片尾从右向左消字的节奏；完整姓名占位，避免长署名删除时左右跳动。
 if(t>=7939/60)return '';
 const fullName=credits.editor.name,progress=C((t-7927/60)/((7936-7927)/60));
 const count=t<7927/60?fullName.length:Math.ceil(fullName.length*(1-progress));
 const labelCount=t<132.1166666667?2:t<132.2333333333?1:0;
 const label=credits.editor.label.slice(0,labelCount),name=fullName.slice(0,count);
 const advance=letter=>(/[A-Z]/.test(letter)?166:231)+8;
 const fullWidth=[...fullName].reduce((sum,letter)=>sum+advance(letter),0);
 const cursorX=960-fullWidth/2+[...name].reduce((sum,letter)=>sum+advance(letter),0);
 return tx(label,960,425,55,'font-family="MV Sans" text-anchor="middle"')+
   `<text x="960" y="706" fill="#f7faf1" font-family="MV Sans" font-weight="900" font-size="231" text-anchor="middle" letter-spacing="8"><tspan>${esc(name)}</tspan><tspan opacity="0">${esc(fullName.slice(count))}</tspan></text>`+
   `<rect x="${cursorX}" y="680" width="115" height="26" fill="#f7faf1"/>`;
}
function endingCredits(t){
 // 模板署名压缩至1.5秒，复用同一动画，再留出二改署名的展示和原片尾消字时间。
 if(t<129)return `<g data-ending-credit="music-video">${creditTitle(credits.original.label,credits.original.name,t,125.9,128.95)}</g>`;
 if(t<130.5)return `<g data-ending-credit="template">${creditTitle(credits.template.label,credits.template.name,129+(t-129)*2,129,132)}</g>`;
 return `<g data-ending-credit="secondary">${t<131.9?creditTitle(credits.editor.label,credits.editor.name,t,130.5,132.5):secondaryCreditExit(t)}</g>`;
}
function filmTransition(t,ctx){
 let blend=S((t-124.8)/.7),phase=(t-124.8),strips=Array.from({length:7},(_,i)=>`<rect x="${i*283+Math.sin(i*23)*15}" width="1.5" height="1080" fill="#554b46" opacity=".12"/>`).join('');
 let opacity=C(Math.sin(C(phase/.7)*Math.PI)*.88);
 return `<g opacity="${1-blend}">${room(t,ctx,{credits:true})}</g><g opacity="${blend}"><rect width="1920" height="1080" fill="#000"/>${earth(960,545,.99)}</g><g opacity="${opacity}"><rect width="1920" height="1080" fill="#a68877" opacity=".36"/><ellipse cx="${M(1980,-300,blend)}" cy="490" rx="1200" ry="850" fill="url(#sfLeak)"/>${strips}</g>`;
}
export function render(t,ctx){
 if(t<118.9)return room(t,ctx,{credits:true});
 if(t<124.8)return room(t,ctx,{credits:true})+creditTitle(credits.singer.label,credits.singer.name,t,119.92,124.15);
 if(t<125.5)return filmTransition(t,ctx);
 return `<rect width="1920" height="1080" fill="#000"/><g opacity="${t>=7939/60?0:C((132.3233333333-t)/.48)}">${earth(960,544,.99,(t-125.5)*.22)}</g>`+endingCredits(t);
}
