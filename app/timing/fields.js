import {
  MEOW_TIMING_FIELDS,
  MEOW_TIMING_FPS,
  MEOW_TIMING_LIMIT,
} from '../../src/scenes/08-meow-choir/timing.js';
import { find, handleAction } from '../ui/actions.js';

const signed = (value) => `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`;

function timingCard(field) {
  const card = document.createElement('section');
  card.className = 'timing-card';
  card.innerHTML =
    `<h3>${field.label}</h3><p class="hint">${field.description}</p>` +
    `<input type="range" min="-${MEOW_TIMING_LIMIT}" max="${MEOW_TIMING_LIMIT}" step="1" aria-label="${field.label}">` +
    `<div class="timing-stepper"><button data-step="-1" aria-label="${field.label}延后一帧">−1 帧</button>` +
    `<input type="number" min="-${MEOW_TIMING_LIMIT}" max="${MEOW_TIMING_LIMIT}" step="1" aria-label="${field.label}帧数">` +
    `<span>帧</span><button data-step="1" aria-label="${field.label}提前一帧">＋1 帧</button></div><output></output>`;
  return card;
}

function bindCard(card, field, timing, refresh, notice) {
  const range = card.querySelector('[type=range]'),
    number = card.querySelector('[type=number]');
  function change(frames) {
    try {
      timing.set({ [field.key]: frames / MEOW_TIMING_FPS });
      notice('已实时应用。保存到工程后，视频导出也会使用此设置。');
    } finally {
      refresh();
    }
  }
  range.oninput = handleAction(notice, () => change(Number(range.value)));
  number.onchange = handleAction(notice, () =>
    number.value ? change(Number(number.value)) : refresh(),
  );
  for (const button of card.querySelectorAll('[data-step]')) {
    button.onclick = handleAction(notice, () =>
      change(
        Math.max(
          -MEOW_TIMING_LIMIT,
          Math.min(
            MEOW_TIMING_LIMIT,
            timing.get()[field.key] * MEOW_TIMING_FPS + Number(button.dataset.step),
          ),
        ),
      ),
    );
  }
  return { range, number, output: card.querySelector('output') };
}

export function mountTimingFields(timing, notice) {
  const controls = new Map();
  function refresh() {
    const values = timing.get(),
      overall = values.songTimeOffsetSeconds;
    for (const { key } of MEOW_TIMING_FIELDS) {
      const nodes = controls.get(key),
        frames = values[key] * MEOW_TIMING_FPS;
      nodes.number.value = Number(frames.toFixed(4));
      nodes.range.value = frames;
      nodes.output.textContent = `${signed(frames)} 帧 / ${signed(values[key] * 1000)} 毫秒`;
    }
    find('effective-offsets').textContent =
      `实际偏移：动作 ${signed(overall * 60)} 帧，口型 ${signed((overall + values.mouthTimeOffsetSeconds) * 60)} 帧，吐字 ${signed((overall + values.lyricTimeOffsetSeconds) * 60)} 帧。`;
  }
  for (const field of MEOW_TIMING_FIELDS) {
    const card = timingCard(field);
    controls.set(field.key, bindCard(card, field, timing, refresh, notice));
    find('timing-controls').append(card);
  }
  refresh();
  return { refresh };
}
