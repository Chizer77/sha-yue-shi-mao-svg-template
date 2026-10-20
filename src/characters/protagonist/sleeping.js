const assetURL = (name) =>
  new URL('../../../assets/characters/protagonist-light/' + name + '.png', import.meta.url).href;
const artwork = { sleep: assetURL('sleeping'), sigh: assetURL('sighing') };

export function bedExpression(time, track) {
  // 源视频在气团消失后仍保持张嘴，口型持续到本镜头结束。
  return time >= track.sigh.start ? 'sigh' : 'sleep';
}

export function bedArtwork(time, track, pose) {
  const expression = bedExpression(time, track);
  const height = 900,
    width = (height * 1086) / 1448;
  const pressure = Math.max(0, Math.min(1, pose.y / 38));
  const scaleX = 1 + pressure * 0.006,
    scaleY = 1 - pressure * 0.015;
  const [pivotX, pivotY] = track.pivot;
  // 下沉时整图轻微压缩，保留连续轮廓；动作由模板曲线驱动，不另加周期摆动。
  return `<g data-protagonist-bed="true" data-expression="${expression}" transform="translate(${pose.x} ${pose.y}) rotate(${pose.rotation} ${pivotX} ${pivotY})">
    <g transform="translate(947 735) scale(${scaleX} ${scaleY}) translate(-947 -735)">
      <image href="${artwork[expression]}" x="${947 - width / 2}" y="115" width="${width}" height="${height}"/>
    </g>
  </g>`;
}
