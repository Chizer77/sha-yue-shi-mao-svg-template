import fs from 'node:fs/promises';
import path from 'node:path';
import { root, composition } from '../config.mjs';
import { openCapture } from './browser.mjs';
import { createEncoder, muxAudio } from './encoder.mjs';
const args = Object.fromEntries(
  process.argv.slice(2).map((value) => {
    const [key, ...rest] = value.replace(/^--/, '').split('=');
    return [key, rest.join('=') || true];
  }),
);
const start = Number(args.start ?? 0),
  end = Number(args.end ?? composition.frameCount);
if (
  !Number.isInteger(start) ||
  !Number.isInteger(end) ||
  start < 0 ||
  end > composition.frameCount ||
  start >= end
)
  throw Error('导出帧区间无效');
const profile = args.profile;
if (profile && profile !== 'hevc-1080p30') throw Error('未知导出配置');
const encoding = profile
  ? { fps: 30, codec: 'libx265', preset: 'slow', crf: 18 }
  : { fps: composition.fps, codec: 'libx264', preset: 'fast', crf: 18 };
const frameStep = composition.fps / encoding.fps;
if (!Number.isInteger(frameStep) || frameStep < 1) throw Error('工程帧率必须是输出帧率的整数倍');
const frameCount = Math.ceil((end - start) / frameStep);
const output = path.resolve(root, args.out || 'exports/video/animation.mp4'),
  silent = output.replace(/\.mp4$/i, '.silent.mp4');
await fs.mkdir(path.dirname(output), { recursive: true });
const capture = await openCapture(args.browser);
let encoder;
try {
  const meowTiming = await capture.page.evaluate(() => window.animation.meowTiming.get());
  console.log(JSON.stringify({ meowTiming }));
  encoder = await createEncoder(silent, frameCount, encoding);
  const before = Date.now();
  // 保留原工程时间轴，以原帧号采样，避免降帧率导致动画和音轨变速。
  for (let frame = start; frame < end; frame += frameStep) {
    await encoder.write(await capture.frame(frame));
    if ((frame - start) % 60 === 0 || frame === end - 1)
      console.log(
        JSON.stringify({ frame, end, seconds: Math.round((Date.now() - before) / 1000) }),
      );
  }
  await encoder.finish();
  muxAudio(silent, output, start, end);
  await fs.unlink(silent);
  await fs.writeFile(
    output.replace(/\.mp4$/i, '.render.json'),
    JSON.stringify(
      {
        start,
        end,
        frameCount,
        fps: encoding.fps,
        encoding,
        sourceFps: composition.fps,
        frameStep,
        width: composition.width,
        height: composition.height,
        meowTiming,
        seconds: (Date.now() - before) / 1000,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log(JSON.stringify({ done: output }));
} finally {
  encoder?.dispose();
  await capture.close();
}
