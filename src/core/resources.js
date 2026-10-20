const images = new Map();
export function decodeImage(url) {
  if (!images.has(url)) {
    const image = new Image();
    image.src = url;
    images.set(
      url,
      image.decode().then(() => image),
    );
  }
  return images.get(url);
}
export async function prepareResources(urls) {
  await Promise.all(urls.map(decodeImage));
  await Promise.all([
    document.fonts.load('900 80px "MV Sans"', '人は猫そう絶対本当に'),
    document.fonts.load('900 80px "MV Serif"', '调查人类习性毛线球'),
    document.fonts.load('700 80px "ZCOOL KuaiLe"', '喵'),
  ]);
  await document.fonts.ready;
}
export async function settleFrame(content) {
  const urls = [
    ...new Set(
      [...content.querySelectorAll('image')]
        .map((image) => image.getAttribute('href'))
        .filter((url) => url && !url.startsWith('#')),
    ),
  ];
  await Promise.all(urls.map(decodeImage));
  // 只等待绘制，不重建节点；人物缓存依赖这些节点的持续身份。
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
