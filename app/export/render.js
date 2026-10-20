import { createStage } from '../../src/core/stage.js';
const renderer = createStage(document.querySelector('#stage'));
window.animation = {
  ...renderer,
  project: renderer.project,
  frameCount: renderer.project.frameCount,
  fps: renderer.project.fps,
  pause() { },
  get frameReady() {
    return renderer.settle();
  },
};
