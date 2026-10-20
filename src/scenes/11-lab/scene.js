import { tx, room, glitch, aperture } from '../../sequences/scifi/shared.js';
export function render(t, ctx) {
  if (t >= 4726 / 60) return aperture(room(t, ctx), 117);
  const base = `<rect width="1920" height="1080" fill="#5dcbd5"/>${tx('到头来还不是', 960, 369, 76, 'text-anchor="middle"')}${tx('一 模 一 样', 960, 655, 162, 'text-anchor="middle"')}`;
  return glitch(base, t, 78.28, 0.65);
}
