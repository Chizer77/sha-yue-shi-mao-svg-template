export const avatarURL=new URL('../../../assets/ui/message-avatar.png',import.meta.url).href;
const phoneURL=new URL('../../../assets/props/phone/device.png',import.meta.url).href;

export function phoneArtwork() {
  // 将原图外壳左右边界与模板对齐；整图等比缩放，保留挂环和挂绳的原生连接。
  const scale = 645 / 614;
  const x = 628 - 303 * scale;
  const y = 309 - 72 * scale;
  const size = 1254 * scale;
  return `<image data-role="complete-tomato-phone" href="${phoneURL}" x="${x}" y="${y}" width="${size}" height="${size}"/>`;
}
