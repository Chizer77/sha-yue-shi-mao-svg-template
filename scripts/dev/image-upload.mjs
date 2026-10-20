import sharp from 'sharp';

const imageOptions = { limitInputPixels: 40_000_000 };
const svgElements = new Set(
  'svg g defs path rect circle ellipse line polyline polygon text tspan textPath use image symbol clipPath mask pattern linearGradient radialGradient stop filter title desc metadata'
    .toLowerCase()
    .split(' '),
);

function validateSVG(source) {
  // 素材可能内联进舞台，限制为静态 SVG，避免图片中的内容操作页面或加载外部文件。
  const invalid = () => {
    throw Error('请选择不含脚本、动画、样式表和外部资源的静态 SVG');
  };
  if (/<!DOCTYPE|<!ENTITY|<\?(?!xml\s)|\son[\w:-]+\s*=|xml:base\s*=|@import/i.test(source))
    invalid();
  for (const [, name] of source.matchAll(/<\/?([a-z][\w:.-]*)\b/gi)) {
    if (!svgElements.has(name.toLowerCase()) && !/^fe[a-z]+$/i.test(name)) invalid();
  }
  for (const [, quote, value] of source.matchAll(/\b(?:href|src)\s*=\s*(['"])(.*?)\1/gis)) {
    if (!/^(?:#|data:image\/(?:png|jpeg|webp);base64,)/i.test(value.trim())) invalid();
  }
  for (const [, value] of source.matchAll(/url\(([^)]*)\)/gi))
    if (
      !value
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .startsWith('#')
    )
      invalid();
  for (const [, quote, value] of source.matchAll(/\bstyle\s*=\s*(['"])(.*?)\1/gis))
    if (/[\\&]|@/i.test(value)) invalid();
}

function isRaster(buffer) {
  return (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) ||
    (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')
  );
}

export async function prepareImage(buffer, extension) {
  if (extension === '.svg') validateSVG(buffer.toString('utf8'));
  else if (!isRaster(buffer)) throw Error('请选择 PNG、JPG 或 WebP 图片');
  const metadata = await sharp(buffer, imageOptions).metadata();
  if (extension !== '.svg') {
    const { data, info } = await sharp(buffer, imageOptions)
      .rotate()
      .png()
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, metadata: { ...metadata, width: info.width, height: info.height } };
  }
  if (metadata.format !== 'svg') throw Error('此素材需要 SVG 文件');
  await sharp(buffer, imageOptions).png().toBuffer();
  return { buffer, metadata };
}
