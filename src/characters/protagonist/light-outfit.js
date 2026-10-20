import { continuousImage } from '../deformation/continuous.js';
import { protagonistDialogueMotion } from './dialogue-motion.js';
// 开场只按模板曲线做刚性运动和摆臂；其余镜头保留已确认的整图形变。
const root = new URL('../../../assets/characters/protagonist-light/', import.meta.url);
const path = () => new URL('folded-arms.png', root).href;
const rigs = {
  point: { width: 1536, height: 1024 },
  chibi: { width: 1024, height: 1536 },
  closed: { width: 1024, height: 1536, imageX: -320, imageWidth: 1664 },
};
const armRoot = root;
const armPath = (name) =>
  new URL(
    { body: 'point-body', arm: 'point-arm', occlusion: 'point-hair-overlay' }[name] + '.png',
    armRoot,
  ).href;
const armData = await fetch(new URL('./arm-motion.json', import.meta.url)).then((response) =>
  response.json(),
);
const dialogueRoot = new URL('dialogue/', root);
const dialogueFrames = await fetch(new URL('./dialogue-light.json', import.meta.url)).then(
  (response) => response.json(),
);
const dialogueFrameURLs = Array.from(
  { length: dialogueFrames.end - dialogueFrames.start },
  (_, index) => new URL(`frame-${String(index).padStart(3, '0')}.png`, dialogueRoot).href,
);
const number = (value) => Number(value.toFixed(4));
function dialogueArtwork(frame) {
  const index = Math.max(
    0,
    Math.min(
      dialogueFrames.end - dialogueFrames.start - 1,
      Math.floor(frame) - dialogueFrames.start,
    ),
  );
  return `<image data-prebaked-frame="${dialogueFrames.start + index}" href="${dialogueFrameURLs[index]}" width="1024" height="1536"/>`;
}
export const protagonistDialogueFrameCache = dialogueFrameURLs
  .map(
    (url, index) =>
      `<image data-cached-frame="${dialogueFrames.start + index}" href="${url}" width="1024" height="1536" display="none"/>`,
  )
  .join('');
function pointArtwork(frame, motion) {
  const values = frame < armData.switchFrame ? armData.entry : armData.main;
  const position = Math.max(0, Math.min(values.length - 1, frame)),
    lower = Math.floor(position),
    upper = Math.min(lower + 1, values.length - 1);
  const angle =
    values[lower] + (values[upper] - values[lower]) * (position - lower) - armData.restAngle;
  const [x, y] = armData.pivot;
  const image = (name) => `<image href="${armPath(name)}" width="1536" height="1024"/>`;
  const arm = `<g data-part="point-arm" data-arm-angle="${number(angle)}" transform="rotate(${number(angle)} ${x} ${y})">${image('arm')}</g>`;
  const head = Math.max(-2, Math.min(2, motion.head || 0)),
    headY = (Math.max(-1.5, Math.min(1.5, motion.headY || 0)) * 1024) / 100;
  // 整个形象共用刚性变换，猫耳和头发不会再被局部权重拉伸；曲线沿用原模板。
  return `<g data-point-template-motion="rigid" data-extra-deformation="none" transform="translate(0 ${number(headY)}) rotate(${number(head)} 1070 730)">${image('body') + arm + image('occlusion')}</g>`;
}

function render(
  kind,
  x,
  y,
  height,
  motion,
  { anchor = 0.5, expression = '', opacity = 1, shadow = false, frame = 0, regional = null } = {},
) {
  const rig = rigs[kind],
    scale = height / rig.height,
    name = kind + (expression ? '-' + expression : '');
  const id = 'protagonist-' + kind + '-whole';
  const artwork =
    kind === 'point'
      ? pointArtwork(frame, motion)
      : kind === 'chibi'
        ? dialogueArtwork(frame)
        : continuousImage({
            id: 'protagonist-' + kind + '-continuous',
            url: path(name),
            width: rig.width,
            height: rig.height,
            imageX: rig.imageX,
            imageWidth: rig.imageWidth,
            kind,
            frame,
          });
  const reuse = `<g transform="scale(${scale}) translate(${-rig.width * anchor} 0)">${kind === 'chibi' ? artwork : `<use href="#${id}"/>`}</g>`;
  const silhouette = shadow
    ? `<g transform="translate(${x - 96} ${y + 33})" filter="url(#chorusShadow)">${reuse}</g>`
    : '';
  const rigMethod =
    kind === 'point'
      ? 'template-rigid-clean-arm'
      : kind === 'chibi'
        ? 'continuous-image-prebaked-60fps'
        : 'continuous-image-svg-motion';
  const definitions = kind === 'chibi' ? '' : `<defs><g id="${id}">${artwork}</g></defs>`;
  return `<g data-protagonist="${kind}" data-rig="${rigMethod}" data-expression="${expression || 'open'}" opacity="${opacity}">${definitions}${silhouette}<g ${kind === 'chibi' ? 'data-dialogue-position="true" ' : ''}transform="translate(${x} ${y})">${reuse}</g></g>`;
}
export function protagonistPoint(x, y, motion, frame = 0) {
  return render('point', x, y, 1035, motion, { anchor: 0.67, shadow: true, frame });
}
export function protagonistClosed(x, y, motion, frame = 0) {
  return render('closed', x, y, 1050, motion, { shadow: true, frame });
}
export function protagonistDialogue(state) {
  const expression = state.eyes === 'closed' ? 'blink' : state.mouth === 'closed' ? 'mouth' : '';
  const movement = protagonistDialogueMotion(state.frame);
  const x = 1344 + movement.characterX,
    y = 173 + movement.characterY;
  const artwork = render(
    'chibi',
    x,
    y,
    850,
    { head: movement.headAngle, headY: movement.headY },
    {
      expression,
      opacity: state.characterOpacity,
      frame: state.frame,
      regional: movement.regional,
    },
  );
  const metadata = JSON.stringify({
    frame: Math.floor(state.frame),
    x,
    y,
    opacity: state.characterOpacity,
    expression: expression || 'open',
  });
  return `<!--protagonist-dialogue:${metadata}-->${artwork}<!--protagonist-dialogue:end-->`;
}
