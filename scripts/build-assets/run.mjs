import {spawn} from 'node:child_process';
import path from 'node:path';
import {root} from '../config.mjs';
const tasks=[['浅色对话','light-dialogue.mjs'],['深色对话','python.mjs','dark-dialogue'],['表情过渡','python.mjs','expressions']];
for(const [label,script,...args] of tasks){
 console.log(`\n生成 ${label}`);
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(root,'scripts/build-assets',script),...args],{cwd:root,windowsHide:true,stdio:'inherit'});
  child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${label}生成失败（退出码${code}）`)));
 });
}
console.log('\n全部帧素材已生成。');
