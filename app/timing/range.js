export function validLoopRange(start, end, unit, fps) {
  const first = Math.max(unit.start_frame, Math.round(start * fps));
  const last = Math.min(unit.end_frame, Math.round(end * fps));
  if (!Number.isFinite(first) || !Number.isFinite(last) || first >= last)
    throw Error('A 点必须在 B 点之前，且至少相隔一帧');
  return { start: first / fps, end: last / fps, start_frame: first, end_frame: last };
}
