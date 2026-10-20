import { renderRoomBackdrop, renderExplanationBubble } from '../lab/panels.js';
import { renderRoom } from '../lab/scene.js';
import { renderReaction } from '../../scenes/13-encounter/reaction.js';
import { renderRepresentatives } from '../../characters/representatives/group.js';
import { renderMiniRepresentatives } from '../../characters/representatives/miniature.js';
import {
  encounterPortrait,
  encounterPortraitBounds,
  encounterBack,
} from '../../characters/protagonist/encounter.js';
// 科幻场景共用绘制与灯光，不包含外部参考文件依赖。
import { renderWand, renderWandHolder } from '../../scenes/14-tomato-wand/props.js';
const C = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const E = (v) => {
  v = C(v);
  return 1 - (1 - v) ** 3;
};
const S = (v) => {
  v = C(v);
  return v * v * (3 - 2 * v);
};
const M = (a, b, v) => a + (b - a) * v;
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const tx = (s, x, y, size = 80, extra = '') =>
  `<text x="${x}" y="${y}" ${extra.includes('fill=') ? '' : 'fill="#f7faf1"'} ${extra.includes('font-family=') ? '' : 'font-family="MV Serif"'} font-weight="900" font-size="${size}" ${extra}>${esc(s)}</text>`;
const names = {
  earth: 'backgrounds/planet.png',
  field: 'backgrounds/meadow.png',
  wide: 'backgrounds/landing-field.png',
  ufo: 'props/spacecraft.png',
  alien: 'characters/aliens/silhouette-left.png',
  alien2: 'characters/aliens/silhouette-right.png',
  hand: 'props/hand-close.png',
};
const URLS = Object.fromEntries(
  Object.entries(names).map(([key, file]) => [
    key,
    new URL('../../../assets/' + file, import.meta.url).href,
  ]),
);
const descent = await fetch(new URL('../../scenes/12-landing/descent.json', import.meta.url)).then(
  (r) => {
    if (!r.ok) throw Error('Missing UFO descent data');
    return r.json();
  },
);
const flow = await fetch(new URL('../../scenes/12-landing/flow.json', import.meta.url)).then(
  (r) => {
    if (!r.ok) throw Error('Missing UFO flow data');
    return r.json();
  },
);
const landing = await fetch(
  new URL('../../scenes/13-encounter/landing.json', import.meta.url),
).then((r) => {
  if (!r.ok) throw Error('Missing landing motion data');
  return r.json();
});
const handShotMotion = await fetch(
  new URL('../../scenes/13-encounter/hand-motion.json', import.meta.url),
).then((r) => {
  if (!r.ok) throw Error('无法读取源片手部特写运动');
  return r.json();
});
const passengerURLs = Object.fromEntries(
  descent.passengers.map((p) => [p.id, new URL('../../../' + p.file, import.meta.url).href]),
);
const img = (key, x = 0, y = 0, w = 1920, h = 1080, attrs = '') =>
  `<image href="${URLS[key]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" ${attrs}/>`;
// Keep source canvas coordinates in nested SVGs: no cropped body or guessed hidden area is invented.
const sprite = (key, box, src, x, y, w, h, attrs = '') =>
  `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${box.join(' ')}" preserveAspectRatio="none" overflow="hidden" ${attrs}><image href="${URLS[key]}" width="${src[0]}" height="${src[1]}"/></svg>`;
export const scifiDefs = `
 <linearGradient id="sfBeam" x2="0" y2="1"><stop stop-color="#bdffe9" stop-opacity=".30"/><stop offset="1" stop-color="#beead4" stop-opacity=".04"/></linearGradient>
 <radialGradient id="sfLeak"><stop stop-color="#fff8dc" stop-opacity=".96"/><stop offset=".38" stop-color="#ead7bc" stop-opacity=".77"/><stop offset="1" stop-color="#b48d7c" stop-opacity="0"/></radialGradient>
 <radialGradient id="sfTableLight"><stop stop-color="#ffe8af" stop-opacity=".53"/><stop offset="1" stop-color="#d7b489" stop-opacity="0"/></radialGradient>
 <filter id="sfSoft"><feGaussianBlur stdDeviation="2.2"/></filter>
 <filter id="sfNearDepth" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="18"/></filter>
 <filter id="sfCloseDepth" x="-15%" y="-25%" width="130%" height="150%"><feGaussianBlur stdDeviation="28"/></filter>`;

export function landscape({ blur = false, t = 0 } = {}) {
  return img(blur ? 'field' : 'wide');
}
export function closeLandscape() {
  return img('field');
}
export function earth(x = 855, y = 550, s = 1, rotation = 0) {
  // 清理副本去掉原图左缘灰线，地球本体、黑底和原定位保持。
  const scale = s * 0.77;
  return `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})">${img('earth', -740, -545, 2160, 1215)}</g>`;
}
export function ufo(x, y, s = 1, bank = 0, beam = false, vertical = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${bank}) scale(${s})">${beam ? '<path d="M-85 94L-100 348H100L85 94Z" fill="#76e4e5" opacity=".13"/>' : ''}${sprite('ufo', [383, 219, 1394, 477], [2160, 1215], -442, -144, 884, 302)}</g>`;
}
export function room(t, ctx, { credits = false } = {}) {
  return renderRoom(t, { credits });
}
export function descentLine(keys, f) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (f <= keys[i][0]) {
      const a = keys[i - 1],
        b = keys[i];
      return M(a[1], b[1], (f - a[0]) / (b[0] - a[0]));
    }
  return keys.at(-1)[1];
}
export function rod(t, { explain = false } = {}) {
  return renderWand(t, { held: explain });
}
export function glitch(inner, t, start, duration) {
  let q = C((t - start) / duration),
    tick = Math.floor((t - start) * 60),
    amp = (1 - q) * 165;
  if (q >= 1) return inner;
  return (
    `<defs><g id="sfCurrentScene">${inner}</g>${Array.from({ length: 18 }, (_, i) => `<clipPath id="sfSlice${i}"><rect y="${i * 60}" width="1920" height="61"/></clipPath>`).join('')}</defs>` +
    Array.from(
      { length: 18 },
      (_, i) =>
        `<g clip-path="url(#sfSlice${i})"><use href="#sfCurrentScene" transform="translate(${Math.sin((i + 3) * 12.91 + tick * 2.31) * amp} 0)"/></g>`,
    ).join('')
  );
}

export {
  C,
  E,
  S,
  M,
  esc,
  tx,
  URLS,
  descent,
  flow,
  landing,
  handShotMotion,
  passengerURLs,
  img,
  sprite,
  renderRoom,
  renderReaction,
  renderRepresentatives,
  renderMiniRepresentatives,
  encounterPortrait,
  encounterPortraitBounds,
  encounterBack,
  renderExplanationBubble,
  renderWandHolder,
};
export function aperture(inner, top = 120, bottom = top) {
  return (
    inner +
    (top > 0 || bottom > 0
      ? `<rect data-scene-aperture="top" width="1920" height="${top}" fill="#000"/><rect data-scene-aperture="bottom" y="${1080 - bottom}" width="1920" height="${bottom}" fill="#000"/>`
      : '')
  );
}
