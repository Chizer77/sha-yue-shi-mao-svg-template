import {MEOW_TIMING_FIELDS, MEOW_TIMING_FPS, MEOW_TIMING_LIMIT,
  timingValuesFromRecord} from '../../src/scenes/08-meow-choir/timing.js';

const START_FRAME = 3078, END_FRAME = 3950;
const seconds = frame => frame / MEOW_TIMING_FPS;
const signed = value => `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`;

export function clampSegmentFrame(time) {
  return Math.max(START_FRAME, Math.min(END_FRAME - 1, Math.round(time * MEOW_TIMING_FPS)));
}

export function validLoopRange(start, end) {
  const first = Math.max(START_FRAME, Math.round(start * MEOW_TIMING_FPS));
  const last = Math.min(END_FRAME, Math.round(end * MEOW_TIMING_FPS));
  if (!Number.isFinite(first) || !Number.isFinite(last) || first >= last) {
    throw new Error('A点必须在B点之前，且至少相隔一帧');
  }
  return {start: seconds(first), end: seconds(last)};
}

export function mountMeowTimingPreview(document, frame) {
  const view = document.defaultView, find = id => document.getElementById(id);
  const status = message => { find('status').textContent = message; };
  let player = null, loop = validLoopRange(seconds(START_FRAME), seconds(END_FRAME));
  let lastDisplay = '', disposed = false, animationFrame = null;
  const controls = new Map();

  function run(action) {
    return async event => {
      try { await action(event); } catch (error) { status(error.message); }
    };
  }

  function seek(time) {
    player.seek(seconds(clampSegmentFrame(time)));
    updateReadout();
  }

  function showLoop() {
    find('loop-start').value = loop.start.toFixed(6);
    find('loop-end').value = loop.end.toFixed(6);
  }

  function changeLoop(start, end) {
    try { loop = validLoopRange(start, end); }
    finally { showLoop(); }
  }

  function updateReadout() {
    if (!player) return;
    const frameIndex = clampSegmentFrame(player.time);
    const display = `${player.time.toFixed(3)}秒 · 第${frameIndex - START_FRAME}帧`;
    if (display !== lastDisplay) {
      find('time-readout').textContent = display;
      find('segment-seek').value = String(frameIndex);
      lastDisplay = display;
    }
    const caption = player.playing ? '暂停' : '继续播放';
    if (find('toggle-play').textContent !== caption) find('toggle-play').textContent = caption;
  }

  function showTimings() {
    const values = player.meowTiming.get();
    for (const {key} of MEOW_TIMING_FIELDS) {
      const nodes = controls.get(key), frames = values[key] * MEOW_TIMING_FPS;
      nodes.number.value = String(Number(frames.toFixed(4)));
      nodes.range.value = String(frames);
      nodes.output.textContent = `${signed(frames)}帧 / ${signed(values[key] * 1000)}毫秒`;
    }
    const overall = values.songTimeOffsetSeconds;
    find('effective-offsets').textContent = '合成后的实际偏移：'
      + `动作 ${signed(overall * 60)}帧，口型 ${signed((overall + values.mouthTimeOffsetSeconds) * 60)}帧，`
      + `吐字 ${signed((overall + values.lyricTimeOffsetSeconds) * 60)}帧。`;
  }

  function changeTiming(key, frames) {
    player.meowTiming.set({[key]: frames / MEOW_TIMING_FPS});
    showTimings();
    status('已实时应用；满意后点击“保存到工程”，视频导出也会使用此设置。');
  }

  function createTimingControls() {
    for (const field of MEOW_TIMING_FIELDS) {
      const card = document.createElement('section');
      card.className = 'timing-card';
      card.innerHTML = `<h3>${field.label}</h3><p class="description hint">${field.description}</p>`
        + `<input type="range" min="-${MEOW_TIMING_LIMIT}" max="${MEOW_TIMING_LIMIT}" step="1" aria-label="${field.label}">`
        + `<div class="row"><button class="secondary" data-step="-1" aria-label="${field.label}延后一帧">−1帧</button>`
        + `<input type="number" min="-${MEOW_TIMING_LIMIT}" max="${MEOW_TIMING_LIMIT}" step="1" aria-label="${field.label}帧数">`
        + `<span>帧</span><button class="secondary" data-step="1" aria-label="${field.label}提前一帧">＋1帧</button></div><output class="time"></output>`;
      const range = card.querySelector('[type=range]'), number = card.querySelector('[type=number]');
      controls.set(field.key, {range, number, output: card.querySelector('output')});
      range.oninput = run(() => changeTiming(field.key, Number(range.value)));
      number.onchange = run(() => {
        if (!number.value) { showTimings(); return; }
        try { changeTiming(field.key, Number(number.value)); } finally { showTimings(); }
      });
      card.querySelectorAll('[data-step]').forEach(button => {
        button.onclick = run(() => changeTiming(field.key,
          Math.max(-MEOW_TIMING_LIMIT, Math.min(MEOW_TIMING_LIMIT,
            player.meowTiming.get()[field.key] * MEOW_TIMING_FPS + Number(button.dataset.step)))));
      });
      find('timing-controls').append(card);
    }
  }

  async function resume() {
    const activeLoop = find('loop-enabled').checked;
    if (player.time >= loop.end || (activeLoop && player.time < loop.start)) seek(loop.start);
    await player.play();
    updateReadout();
  }

  function exportTiming() {
    const contents = JSON.stringify(player.meowTiming.exportSettings(), null, 2) + '\n';
    const url = view.URL.createObjectURL(new view.Blob([contents], {type: 'application/json;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'choir-timing.json';
    document.body.append(link); link.click(); link.remove();
    view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
    status('已导出对轴参数，可用于写回工程。');
  }

  function bindPlayback() {
    find('play-segment').onclick = run(async () => { seek(loop.start); await resume(); });
    find('toggle-play').onclick = run(async () => {
      if (player.playing) player.pause(); else await resume();
      updateReadout();
    });
    find('previous-frame').onclick = run(() => seek(player.time - 1 / 60));
    find('next-frame').onclick = run(() => seek(player.time + 1 / 60));
    find('seek-55').onclick = run(() => seek(55));
    find('segment-seek').oninput = run(event => seek(seconds(Number(event.target.value))));
    find('playback-rate').onchange = run(event => player.setPlaybackRate(Number(event.target.value)));
    for (const id of ['loop-start', 'loop-end']) find(id).onchange = run(() =>
      changeLoop(Number(find('loop-start').value), Number(find('loop-end').value)));
    find('set-loop-start').onclick = run(() => changeLoop(player.time, loop.end));
    find('set-loop-end').onclick = run(() => changeLoop(loop.start, player.time));
    find('reset-loop').onclick = () => changeLoop(seconds(START_FRAME), seconds(END_FRAME));
  }

  function bindSaving() {
    find('save-timing').onclick = run(async () => {
      const response = await view.fetch('/api/meow-timing', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(player.meowTiming.get()),
      });
      const result = await response.json();
      if (!response.ok || !result.saved) throw new Error(result.error || '工程保存失败，请重启预览服务再试');
      player.meowTiming.save();
      status('已保存到工程；刷新预览和导出视频都会使用此设置。');
    });
    find('reset-timing').onclick = run(() => {
      player.meowTiming.reset(); showTimings();
      status('已恢复工程默认。需要覆盖本机记录时，请再点击“保存到工程”。');
    });
    find('export-timing').onclick = run(exportTiming);
    find('import-timing').onclick = () => find('timing-file').click();
    find('timing-file').onchange = run(async event => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const record = timingValuesFromRecord(JSON.parse(await file.text()));
        player.meowTiming.set({...player.meowTiming.defaults(), ...record});
        showTimings(); status('已导入并应用。满意后点击“保存到工程”。');
      } finally { event.target.value = ''; }
    });
  }

  const keydown = run(async event => {
    if (!player || event.altKey || event.ctrlKey || event.metaKey
        || event.target.closest('input,select,textarea,button,[contenteditable=true]')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (player.playing) player.pause(); else await resume();
    } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      event.preventDefault();
      seek(player.time + (event.code === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 10 : 1) / 60);
    }
  });

  function tick() {
    if (disposed) return;
    if (player?.playing && player.time >= loop.end) {
      // 跳回A点时保持音轨播放，画面继续由同一个音频时钟驱动。
      if (find('loop-enabled').checked) player.seek(loop.start, {pausePlayback: false});
      else seek(loop.end - 1 / 60);
    }
    updateReadout();
    animationFrame = view.requestAnimationFrame(tick);
  }

  async function initialize() {
    const deadline = Date.now() + 30000;
    while (!frame.contentWindow.animation) {
      if (Date.now() > deadline) throw new Error('预览载入超时，请刷新页面');
      await new Promise(resolve => view.setTimeout(resolve, 100));
    }
    const candidate = frame.contentWindow.animation;
    await candidate.ready;
    if (disposed || candidate === player) return;
    player = candidate;
    frame.contentWindow.addEventListener('keydown', keydown);
    player.setPlaybackRate(Number(find('playback-rate').value));
    seek(55); showTimings(); showLoop();
    document.querySelectorAll('button:disabled,input:disabled,select:disabled').forEach(node => { node.disabled = false; });
    status(player.meowTiming.notice || '已就绪。可先循环一小段，再用±1帧对齐“喵”。');
  }

  createTimingControls(); bindPlayback(); bindSaving();
  find('timing-controls').querySelectorAll('input,button').forEach(node => { node.disabled = true; });
  document.addEventListener('keydown', keydown);
  // 兼容iframe先载入和后载入两种顺序；主播放器重载后重新连接。
  frame.addEventListener('load', run(initialize));
  const ready = initialize().catch(error => status(error.message));
  tick();
  return {ready, dispose() {
    disposed = true; view.cancelAnimationFrame(animationFrame);
    document.removeEventListener('keydown', keydown);
    frame.contentWindow.removeEventListener('keydown', keydown);
  }};
}

if (typeof document !== 'undefined' && document.getElementById('svg-view')) {
  mountMeowTimingPreview(document, document.getElementById('svg-view'));
}
