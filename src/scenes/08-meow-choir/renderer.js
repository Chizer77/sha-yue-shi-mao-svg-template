// 同一套原版 Canvas 绘制函数同时驱动 SVG 适配器和视频导出。
export function createMeowRenderer(context, song, settings = {}) {
  const ctx = context;
  const els = {
    canvas: { width: settings.width ?? 1920, height: settings.height ?? 1080 },
    fps: { value: settings.fps ?? 60 },
    lyricFont: { value: settings.lyricFont ?? '"ZCOOL KuaiLe", system-ui, sans-serif' },
    lyricColor: { value: settings.lyricColor ?? '#171b1f' },
    lyricOpacity: { value: settings.lyricOpacity ?? 1 },
    lyricHeight: { value: settings.lyricHeight ?? 0 },
  };
  const defaultClosedImage = null,
    defaultOpenImage = null;
  const CHARACTER_SIZE_RATIO = 0.3;
  const LYRIC_FLOAT_DURATION = 0.7;
  const LYRIC_HOLD_DURATION = 0;
  const LYRIC_FADE_DURATION = 0.3;
  const LYRIC_TOTAL_DURATION = LYRIC_FLOAT_DURATION + LYRIC_HOLD_DURATION + LYRIC_FADE_DURATION;
  const DYNAMICS_ATTACK = 0.05;
  const DYNAMICS_RELEASE = 0.18;
  const DEFAULT_COLORS = [
    '#49c5b6',
    '#f0c15f',
    '#ef7d57',
    '#8ab4f8',
    '#c58af9',
    '#7ad77a',
    '#f285ad',
    '#6fd0ff',
  ];
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeConfig(track, index, total) {
    const x = ((index + 1) / (total + 1)) * els.canvas.width;
    return {
      id: crypto.randomUUID(),
      name: track.name || `轨道 ${track.index + 1}`,
      x,
      y: els.canvas.height * 0.68,
      scale: 1,
      tilt: 10,
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      closedImage: null,
      openImage: null,
    };
  }

  function activeNotes(track, time) {
    return track.notes.filter((note) => note.start <= time && note.end > time);
  }

  function drawCharacter(config, note, time, index) {
    const mouthOpen = resolvedMouthState(song && song.tracks[index], note, time);
    const image = mouthOpen
      ? config.openImage || defaultOpenImage
      : config.closedImage || defaultClosedImage;
    const baseSize =
      Math.min(els.canvas.width, els.canvas.height) * CHARACTER_SIZE_RATIO * config.scale;
    const { pitchStretch, tilt } = characterDynamics(
      song && song.tracks[index],
      time,
      index,
      config.tilt,
    );

    ctx.save();
    ctx.translate(config.x, config.y);
    ctx.transform(1, 0, Math.tan((tilt * Math.PI) / 180), 1, 0, 0);
    ctx.scale(1, pitchStretch);

    if (image) {
      const ratio = image.width / image.height || 1;
      const height = baseSize;
      const width = height * ratio;
      ctx.drawImage(image, -width / 2, -height, width, height);
    } else {
      drawPlaceholder(config, mouthOpen, baseSize);
    }
    ctx.restore();
  }

  function isMouthOpen(track, note, time) {
    if (!note || !track) return false;
    const fps = clamp(Number(els.fps.value) || 60, 12, 60);
    const gapTol = 1 / fps;
    const reart = track.notes.some((n) => n.start < note.start && n.end >= note.start - gapTol);
    if (reart && time - note.start < 2 / fps) return false;
    return true;
  }

  function drawPlaceholder(config, isOpen, size) {
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.roundRect(-size * 0.38, -size, size * 0.76, size, size * 0.16);
    ctx.fill();
    ctx.fillStyle = '#171b1f';
    ctx.beginPath();
    ctx.arc(-size * 0.16, -size * 0.64, size * 0.045, 0, Math.PI * 2);
    ctx.arc(size * 0.16, -size * 0.64, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#171b1f';
    ctx.lineWidth = Math.max(3, size * 0.035);
    ctx.beginPath();
    if (isOpen) {
      ctx.ellipse(0, -size * 0.42, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(-size * 0.14, -size * 0.42);
      ctx.lineTo(size * 0.14, -size * 0.42);
    }
    ctx.stroke();
  }

  function drawLyric(config, track, time) {
    const lyric = currentLyric(track, time);
    if (!lyric) return;

    const age = time - lyric.time;
    const floatProgress = clamp(age / LYRIC_FLOAT_DURATION, 0, 1);
    const eased = 1 - (1 - floatProgress) ** 3;
    const fadeStart = LYRIC_FLOAT_DURATION + LYRIC_HOLD_DURATION;
    const alpha = age <= fadeStart ? 1 : 1 - clamp((age - fadeStart) / LYRIC_FADE_DURATION, 0, 1);
    if (alpha <= 0) return;

    // 在 drawLyric 函数中，将 ctx.globalAlpha = alpha; 改为同时乘以透明度滑块的值
    // 获取透明度滑块的值，并与 alpha 相乘
    const opacity = Number(els.lyricOpacity.value);
    const finalAlpha = alpha * opacity;

    const size =
      Math.min(els.canvas.width, els.canvas.height) * CHARACTER_SIZE_RATIO * config.scale;
    const x = clamp(config.x, 18, els.canvas.width - 18);
    const y = Math.max(32, config.y - size - 28 - Number(els.lyricHeight.value) - eased * 120);
    const fontSize = clamp(size * 0.22, 18, 96);
    const maxWidth = Math.max(120, Math.min(els.canvas.width * 0.42, size * 2.8));
    const lyricFont = `700 ${fontSize}px ${els.lyricFont.value}`;
    const lines = wrapText(lyric.text, maxWidth, lyricFont);
    const lineHeight = fontSize * 1.22;
    const textY = y - lines.length * lineHeight;

    ctx.save();
    ctx.globalAlpha = finalAlpha;
    ctx.fillStyle = els.lyricColor.value;
    ctx.font = lyricFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, index) => {
      ctx.fillText(line, x, textY + lineHeight * index + lineHeight / 2);
    });
    ctx.restore();
  }

  function currentLyric(track, time) {
    if (!track.lyrics?.length) return null;
    let lyric = null;
    for (const candidate of track.lyrics) {
      if (candidate.time <= time) lyric = candidate;
      else break;
    }
    if (!lyric || time - lyric.time > LYRIC_TOTAL_DURATION) return null;
    return lyric;
  }

  function wrapText(text, maxWidth, font) {
    ctx.save();
    ctx.font = font;
    const chars = Array.from(text);
    const lines = [];
    let line = '';
    for (const char of chars) {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char.trimStart();
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines.slice(0, 3);
  }

  function smoothstep01(x) {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  }

  function tiltDirection(time, index, pitch) {
    const dir = (bucket) => {
      const seed = Math.sin((bucket + 1) * 9898.233 + index * 313.7 + pitch * 19.19) * 43758.5453;
      return (seed - Math.floor(seed) - 0.5) * 2;
    };
    const f = time * 8;
    const b = Math.floor(f);
    return dir(b) + (dir(b + 1) - dir(b)) * smoothstep01(f - b);
  }

  function characterDynamics(track, time, index, maxTilt) {
    const attack = DYNAMICS_ATTACK;
    const release = DYNAMICS_RELEASE;
    const targetStretch = (pitch) => 1 + clamp((pitch - 55) / 24, -1, 1) * 0.2; // 55 = G3 base pitch

    // Deviation (pitchStretch - 1) and tilt left by a note's release tail at `time`.
    const releaseDevTilt = (note) => {
      if (!note) return { dev: 0, tilt: 0 };
      const relProg = (time - note.end) / release;
      if (relProg < 0 || relProg >= 1) return { dev: 0, tilt: 0 };
      const attackAtEnd = smoothstep01((note.end - note.start) / attack);
      const env = attackAtEnd * (1 - smoothstep01(relProg));
      return {
        dev: (targetStretch(note.pitch) - 1) * env,
        tilt: tiltDirection(time, index, note.pitch) * maxTilt * env,
      };
    };

    if (!track) return { pitchStretch: 1, tilt: 0 };
    const active = track.notes.filter((n) => n.start <= time && n.end > time);
    if (active.length) {
      const note = active.reduce((h, c) => (c.pitch > h.pitch ? c : h));
      // Crossfade from the height/tilt the previous note still has at this moment into
      // this note's target, so a new note grows from the current height (no instant jump).
      const attackProg = smoothstep01((time - note.start) / attack);
      const targetDev = targetStretch(note.pitch) - 1;
      const targetTilt = tiltDirection(time, index, note.pitch) * maxTilt;
      const before = track.notes.filter((n) => n.end <= note.start);
      const prev = before.length ? before.reduce((a, b) => (b.end > a.end ? b : a)) : null;
      const residual = releaseDevTilt(prev);
      return {
        pitchStretch: 1 + residual.dev + (targetDev - residual.dev) * attackProg,
        tilt: residual.tilt + (targetTilt - residual.tilt) * attackProg,
      };
    }
    const ended = track.notes.filter((n) => n.end <= time && time < n.end + release);
    if (ended.length) {
      const note = ended.reduce((a, b) => (b.end > a.end ? b : a));
      const r = releaseDevTilt(note);
      return { pitchStretch: 1 + r.dev, tilt: r.tilt };
    }
    return { pitchStretch: 1, tilt: 0 };
  }

  function resolvedMouthState(track, note, time) {
    const offset = settings.mouthTimeOffsetSeconds || 0;
    if (!offset) return isMouthOpen(track, note, time);
    const mouthTime = time + offset;
    const active = activeNotes(track, mouthTime);
    const mouthNote = active.length
      ? active.reduce((highest, current) => (current.pitch > highest.pitch ? current : highest))
      : null;
    // 把连音闭嘴安排在起音之前，身体运动仍按原时间计算。
    return isMouthOpen(track, mouthNote, mouthTime);
  }

  function drawConfiguredLyrics(config, track, songTime, index) {
    if (settings.lyricTrackIndex != null && settings.lyricTrackIndex !== index) return;
    const time = songTime + (settings.lyricTimeOffsetSeconds || 0);
    const layout = config.lyricConfiguration || config;
    if (!settings.lyricTrail) {
      drawLyric(layout, track, time);
      return;
    }
    const visible = track.lyrics.filter(
      (lyric) => lyric.time <= time && time - lyric.time < settings.lyricTrail.duration,
    );
    // 发布版只有中央吐字；历史音节以代码生成淡淡的残影，不读取视频像素。
    for (const lyric of visible) {
      const age = time - lyric.time;
      const opacity =
        age <= settings.lyricTrail.hold
          ? 1
          : Math.exp(-(age - settings.lyricTrail.hold) / settings.lyricTrail.decay);
      const originalOpacity = els.lyricOpacity.value;
      els.lyricOpacity.value = originalOpacity * opacity;
      drawLyric(layout, { lyrics: [lyric] }, time);
      els.lyricOpacity.value = originalOpacity;
    }
  }

  function frame(time, configurations) {
    song.tracks.forEach((track, index) => {
      const config = configurations[index];
      const active = activeNotes(track, time);
      const note = active.length
        ? active.reduce((highest, current) => (current.pitch > highest.pitch ? current : highest))
        : null;
      drawCharacter(config, note, time, index);
      drawConfiguredLyrics(config, track, time, index);
    });
  }

  function states(time, configurations) {
    return song.tracks.map((track, index) => {
      const config = configurations[index],
        active = activeNotes(track, time);
      const note = active.length
        ? active.reduce((highest, current) => (current.pitch > highest.pitch ? current : highest))
        : null;
      return {
        ...characterDynamics(track, time, index, config.tilt),
        mouthOpen: resolvedMouthState(track, note, time),
      };
    });
  }

  return {
    frame,
    states,
    defaults: () => song.tracks.map((track, index) => makeConfig(track, index, song.tracks.length)),
  };
}
