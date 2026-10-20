// 播放和离线生成共用的连续整图位移滤镜。
export function displacedImage(
  state,
  { id, url, width, height, kind, frame, imageX = 0, imageWidth = width },
) {
  const position = Math.max(0, Math.min(state.maps.length - 1, frame - state.start)),
    index = Math.floor(position),
    fraction = position - index;
  // 补画向左扩展画布，滤镜覆盖新发梢；形变和人物锚点仍使用原稿坐标。
  const padding = 64,
    filter = id + '-displacement',
    box = `x="${(state.left || 0) - padding}" y="${-padding}" width="${state.width + padding * 2}" height="${state.height + padding * 2}"`;
  // 小数帧混合相邻位移场，避免时间取整造成细小顿挫。
  const interpolation = fraction
    ? `<feImage href="${state.maps[index + 1]}" ${box} preserveAspectRatio="none" result="nextMotion"/><feComposite in="motion" in2="nextMotion" operator="arithmetic" k2="${1 - fraction}" k3="${fraction}" result="motion"/>`
    : '';
  return `<g data-continuous-image="${id}"><defs><filter id="${filter}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" ${box} color-interpolation-filters="sRGB"><feImage href="${state.maps[index]}" ${box} preserveAspectRatio="none" result="motion"/>${interpolation}<feDisplacementMap in="SourceGraphic" in2="motion" scale="${state.scale}" xChannelSelector="R" yChannelSelector="G"/></filter></defs><image href="${url}" x="${imageX}" width="${imageWidth}" height="${height}" filter="url(#${filter})"/></g>`;
}
