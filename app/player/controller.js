export function createPlayback(renderer, audio) {
  let playing = false,
    pending = false,
    loopId = null,
    loopUnit = null,
    playbackRange = null,
    disposed = false;
  const events = new EventTarget(),
    notify = () => events.dispatchEvent(new Event('playback'));
  function pause() {
    playing = false;
    audio.pause();
    cancelAnimationFrame(loopId);
    loopId = null;
    notify();
  }
  function seek(time, { pausePlayback = true } = {}) {
    if (playbackRange)
      time = Math.max(
        playbackRange.start,
        Math.min((playbackRange.end_frame - 1) / renderer.project.fps, time),
      );
    if (pausePlayback) pause();
    const state = renderer.renderAt(time, { playing });
    audio.currentTime = state.time;
    return state;
  }
  function tick() {
    if (!playing || disposed) return;
    // 场景按四舍五入后的帧号切段，循环也使用同一边界，避免末尾半帧串入下一段。
    if (loopUnit && Math.round(audio.currentTime * renderer.project.fps) >= loopUnit.end_frame)
      audio.currentTime = loopUnit.start;
    else if (
      playbackRange &&
      Math.round(audio.currentTime * renderer.project.fps) >= playbackRange.end_frame
    ) {
      seek((playbackRange.end_frame - 1) / renderer.project.fps);
      return;
    }
    renderer.renderAt(audio.currentTime, { playing });
    if (audio.ended) {
      pause();
      return;
    }
    loopId = requestAnimationFrame(tick);
  }
  async function play() {
    if (playing || pending || disposed) return;
    pending = true;
    try {
      await renderer.ready;
      if (
        loopUnit &&
        (renderer.state.time < loopUnit.start || renderer.state.frame >= loopUnit.end_frame)
      )
        seek(loopUnit.start);
      else if (playbackRange && renderer.state.frame >= playbackRange.end_frame - 1)
        seek(playbackRange.start);
      if (renderer.state.frame >= renderer.project.frameCount - 1) seek(loopUnit?.start ?? 0);
      audio.currentTime = renderer.state.time;
      await audio.play();
      playing = true;
      notify();
      tick();
    } finally {
      pending = false;
    }
  }
  function setPlaybackRate(rate) {
    if (!Number.isFinite(rate) || rate < 0.25 || rate > 2)
      throw new TypeError('播放速度必须在0.25至2倍之间');
    audio.playbackRate = rate;
    audio.preservesPitch = true;
    return rate;
  }
  return {
    events,
    play,
    pause,
    seek,
    reset: () => seek(0),
    setPlaybackRate,
    toggle: () => (playing ? pause() : play()),
    setLoop: (unit) => {
      loopUnit = unit;
    },
    setRange: (range) => {
      playbackRange = range;
    },
    get playing() {
      return playing;
    },
    get time() {
      return renderer.state?.time ?? 0;
    },
    get playbackRate() {
      return audio.playbackRate;
    },
    dispose() {
      disposed = true;
      pause();
    },
  };
}
