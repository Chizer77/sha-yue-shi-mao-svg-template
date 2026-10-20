import { formatTime } from './navigation.js';
import { find, handleAction } from '../ui/actions.js';

function showPlayback(playback) {
  const button = find('toggle-play');
  button.textContent = playback.playing ? '暂停' : '播放';
  button.setAttribute('aria-label', button.textContent);
  button.setAttribute('aria-pressed', String(playback.playing));
}

function bindKeyboard(playback, toggle, fps) {
  const keydown = (event) => {
    if (
      event.repeat ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.target.closest('input,textarea,select,button,[contenteditable=true]') ||
      document.querySelector('dialog[open]')
    )
      return;
    if (event.code === 'Space') {
      event.preventDefault();
      toggle();
    }
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      event.preventDefault();
      playback.seek(
        playback.time + ((event.code === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1)) / fps,
      );
    }
  };
  window.addEventListener('keydown', keydown);
  window.addEventListener('pagehide', () => window.removeEventListener('keydown', keydown), {
    once: true,
  });
}

function bindTransport(renderer, playback, navigation, timing, notice) {
  const toggle = handleAction(notice, () => playback.toggle()),
    fps = renderer.project.fps;
  find('toggle-play').onclick = toggle;
  find('previous').onclick = () => navigation.jump(-1);
  find('next').onclick = () => navigation.jump(1);
  find('restart-stage').onclick = () =>
    playback.seek(timing.active ? timing.loop.start : renderer.state.unit.start);
  find('previous-frame').onclick = () => playback.seek(playback.time - 1 / fps);
  find('next-frame').onclick = () => playback.seek(playback.time + 1 / fps);
  find('seek').oninput = (event) => playback.seek(Number(event.target.value) / fps);
  find('speed').onchange = (event) => playback.setPlaybackRate(Number(event.target.value));
  playback.events.addEventListener('playback', () => showPlayback(playback));
  bindKeyboard(playback, toggle, fps);
  showPlayback(playback);
}

export function mountPlaybackControls(renderer, playback, navigation, timing, notice) {
  const seek = find('seek'),
    project = renderer.project;
  const syncLoop = () =>
    playback.setLoop(
      find('loop-stage').checked ? (timing.active ? timing.loop : renderer.state.unit) : null,
    );
  function refresh() {
    const { frame, time, unit } = renderer.state;
    seek.min = timing.active ? timing.unit.start_frame : 0;
    seek.max = timing.active ? timing.unit.end_frame - 1 : project.frameCount - 1;
    seek.value = frame;
    find('time').textContent = timing.active
      ? `${formatTime(time)} · ${formatTime(timing.unit.start)}–${formatTime(timing.unit.end)}`
      : `${formatTime(time)} / ${formatTime(project.duration)}`;
    find('frame-number').textContent = timing.active
      ? `段内第 ${frame - timing.unit.start_frame} 帧`
      : `第 ${frame} 帧`;
    if (!timing.active) syncLoop();
  }
  bindTransport(renderer, playback, navigation, timing, notice);
  find('loop-stage').onchange = syncLoop;
  renderer.events.addEventListener('frame', refresh);
  timing.events.addEventListener('change', () => {
    syncLoop();
    refresh();
  });
  refresh();
}

export function enablePlaybackControls(enabled) {
  document.body.dataset.assetsReady = String(enabled);
  document.querySelectorAll('[data-ready]').forEach((control) => {
    control.disabled = !enabled || control.dataset.busy === 'true';
  });
}
