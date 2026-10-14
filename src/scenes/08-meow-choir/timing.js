export const MEOW_TIMING_STORAGE_KEY = 'choir-timing';
export const MEOW_TIMING_FPS = 60;
export const MEOW_TIMING_LIMIT = 120;
export const MEOW_TIMING_FIELDS = [
  {key: 'songTimeOffsetSeconds', label: '整段动画偏移', description: '同时调整五只猫的动作、口型和吐字'},
  {key: 'mouthTimeOffsetSeconds', label: '口型额外偏移', description: '在整段偏移的基础上，单独调整张嘴、闭嘴'},
  {key: 'lyricTimeOffsetSeconds', label: '吐字额外偏移', description: '在整段偏移的基础上，单独调整中央“喵”字'},
];

export function browserTimingStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function timingValuesFromRecord(record) {
  const values = record?.timings ?? record;
  if (!values || !MEOW_TIMING_FIELDS.some(field => Object.hasOwn(values, field.key))) {
    throw new TypeError('文件中没有喵喵对轴参数');
  }
  return values;
}

function validateOffsets(values, current) {
  const next = {...current};
  for (const {key} of MEOW_TIMING_FIELDS) {
    if (!Object.hasOwn(values, key)) continue;
    const value = values[key];
    if (typeof value !== 'number' || !Number.isFinite(value)
        || Math.abs(value * MEOW_TIMING_FPS) > MEOW_TIMING_LIMIT + 1e-8) {
      throw new TypeError('偏移必须是有限数值，范围为前后120帧（2秒）');
    }
    next[key] = value;
  }
  return next;
}

export function createMeowTimingController(data, storage = browserTimingStorage()) {
  const defaults = Object.freeze({
    songTimeOffsetSeconds: data.songTimeOffset || 0,
    mouthTimeOffsetSeconds: data.canvas.mouthTimeOffsetSeconds || 0,
    lyricTimeOffsetSeconds: data.canvas.lyricTimeOffsetSeconds || 0,
  });
  let values = {...defaults}, notice = '';

  function set(offsets) {
    const next = validateOffsets(offsets, values);
    // 只改变本段读取动画的时间，音乐和模板的进出场继续使用原时间轴。
    data.songTimeOffset = next.songTimeOffsetSeconds;
    data.canvas.mouthTimeOffsetSeconds = next.mouthTimeOffsetSeconds;
    data.canvas.lyricTimeOffsetSeconds = next.lyricTimeOffsetSeconds;
    values = next;
    return {...values};
  }

  function loadSaved() {
    notice = '';
    try {
      const saved = storage?.getItem(MEOW_TIMING_STORAGE_KEY);
      return set(saved ? {...defaults, ...timingValuesFromRecord(JSON.parse(saved))} : defaults);
    } catch {
      notice = '本机设置无法读取，已使用工程默认值。';
      return set(defaults);
    }
  }

  function save() {
    if (!storage) throw new Error('此浏览器不能保存本机设置，请导出JSON');
    storage.setItem(MEOW_TIMING_STORAGE_KEY, JSON.stringify({schema: 1, timings: values}));
    return {...values};
  }

  function exportSettings() { return {...values}; }

  loadSaved();
  return {get: () => ({...values}), defaults: () => ({...defaults}), set, save, loadSaved,
    reset: () => set(defaults), exportSettings, get notice() { return notice; }};
}
