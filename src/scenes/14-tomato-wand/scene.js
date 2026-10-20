import {
  E,
  img,
  aperture,
  renderMiniRepresentatives,
  renderExplanationBubble,
  renderWandHolder,
} from '../../sequences/scifi/shared.js';
import { handShot } from '../13-encounter/scene.js';
import { handShotState } from '../13-encounter/motion.js';
function explanation(t, ctx) {
  const bubble = E((t - 104.64) / 0.26);
  return (
    img('field') +
    `<g opacity="${bubble}">${renderExplanationBubble()}</g>` +
    renderMiniRepresentatives(t) +
    renderWandHolder()
  );
}
export function render(t, ctx) {
  if (t >= 6259 / 60) return explanation(t, ctx);
  const bars = handShotState(t);
  return aperture(handShot(t), bars.topBars, bars.bottomBars);
}
