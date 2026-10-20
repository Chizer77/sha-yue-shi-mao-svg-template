import { find, handleAction } from '../ui/actions.js';
import { validLoopRange } from './range.js';

export function mountTimingLoop(unit, playback, fps, onChange, notice) {
  let range = validLoopRange(unit.start, unit.end, unit, fps);
  function show() {
    find('loop-start').value = range.start.toFixed(6);
    find('loop-end').value = range.end.toFixed(6);
  }
  function change(start, end) {
    try {
      range = validLoopRange(start, end, unit, fps);
      onChange();
    } finally {
      show();
    }
  }
  for (const id of ['loop-start', 'loop-end']) {
    const input = find(id);
    input.min = unit.start;
    input.max = unit.end;
    input.onchange = handleAction(notice, () =>
      change(Number(find('loop-start').value), Number(find('loop-end').value)),
    );
  }
  find('set-loop-start').onclick = handleAction(notice, () => change(playback.time, range.end));
  find('set-loop-end').onclick = handleAction(notice, () => change(range.start, playback.time));
  find('reset-loop').onclick = () => change(unit.start, unit.end);
  find('play-segment').onclick = handleAction(notice, async () => {
    playback.seek(range.start);
    await playback.play();
  });
  find('seek-55').onclick = () => playback.seek(55);
  show();
  return { get: () => range };
}
