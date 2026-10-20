import { continuousImage } from '../deformation/continuous.js';

const root = new URL('../../../assets/characters/protagonist-dark/', import.meta.url);
const assetURL = (name) =>
  new URL(
    ({ 'point-occlusion': 'point-hair-overlay', closed: 'folded-arms' }[name] || name) + '.png',
    root,
  ).href;
const armData = await fetch(new URL('./arm-motion.json', import.meta.url)).then((response) =>
  response.json(),
);
const dialogueRoot = new URL('dialogue/', root);
const dialogue = await fetch(new URL('./dialogue-dark.json', import.meta.url)).then((response) =>
  response.json(),
);
const dialogueURLs = dialogue.frames.map(
  (state) =>
    new URL(`frame-${String(state.frame - dialogue.start).padStart(3, '0')}.png`, dialogueRoot)
      .href,
);
export const darkDialogueFrameCache = dialogue.frames
  .map(
    (state, index) =>
      `<image data-cached-frame="${state.frame}" href="${dialogueURLs[index]}" width="1024" height="1536" display="none"/>`,
  )
  .join('');
const number = (value) => Number(value.toFixed(5));

function pointArtwork(frame, motion) {
  const values = frame < armData.switchFrame ? armData.entry : armData.main;
  const position = Math.max(0, Math.min(values.length - 1, frame));
  const lower = Math.floor(position),
    upper = Math.min(lower + 1, values.length - 1);
  const angle =
    values[lower] + (values[upper] - values[lower]) * (position - lower) - armData.restAngle;
  const [pivotX, pivotY] = armData.pivot;
  const image = (name) => `<image href="${assetURL(name)}" width="1536" height="1024"/>`;
  const arm = `<g data-part="dark-point-arm" transform="rotate(${number(angle)} ${pivotX} ${pivotY})">${image('point-arm')}</g>`;
  const head = Math.max(-2, Math.min(2, motion.head || 0));
  const headY = (Math.max(-1.5, Math.min(1.5, motion.headY || 0)) * 1024) / 100;
  // 和已确认开场相同，指人仅做整体刚性运动与摆臂，不拉伸猫耳和头发。
  return `<g transform="translate(0 ${number(headY)}) rotate(${number(head)} 1070 730)">${image('point-body')}${arm}${image('point-occlusion')}</g>`;
}

function portrait(kind, x, y, artwork) {
  const point = kind === 'point',
    width = point ? 1536 : 1024;
  const height = point ? 1024 : 1536,
    targetHeight = point ? 1035 : 1050;
  const anchor = point ? 0.67 : 0.5,
    identifier = 'dark-outfit-' + kind;
  const reuse = `<g transform="scale(${targetHeight / height}) translate(${-width * anchor} 0)"><use href="#${identifier}"/></g>`;
  return `<g data-dark-outfit="${kind}"><defs><g id="${identifier}">${artwork}</g></defs><g transform="translate(${x - 96} ${y + 33})" filter="url(#chorusShadow)">${reuse}</g><g transform="translate(${x} ${y})">${reuse}</g></g>`;
}

export function darkOutfitPoint(x, y, motion, frame) {
  return portrait('point', x, y, pointArtwork(frame, motion));
}

export function darkOutfitClosed(x, y, motion, frame) {
  const artwork = continuousImage({
    id: 'dark-outfit-closed-continuous',
    url: assetURL('closed'),
    width: 1024,
    height: 1536,
    imageX: -320,
    imageWidth: 1664,
    kind: 'closed',
    frame,
  });
  return portrait('closed', x, y, artwork);
}

export function darkOutfitDialogue(state) {
  const position = Math.max(0, Math.min(dialogue.frames.length - 1, state.frame - dialogue.start));
  const index = Math.floor(position),
    fraction = position - index;
  const current = dialogue.frames[index],
    next = dialogue.frames[Math.min(index + 1, dialogue.frames.length - 1)];
  const x = 1344 + current.characterX + (next.characterX - current.characterX) * fraction;
  const y = 173 + current.characterY + (next.characterY - current.characterY) * fraction;
  const expression =
    current.eyes === 'closed' ? 'blink' : current.mouth === 'closed' ? 'mouth' : 'open';
  const metadata = JSON.stringify({
    variant: 'brown',
    frame: current.frame,
    x,
    y,
    opacity: state.characterOpacity,
    expression,
  });
  // 正式帧只做连续整图形变，播放时复用预加载节点，不重复重建图片。
  const artwork = `<g data-dark-outfit="chibi" data-expression="${expression}" opacity="${state.characterOpacity}"><g data-dialogue-position="true" transform="translate(${x} ${y})"><g transform="scale(${850 / 1536}) translate(-512 0)"><image data-prebaked-frame="${current.frame}" href="${dialogueURLs[index]}" width="1024" height="1536"/></g></g></g>`;
  return `<!--protagonist-dialogue:${metadata}-->${artwork}<!--protagonist-dialogue:end-->`;
}
