import fs from 'node:fs/promises';
import path from 'node:path';
import { root, composition } from '../config.mjs';
import { sharp } from '../runtime.mjs';
import { openCapture } from '../export/browser.mjs';

const directory = path.join(root, 'exports/thumbnails');
await fs.mkdir(directory, { recursive: true });
const capture = await openCapture();
try {
  for (const unit of composition.units) {
    const buffer = await capture.frame(unit.thumbnailFrame);
    await sharp(buffer)
      .resize(320, 180)
      .jpeg({ quality: 86 })
      .toFile(path.join(directory, `stage-${String(unit.id).padStart(2, '0')}.jpg`));
    console.log(JSON.stringify({ stage: unit.id, frame: unit.thumbnailFrame }));
  }
} finally {
  await capture.close();
}
