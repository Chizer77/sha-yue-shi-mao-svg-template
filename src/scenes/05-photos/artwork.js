// 照片外层沿用模板；内部人物、背景和前景按同一绝对时间独立合成。
const config = await fetch(new URL('./motion.json', import.meta.url)).then((r) => {
  if (!r.ok) throw Error('Cannot load photo-scene.json');
  return r.json();
});
const url = (p) => new URL('../../../' + p, import.meta.url).href;
const clamp = (v) => Math.min(1, Math.max(0, v));
function keys(track, f) {
  if (!track?.length) return 0;
  if (f <= track[0][0]) return track[0][1];
  for (let i = 1; i < track.length; i++)
    if (f <= track[i][0]) {
      const [a, x] = track[i - 1],
        [b, y] = track[i];
      return x + ((y - x) * (f - a)) / (b - a);
    }
  return track.at(-1)[1];
}
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export function photoState(t) {
  const frame = Math.round(t * 60);
  const active = frame >= config.startFrame && frame < config.endFrame;
  const photos = active
    ? config.photos
        .filter((p) => frame >= p.firstFrame)
        .map((p) => ({
          ...p,
          assetId: p.assetId,
          kind: p.kind,
          path: p.path,
          width: p.width,
          height: p.height,
          center: p.sourceCenter,
          scale: p.scale,
          x: p.targetCenter[0] + keys(p.xOffsetFrames, frame),
          y: p.targetCenter[1],
          rotation: keys(p.rotationFrames, frame) - p.sourceAngle,
          totalAngle: keys(p.rotationFrames, frame),
        }))
    : [];
  const captions = active
    ? config.photos
        .map((p) => ({ text: p.caption, opacity: keys(p.captionOpacityFrames, frame) }))
        .filter((p) => p.opacity > 0)
    : [];
  return {
    scene: 'photographs',
    active,
    frame,
    photos,
    captions,
    flashOpacity: active ? keys(config.flashFrames, frame) : 0,
    treeOpacity: active ? keys(config.treeOpacityFrames, frame) : 0,
    backOpacity: active ? keys(config.backOpacityFrames, frame) : 0,
  };
}
function contentTransform(photo) {
  const [upperLeft, upperRight, , lowerLeft] = photo.sourceContentCorners;
  const [width, height] = photo.contentSize;
  return `matrix(${(upperRight[0] - upperLeft[0]) / width} ${(upperRight[1] - upperLeft[1]) / width} ${(lowerLeft[0] - upperLeft[0]) / height} ${(lowerLeft[1] - upperLeft[1]) / height} ${upperLeft[0]} ${upperLeft[1]})`;
}
function photoLayer(layer, photo, frame) {
  const motion = photo.internalMotion?.[layer.motion];
  const x = layer.x + keys(motion?.x, frame),
    y = layer.y + keys(motion?.y, frame);
  return `<image data-photo-layer="${escape(layer.identity || layer.motion || layer.path)}" href="${url(layer.path)}" x="${x}" y="${y}" width="${layer.width}" height="${layer.height}" preserveAspectRatio="none"/>`;
}
function photoArtwork(photo, frame) {
  if (!photo.layers)
    return `<image href="${url(photo.path)}" x="0" y="0" width="${photo.width}" height="${photo.height}" preserveAspectRatio="xMidYMid meet"/>`;
  const id = `photo-window-${photo.assetId}`;
  const [width, height] = photo.contentSize;
  const x = keys(photo.contentMotion?.x, frame),
    y = keys(photo.contentMotion?.y, frame);
  // 内部抖动必须裁在固定内窗中，白框和红绳不跟随车厢抖动。
  const background = photo.layers[0];
  const fill = `<image href="${url(background.path)}" x="-8" y="-8" width="${width + 16}" height="${height + 16}" preserveAspectRatio="none"/>`;
  const layers = photo.layers.map((layer) => photoLayer(layer, photo, frame)).join('');
  return `<image href="${url(photo.paperPath)}" width="${photo.width}" height="${photo.height}"/><g transform="${contentTransform(photo)}"><defs><clipPath id="${id}"><rect width="${width}" height="${height}"/></clipPath></defs><g clip-path="url(#${id})">${fill}<g data-photo-internal-motion="true" transform="translate(${x} ${y})">${layers}</g></g></g>`;
}
export function photoScene(t, { tree = '', back = '', strings = '' } = {}) {
  const s = photoState(t);
  if (!s.active) return '';
  const cards = s.photos
    .map(
      (p) =>
        `<g data-photo="${p.kind}" data-asset-id="${p.assetId}" data-source="${config.variant}" transform="translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.scale}) translate(${-p.center[0]} ${-p.center[1]})">${photoArtwork(p, s.frame)}</g>`,
    )
    .join('');
  const words = s.captions
    .map(
      (c) =>
        `<g data-photo-caption="${escape(c.text)}" opacity="${c.opacity}" fill="#fffcf2" font-family="'MV Serif',serif" font-size="77" font-weight="900" text-anchor="middle">${[...c.text].map((v, i) => `<text x="1556" y="${241 + i * 88}">${escape(v)}</text>`).join('')}</g>`,
    )
    .join('');
  const ropeOpacity = keys(config.ropeOpacityFrames, s.frame);
  const rope =
    ropeOpacity > 0
      ? `<g data-photo-rope="single-independent-source-layer" opacity="${ropeOpacity}">${strings}</g>`
      : '';
  return `<g data-photo-scene="revision${config.revision}"><rect width="1920" height="1080" fill="${config.background}"/><g opacity="${s.treeOpacity}">${tree}</g><g opacity="${s.backOpacity}">${back}</g>${cards}${rope}${words}<rect data-photo-flash="true" width="1920" height="1080" fill="white" opacity="${s.flashOpacity}"/></g>`;
}
