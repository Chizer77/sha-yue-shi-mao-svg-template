import {background,g,serif,handFrame,clamp,ease} from '../../core/svg.js';
export function typography(t){const f=Math.round(t*60);let res=background('#54c9e0')+handFrame(t);
if(f<4400){const a=ease((f-4340)/18);return res+g(serif('猫咪就是喜欢',960,510,123,'#fff','text-anchor="middle" letter-spacing="10"'),`rotate(${8*(1-a)} 960 500)`,`opacity="${a}"`);}
if(f<4466){const a=clamp((f-4424)/18);return res+serif('猫咪就是喜欢',285,429,109,'#fff',`opacity="${1-a*.75}"`)+serif('装模作样',960,735,239,'#fff',`text-anchor="middle" textLength="1360" lengthAdjust="spacingAndGlyphs" opacity="${1-a}"`)+serif('大模大样',960,735,239,'#fff',`text-anchor="middle" textLength="1360" lengthAdjust="spacingAndGlyphs" opacity="${a}"`);}
let line=f<4517?'装得':f<4585?'觉得我们多':f<4630?'觉得他们多':'到头来还不是';let high=f>=4517&&f<4585?'高尚':f>=4585&&f<4630?'低档':'';
res+=serif(line,291,422,115,'#fff','letter-spacing="10"');if(high)res+=serif(high,1263,422,192,'#fff',`letter-spacing="10" transform="rotate(${high==='低档'?-5:0} 1263 422)"`);
res+=serif(f>=4630?'一模一样':'像模像样',960,735,239,'#fff',`text-anchor="middle" textLength="1360" lengthAdjust="spacingAndGlyphs" opacity="${f>=4517&&f<4630?.31:clamp((f-4466)/18)}"`);return res;
}

export const render=typography;
