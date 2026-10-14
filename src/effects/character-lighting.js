// 灯位使用房间坐标，与人物一起经过原摄像机变换，避免拉远时光照漂移。
export function roomLitCharacter({id, href, world, side = false}) {
  const {x, y, width, height} = world;
  const image = extra => `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
  const area = `x="${x}" y="${y}" width="${width}" height="${height}"`;
  const tint = side
    ? '.55 .02 .025 0 .008 .02 .63 .03 0 .012 .045 .045 .68 0 .018 0 0 0 1 0'
    : '.68 .025 .015 0 .008 .012 .73 .025 0 .012 .025 .05 .70 0 .015 0 0 0 1 0';
  return `<g data-room-character-lighting="${side ? 'side-reflection' : 'overhead-beam'}"><defs>
    <filter id="${id}-ambient" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${tint}"/></filter>
    <mask id="${id}-alpha" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" ${area} style="mask-type:alpha">${image('')}</mask>
    <radialGradient id="${id}-key" gradientUnits="userSpaceOnUse" cx="965" cy="235" r="760" fx="965" fy="190">
      <stop stop-color="#c4ffe8" stop-opacity=".40"/><stop offset=".42" stop-color="#a9eed2" stop-opacity=".24"/><stop offset="1" stop-color="#81c6b9" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-reflection" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height * .12}">
      <stop stop-color="#9bdfd6" stop-opacity="0"/><stop offset=".52" stop-color="#a7efd3" stop-opacity=".035"/><stop offset="1" stop-color="#c4ffe8" stop-opacity="${side ? .30 : .07}"/>
    </linearGradient>
    <linearGradient id="${id}-shade" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y + height * .2}" x2="${x + width}" y2="${y + height * .78}">
      <stop stop-color="#152439" stop-opacity="${side ? .20 : .11}"/><stop offset=".5" stop-color="#1b293d" stop-opacity=".015"/><stop offset="1" stop-color="#14223a" stop-opacity="${side ? .06 : .19}"/>
    </linearGradient>
    <radialGradient id="${id}-table" gradientUnits="userSpaceOnUse" cx="960" cy="1000" r="470">
      <stop stop-color="#efd0a5" stop-opacity=".15"/><stop offset="1" stop-color="#e3bc93" stop-opacity="0"/>
    </radialGradient>
  </defs>${image(`filter="url(#${id}-ambient)"`)}
    <g mask="url(#${id}-alpha)"><rect ${area} fill="url(#${id}-shade)"/><rect ${area} fill="url(#${id}-key)"/><rect ${area} fill="url(#${id}-reflection)"/><rect ${area} fill="url(#${id}-table)"/></g>
  </g>`;
}
