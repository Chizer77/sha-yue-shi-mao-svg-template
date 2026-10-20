import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { composition, root } from '../config.mjs';
import { acquireOperation } from './operation-lock.mjs';
const jobs = new Map();
let active = null;
const reportFolder = path.join(root, 'exports/jobs');
function save(job) {
  fs.mkdirSync(reportFolder, { recursive: true });
  fs.writeFileSync(
    path.join(reportFolder, job.id + '.json'),
    JSON.stringify(job, null, 2) + '\n',
    'utf8',
  );
}
export function getJob(id) {
  if (id === 'current') return active ? jobs.get(active) : ([...jobs.values()].at(-1) ?? null);
  if (!/^[\w-]+$/.test(id)) return null;
  if (jobs.has(id)) return jobs.get(id);
  const file = path.join(reportFolder, id + '.json');
  if (!fs.existsSync(file)) return null;
  const job = JSON.parse(fs.readFileSync(file, 'utf8'));
  return ['starting', 'rendering'].includes(job.status)
    ? { ...job, status: 'interrupted', error: '服务已重启，请重新导出' }
    : job;
}
export function startJob(input = {}) {
  if (active) {
    const error = Error('已有导出任务正在进行');
    error.status = 409;
    throw error;
  }
  const start = input.start ?? 0,
    end = input.end ?? composition.frameCount;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > composition.frameCount ||
    start >= end
  )
    throw Error('导出帧区间无效');
  const release = acquireOperation('export');
  const id = randomUUID(),
    stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `animation-${start === 0 && end === composition.frameCount ? 'full' : `${start}-${end}`}-${stamp}.mp4`;
  const job = {
    id,
    status: 'starting',
    start,
    end,
    completedFrames: 0,
    totalFrames: end - start,
    progress: 0,
    createdAt: new Date().toISOString(),
    url: '/exports/video/' + name,
  };
  try {
    jobs.set(id, job);
    active = id;
    save(job);
    const child = spawn(
      process.execPath,
      [
        path.join(root, 'scripts/export/video.mjs'),
        `--start=${start}`,
        `--end=${end}`,
        `--out=exports/video/${name}`,
      ],
      { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    child.once('error', release);
    child.once('close', release);
    attachProcess(child, job);
    return job;
  } catch (error) {
    active = null;
    release();
    throw error;
  }
}
function attachProcess(child, job) {
  let pending = '',
    errors = '';
  child.stdout.on('data', (chunk) => {
    pending += chunk.toString('utf8');
    const lines = pending.split('\n');
    pending = lines.pop();
    for (const line of lines)
      try {
        const event = JSON.parse(line);
        if (event.frame !== undefined) {
          job.status = 'rendering';
          job.completedFrames = event.frame - job.start + 1;
          job.progress = job.completedFrames / job.totalFrames;
          save(job);
        }
        if (event.meowTiming) job.meowTiming = event.meowTiming;
      } catch {}
  });
  child.stderr.on('data', (chunk) => {
    errors = (errors + chunk.toString('utf8')).slice(-8000);
  });
  child.on('error', (error) => {
    job.status = 'failed';
    job.error = error.message;
    active = null;
    save(job);
  });
  child.on('close', (code) => {
    if (code === 0) {
      job.status = 'complete';
      job.progress = 1;
      job.completedFrames = job.totalFrames;
    } else {
      job.status = 'failed';
      job.error = job.error || errors || '导出进程异常结束';
    }
    job.finishedAt = new Date().toISOString();
    active = null;
    save(job);
  });
}
