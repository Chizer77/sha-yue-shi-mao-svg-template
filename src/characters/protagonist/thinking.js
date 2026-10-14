const assetURL = path => new URL('../../../assets/characters/' + path + '.png', import.meta.url).href;
const artwork = {thinking: assetURL('protagonist-dark/thinking'), realization: assetURL('protagonist-dark/realization')};

export function thinkingExpression(time, track) {
  return time >= track.pose_cut ? 'realization' : 'thinking';
}

export function thinkingCameraState(time, track) {
  const camera = track.camera;
  if (!camera) return {zoom: 1, centre: [960, 540]};
  const keys = camera.zoom;
  if (time <= keys[0][0]) return {zoom: keys[0][1], centre: camera.centre};
  for (let index = 1; index < keys.length; index++) {
    const [startTime, startZoom] = keys[index - 1], [endTime, endZoom] = keys[index];
    if (time > endTime) continue;
    const progress = (time - startTime) / (endTime - startTime);
    // 源片是匀速推近，不对每个 60fps 采样点反复加缓动而造成顿挫。
    return {zoom: startZoom + (endZoom - startZoom) * progress, centre: camera.centre};
  }
  return {zoom: keys.at(-1)[1], centre: camera.centre};
}

export function thinkingArtwork(time, track, pose) {
  const expression = thinkingExpression(time, track);
  const height = 1040, width = height * 1086 / 1448;
  const [pivotX, pivotY] = track.pivot;
  const camera = thinkingCameraState(time, track), [cameraX, cameraY] = camera.centre;
  // 镜头只推近人物；模板字幕固定在屏幕上，退场位移仍使用屏幕像素。
  return `<g data-protagonist-thinking="true" data-expression="${expression}" transform="translate(${pose.x} ${pose.y}) rotate(${pose.rotation} ${pivotX} ${pivotY})">
    <g data-thinking-camera="true" transform="translate(${cameraX} ${cameraY}) scale(${camera.zoom}) translate(${-cameraX} ${-cameraY})">
      <image href="${artwork[expression]}" x="${914 - width / 2}" y="52" width="${width}" height="${height}"/>
    </g>
  </g>`;
}
