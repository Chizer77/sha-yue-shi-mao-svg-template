import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { ffmpeg } from '../runtime.mjs';
import { root, composition } from '../config.mjs';
export async function createEncoder(
  file,
  count,
  { fps = composition.fps, codec = 'libx264', preset = 'fast', crf = 18 } = {},
) {
  const child = spawn(
    ffmpeg,
    [
      '-v',
      'error',
      '-y',
      '-f',
      'image2pipe',
      '-framerate',
      String(fps),
      '-vcodec',
      'png',
      '-i',
      'pipe:0',
      '-an',
      '-c:v',
      codec,
      '-threads',
      '4',
      '-preset',
      preset,
      '-crf',
      String(crf),
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(fps),
      '-frames:v',
      String(count),
      '-video_track_timescale',
      '60000',
      '-movflags',
      '+faststart',
      file,
    ],
    { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] },
  );
  let errors = '',
    failure = null;
  child.stderr.on('data', (chunk) => {
    errors = (errors + chunk.toString()).slice(-8000);
  });
  child.stdin.on('error', (error) => {
    failure = error;
  });
  const completion = once(child, 'close');
  await once(child, 'spawn');
  return {
    async write(buffer) {
      if (failure) throw failure;
      if (!child.stdin.write(buffer)) await once(child.stdin, 'drain');
    },
    async finish() {
      child.stdin.end();
      const [code] = await completion;
      if (code !== 0) throw Error(errors || '视频编码失败');
    },
    dispose() {
      if (child.exitCode === null) child.kill();
    },
  };
}
export function muxAudio(silent, output, start, end) {
  const full = start === 0 && end === composition.frameCount,
    args = ['-v', 'error', '-y', '-i', silent];
  if (!full)
    args.push(
      '-ss',
      String(start / composition.fps),
      '-t',
      String((end - start) / composition.fps),
    );
  args.push(
    '-i',
    path.join(root, 'assets/audio/original.m4a'),
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    full ? 'copy' : 'aac',
  );
  if (!full) args.push('-b:a', '192k');
  args.push('-map_metadata', '-1', '-movflags', '+faststart', output);
  execFileSync(ffmpeg, args, { windowsHide: true, stdio: 'pipe' });
}
