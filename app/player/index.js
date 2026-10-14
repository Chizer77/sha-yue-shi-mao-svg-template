import {createStage} from '../../src/core/stage.js';
import {createPlayback} from './controller.js';
import {exposeAnimation} from './bridge.js';
import {mountNavigation,formatTime} from './navigation.js';
import {mountExport} from './export-controls.js';
import {mountAssets} from '../assets/panel.js';
const query=new URLSearchParams(location.search);if(query.has('embed'))document.body.classList.add('embed');
const renderer=createStage(document.querySelector('#stage')),playback=createPlayback(renderer,document.querySelector('#soundtrack'));
const notice=message=>{document.querySelector('#status').textContent=message;};
exposeAnimation(renderer,playback);
const navigation=mountNavigation(renderer.project,playback,renderer),seek=document.querySelector('#seek');
seek.max=renderer.project.frameCount-1;
renderer.events.addEventListener('frame',event=>{
 const {frame,time,unit}=event.detail;seek.value=frame;
 document.querySelector('#time').textContent=formatTime(time)+' / '+formatTime(renderer.project.duration);
 document.querySelector('#frame-number').textContent=`第 ${frame} 帧`;
 if(document.querySelector('#loop-stage').checked)playback.setLoop(unit);
});
function updatePlayback(){const playing=playback.playing,button=document.querySelector('#toggle-play');button.textContent=playing?'暂停':'播放';button.setAttribute('aria-label',button.textContent);button.setAttribute('aria-pressed',String(playing));}
playback.events.addEventListener('playback',updatePlayback);
const toggle=()=>playback.toggle()?.catch?.(error=>notice(error.message));
document.querySelector('#toggle-play').onclick=toggle;
document.querySelector('#previous').onclick=()=>navigation.jump(-1);document.querySelector('#next').onclick=()=>navigation.jump(1);
document.querySelector('#restart-stage').onclick=()=>playback.seek(renderer.state.unit.start);
seek.oninput=()=>playback.seek(Number(seek.value)/renderer.project.fps);
document.querySelector('#speed').onchange=event=>playback.setPlaybackRate(Number(event.target.value));
document.querySelector('#loop-stage').onchange=event=>playback.setLoop(event.target.checked?renderer.state.unit:null);
window.addEventListener('keydown',event=>{
 // 嵌入式喵喵调节页由父页面接管快捷键，避免同一次空格被处理两遍。
 if(query.has('embed'))return;
 if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select,button,[contenteditable=true]')||document.querySelector('dialog[open]'))return;
 if(event.code==='Space'){event.preventDefault();toggle();}
 if(event.code==='ArrowLeft'||event.code==='ArrowRight'){event.preventDefault();playback.seek(playback.time+(event.code==='ArrowLeft'?-1:1)*(event.shiftKey?10:1)/renderer.project.fps);}
});
try{
 await renderer.ready;const frame=Number(new URLSearchParams(location.hash.slice(1)).get('frame')||0);
 playback.seek(frame/renderer.project.fps);document.querySelectorAll('button:disabled,input:disabled').forEach(control=>{control.disabled=false;});
 mountExport(renderer,notice);await mountAssets(renderer);notice('已就绪 · 空格播放 / 暂停');
 if(query.get('download')==='svg')document.querySelector('#download-svg').click();
}catch(error){notice('载入失败：'+error.message);console.error(error);}
window.addEventListener('pagehide',()=>playback.dispose());
