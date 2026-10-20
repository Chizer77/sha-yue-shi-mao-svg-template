const files = new Map();
const fontFiles = [
  ['MV Sans', 'NotoSansSC-VF.ttf'],
  ['MV Serif', 'NotoSerifSC-VF.ttf'],
  ['ZCOOL KuaiLe', 'zcool-kuaile-miao.woff2'],
];
async function dataURL(url) {
  if (!files.has(url))
    files.set(
      url,
      (async () => {
        const response = await fetch(url);
        if (!response.ok) throw Error('无法内嵌素材：' + url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })(),
    );
  return files.get(url);
}
export async function serializeSVG(stage, { embedAssets = false, basePath = '../../../' } = {}) {
  const copy = stage.cloneNode(true),
    style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  // 静态帧不需要预载但隐藏的数百张动画差分，避免独立SVG被无关图片撑大。
  copy.querySelectorAll('[display="none"],[visibility="hidden"]').forEach((node) => node.remove());
  const fontRules = await Promise.all(
    fontFiles.map(async ([family, file]) => {
      const path = 'assets/fonts/' + file,
        url = embedAssets
          ? await dataURL(new URL('../../' + path, import.meta.url).href)
          : basePath + path;
      return `@font-face{font-family:'${family}';src:url('${url}');font-weight:${family === 'ZCOOL KuaiLe' ? '400' : '100 900'}}`;
    }),
  );
  style.textContent = fontRules.join('');
  copy.insertBefore(style, copy.firstChild);
  await Promise.all(
    [...copy.querySelectorAll('image')].map(async (image) => {
      const href = image.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const url = new URL(href, location.href);
      image.setAttribute(
        'href',
        embedAssets ? await dataURL(url.href) : basePath + url.pathname.slice(1) + url.search,
      );
    }),
  );
  return new XMLSerializer().serializeToString(copy);
}
