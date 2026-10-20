import fs from 'node:fs/promises';
import path from 'node:path';
import { root, readJSON } from '../config.mjs';
import { sharp } from '../runtime.mjs';
import { displacedImage } from '../../src/characters/deformation/image.js';

const folder = path.join(root, 'assets/characters/protagonist-light/dialogue');
const sequence = readJSON('src/characters/protagonist/dialogue-light.json');
const dialogue = readJSON('src/sequences/chorus/dialogue.json').refrains.find(
  (part) => part.offset_frames === 0,
);
const displacement = readJSON('src/characters/protagonist/portrait-deformation.json').kinds.chibi;
const expressions = ['open', 'closed-mouth', 'closed-eyes'];
const sources = Object.fromEntries(
  await Promise.all(
    expressions.map(async (name) => {
      const file = path.join(folder, 'input', name + '.png'),
        pixels = await fs.readFile(file),
        metadata = await sharp(pixels).metadata();
      if (metadata.width !== 1024 || metadata.height !== 1536)
        throw Error(`输入图需要1024×1536画布：${file}`);
      return [name, 'data:image/png;base64,' + pixels.toString('base64')];
    }),
  ),
);
function stateAt(keys, frame) {
  let state = keys[0][1];
  for (const [time, next] of keys) {
    if (frame < time) break;
    state = next;
  }
  return state;
}

await fs.mkdir(folder, { recursive: true });
for (let frame = sequence.start; frame < sequence.end; frame++) {
  const expression =
    stateAt(dialogue.eyes, frame) === 'closed'
      ? 'closed-eyes'
      : stateAt(dialogue.mouth, frame) === 'closed'
        ? 'closed-mouth'
        : 'open';
  // 与播放器共用位移滤镜，避免离线生成和实时绘制各用一套形变算法。
  const artwork = displacedImage(displacement, {
    id: 'dialogue-bake',
    url: sources[expression],
    width: 1024,
    height: 1536,
    frame,
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sequence.width}" height="${sequence.height}" viewBox="0 0 1024 1536">${artwork}</svg>`;
  const file = path.join(folder, `frame-${String(frame - sequence.start).padStart(3, '0')}.png`);
  await fs.writeFile(
    file + '.tmp',
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer(),
  );
  await fs.rename(file + '.tmp', file);
  if ((frame - sequence.start + 1) % 30 === 0 || frame === sequence.end - 1)
    console.log(`浅色对话：${frame - sequence.start + 1}/${sequence.end - sequence.start}`);
}
