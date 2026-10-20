import { find } from '../ui/actions.js';
import { mountTimingFields } from './fields.js';
import { mountTimingSettings } from './settings.js';
import { mountTimingLoop } from './loop.js';

function showMode(active) {
  document.body.dataset.mode = active ? 'timing' : 'player';
  find('mode-player').setAttribute('aria-pressed', String(!active));
  find('mode-timing').setAttribute('aria-pressed', String(active));
  find('asset-panel').hidden = active;
  find('timing-panel').hidden = !active;
  find('timing-tools').hidden = !active;
  find('toggle-panel').textContent = active ? '对轴设置' : '本段素材';
  find('loop-caption').textContent = active ? '循环 A–B' : '循环本段';
  find('restart-stage').textContent = active ? 'A 点' : '段首';
}

export function mountTimingPanel(renderer, playback, timing, notice) {
  const unit = renderer.project.units.find((unit) => unit.id === 8),
    events = new EventTarget();
  const fields = mountTimingFields(timing, notice);
  let active = false,
    snapshot = null;
  const emit = () => events.dispatchEvent(new Event('change'));
  const loop = mountTimingLoop(unit, playback, renderer.project.fps, emit, notice);
  mountTimingSettings(timing, fields.refresh, notice);
  function enter() {
    if (active) return;
    snapshot = {
      time: playback.time,
      loop: find('loop-stage').checked,
      hidden: document.body.classList.contains('panel-hidden'),
      open: document.body.classList.contains('panel-open'),
    };
    playback.pause();
    active = true;
    showMode(true);
    fields.refresh();
    document.body.classList.remove('panel-hidden');
    document.body.classList.add('panel-open');
    playback.setRange(unit);
    find('loop-stage').checked = true;
    playback.setLoop(loop.get());
    playback.seek(snapshot.time >= unit.start && snapshot.time < unit.end ? snapshot.time : 55);
    emit();
    notice(timing.notice || '对轴模式 · 正值提前，负值延后；使用顶部播放控制试听。');
  }
  function exit(restore = true) {
    if (!active) return;
    playback.pause();
    active = false;
    showMode(false);
    playback.setRange(null);
    playback.setLoop(null);
    find('loop-stage').checked = snapshot.loop;
    document.body.classList.toggle('panel-hidden', snapshot.hidden);
    document.body.classList.toggle('panel-open', snapshot.open);
    if (restore) playback.seek(snapshot.time);
    emit();
    notice('已返回播放器，对轴调整继续保留。');
  }
  find('mode-timing').onclick = enter;
  find('mode-player').onclick = () => exit();
  find('close-timing').onclick = () => exit();
  return {
    events,
    enter,
    exit,
    get active() {
      return active;
    },
    get unit() {
      return unit;
    },
    get loop() {
      return loop.get();
    },
  };
}
