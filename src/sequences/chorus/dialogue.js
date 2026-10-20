// Frame-authored dialogue staging, shared only by the two measured repeats.
// Character pixels and the supporting silhouettes are supplied formal assets.
// Original-video frames are confined to reference/QA, never used by this module.
import { track, g } from '../../core/svg.js';
import { protagonistDialogue } from '../../characters/protagonist/light-outfit.js';
import { darkOutfitDialogue } from '../../characters/protagonist/dark-outfit.js';
export const introductionData = await fetch(new URL('./dialogue.json', import.meta.url)).then((r) =>
  r.json(),
);
const url = (p) => new URL('../../../' + p, import.meta.url).href;
const number = (x) => Number(x.toFixed(6));
const value = (keys, f) => number(track(keys, f));
function sampleState(keys, f) {
  let state = keys[0][1];
  for (const [at, next] of keys) {
    if (f < at) break;
    state = next;
  }
  return state;
}
export function introductionState(frame, offset = 0) {
  const f = number(Number(frame)),
    part = introductionData.refrains.find((r) => r.offset_frames === Math.round(offset));
  if (!Number.isFinite(f) || !part || f < part.start_frame || f >= part.end_frame) return null;
  const channels = Object.fromEntries(
    Object.entries(part.channels).map(([k, v]) => [k, value(v, f)]),
  );
  return {
    ...channels,
    frame: f,
    offset: part.offset_frames,
    eyes: sampleState(part.eyes, f),
    mouth: sampleState(part.mouth, f),
    glyphs: part.glyph_onsets.map((at) => f >= at),
    glyphOnsets: part.glyph_onsets,
  };
}
function alien(x, y, h, key) {
  const s = h / 989;
  return `<g data-template-asset="05_01/alien" data-part="${key}" transform="translate(${number(x)} ${number(y)}) scale(${number(s)})"><image href="${url(introductionData.assets.alien)}" x="-711" y="-981" width="3840" height="2160"/></g>`;
}
function chibi(s) {
  if (s.offset === 0) return protagonistDialogue(s);
  if (s.offset === 2332) return darkOutfitDialogue(s);
  return '';
}
function speechBubble(s) {
  if (s.bubbleOpacity <= 0) return '';
  // These are source-observed abstract glyphs, not substitute Unicode symbols.
  let body =
    '<path d="M490 265C482 97 666 27 827 77C1006 117 1038 256 1000 337L1075 378L977 377C887 520 482 502 490 265Z" fill="#fff"/>';
  if (s.glyphs[0])
    body +=
      '<g data-glyph="triangle"><path d="M637 229L601 306H676L642 229Z" fill="none" stroke="#696a67" stroke-width="12" stroke-linejoin="round"/></g>';
  if (s.glyphs[1])
    body +=
      '<g data-glyph="dots-and-square" stroke="#696a67" fill="#696a67"><circle cx="756" cy="244" r="10" stroke="none"/><circle cx="741" cy="265" r="6" fill="none" stroke-width="3"/><circle cx="773" cy="265" r="6" fill="none" stroke-width="3"/><path d="M756 259V311" stroke-width="5"/><path d="M718 287H746V309H718Z" fill="none" stroke-width="6"/><circle cx="780" cy="299" r="12" stroke="none"/></g>';
  if (s.glyphs[2])
    body +=
      '<g data-glyph="spiral" fill="none" stroke="#747671" stroke-linecap="round"><path d="M893 243C868 222 835 235 835 266C835 296 866 318 896 303C923 288 923 251 902 238M895 250C877 235 849 248 849 269C849 290 875 301 891 285C904 270 889 251 876 258C865 264 868 278 879 276C887 274 882 265 878 269" stroke-width="4"/><path d="M908 239L912 245M916 252L918 258M920 267L920 273M919 282L917 288M913 296L909 302" stroke-width="3"/></g>';
  return g(
    body,
    `translate(0 ${s.bubbleY})`,
    `data-part="dialogue-bubble" data-y="${s.bubbleY}" opacity="${s.bubbleOpacity}"`,
  );
}
export function alienIntroduction(frame, offset = 0) {
  const s = introductionState(frame, offset);
  if (!s) return '';
  const l = introductionData.layout;
  const pair = g(
    alien(l.aliens[0].x, l.aliens[0].y + s.alienY, l.aliens[0].height, 'alien-left') +
      alien(l.aliens[1].x, l.aliens[1].y + s.alienY, l.aliens[1].height, 'alien-right'),
    ' ',
    `data-part="alien-pair" data-y="${s.alienY}" opacity="${s.alienOpacity}"`,
  );
  return `<g data-scene="alien-introduction" data-local-frame="${number(frame)}" data-refrain-offset="${Math.round(offset)}">${pair}${chibi(s)}${speechBubble(s)}</g>`;
}
