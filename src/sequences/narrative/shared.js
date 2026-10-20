// All poses, camera moves, notices and collisions are evaluated from absolute time.
// Reference frames are QA-only. Characters use the supplied pose variants;
// native PSD phone/frame/string layers are reused with editable SVG staging.
import { renderDisplayTitle } from '../../effects/display-frame.js';
import {
  meowScreen,
  meowState,
  choirSpectator,
  wrapMeowScene,
} from '../../scenes/08-meow-choir/characters.js';
import { photoScene, photoState } from '../../scenes/05-photos/artwork.js';
import { treeScene, treeSceneState, ready as treeReady } from '../../scenes/04-tree/scene.js';
import { phoneScene, phoneState, ready as phoneReady } from '../../scenes/02-phone/artwork.js';
import { bedArtwork, bedExpression } from '../../characters/protagonist/sleeping.js';
import {
  thinkingArtwork,
  thinkingExpression,
  thinkingCameraState,
} from '../../characters/protagonist/thinking.js';
await Promise.all([treeReady, phoneReady]);
const nativeFiles = {
  photoBack: 'props/photos/backdrop.png',
  strings: 'props/photos/rope.png',
  bulb: 'props/idea-bulb.png',
  alien: 'characters/aliens/alien.png',
};
const nativeURL = (id) => new URL('../../../assets/' + nativeFiles[id], import.meta.url).href;
const native = (id, transform = '', opacity = 1) =>
  `<g data-template-asset="${nativeFiles[id]}" transform="${transform}" opacity="${opacity}"><image href="${nativeURL(id)}" x="0" y="0" width="1920" height="1080"/></g>`;
const [assetText, timeline, motion] = await Promise.all([
  fetch(new URL('../../../assets/narrative.svg', import.meta.url)).then((r) => {
    if (!r.ok) throw new Error('Unable to load narrative SVG assets');
    return r.text();
  }),
  fetch(new URL('./events.json', import.meta.url)).then((r) => {
    if (!r.ok) throw new Error('Unable to load narrative timeline');
    return r.json();
  }),
  Promise.all(
    [
      '../../scenes/03-bed/motion.json',
      '../../scenes/06-thinking/motion.json',
      '../../scenes/08-meow-choir/side-motion.json',
    ].map((file) =>
      fetch(new URL(file, import.meta.url)).then((response) => {
        if (!response.ok) throw Error('缺少阶段运动参数：' + file);
        return response.json();
      }),
    ),
  ).then(([bed, thinking, game]) => ({ bed, thinking, game })),
]);

export const narrativeDefs = assetText.match(/<defs>([\s\S]*)<\/defs>/)[1];
export const narrativeEvents = timeline;
export const narrativeMotion = motion;
const C = {
  purple: '#6b3f94',
  aqua: '#68b7b1',
  dark: '#347b75',
  cream: '#fffcf2',
  game: '#53c8df',
};
function choirBackdrop(t) {
  const f = t * 60,
    stops = [
      [3078, [251, 191, 0]],
      [3087, [251, 191, 0]],
      [3091, [237, 187, 23]],
      [3096, [208, 189, 59]],
      [3102, [174, 193, 104]],
      [3108, [140, 195, 148]],
      [3114, [109, 198, 193]],
      [3120, [84, 201, 224]],
    ];
  return `rgb(${[0, 1, 2]
    .map((c) =>
      Math.round(
        keys(
          stops.map(([k, v]) => [k, v[c]]),
          f,
        ),
      ),
    )
    .join(' ')})`;
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => {
  u = clamp(u);
  return u * u * (3 - 2 * u);
};
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const use = (id, transform = '', more = '') =>
  `<use href="#${id}" transform="${transform}" ${more}/>`;
const rect = (x, y, w, h, color, more = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" ${more}/>`;
const tx = (s, x, y, size, more = '') =>
  `<text x="${x}" y="${y}" ${more.includes('font-family=') ? '' : 'font-family="\'MV Serif\',serif"'} font-size="${size}" ${more.includes('font-weight=') ? '' : 'font-weight="900"'} ${more.includes('fill=') ? '' : `fill="${C.cream}"`} ${more}>${esc(s)}</text>`;
const vertical = (s, x, y, size, step = size * 1.18, more = '') =>
  `<g ${more}>${Array.from(s)
    .map((c, i) =>
      tx(
        c,
        x,
        y + i * step,
        size,
        'text-anchor="middle" ' + (more.match(/fill="[^"]*"/)?.[0] ?? ''),
      ),
    )
    .join('')}</g>`;
function keys(list, t) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    if (t <= list[i][0])
      return lerp(list[i - 1][1], list[i][1], (t - list[i - 1][0]) / (list[i][0] - list[i - 1][0]));
  }
  return list.at(-1)[1];
}
// Only authored / measured pose tracks are smoothed. Source holds remain holds.
function poseKeys(list, t) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++)
    if (t <= list[i][0])
      return lerp(
        list[i - 1][1],
        list[i][1],
        ease((t - list[i - 1][0]) / (list[i][0] - list[i - 1][0])),
      );
  return list.at(-1)[1];
}
function bodyTrack(track, t) {
  return {
    x: poseKeys(track.x, t),
    y: poseKeys(track.y, t),
    rotation: poseKeys(track.rotation, t),
  };
}

export {
  C,
  clamp,
  lerp,
  ease,
  esc,
  use,
  rect,
  tx,
  vertical,
  keys,
  poseKeys,
  bodyTrack,
  choirBackdrop,
  native,
  motion,
  timeline,
  phoneScene,
  treeScene,
  photoScene,
  renderDisplayTitle,
  meowScreen,
  meowState,
  choirSpectator,
  wrapMeowScene,
  bedArtwork,
  bedExpression,
  thinkingArtwork,
  thinkingExpression,
  thinkingCameraState,
  phoneState,
  treeSceneState,
  photoState,
};
