import {
  C,
  rect,
  tx,
  keys,
  poseKeys,
  choirBackdrop,
  native,
  motion,
  timeline,
  renderDisplayTitle,
  meowScreen,
  choirSpectator,
  wrapMeowScene,
} from '../../sequences/narrative/shared.js';
export function game(t, ctx) {
  const g = timeline.game;
  let visible = meowScreen(t);
  if (t >= motion.game.spectator.entryY[0][0]) {
    const spectator = motion.game.spectator;
    const measured = spectator.settled_patch_offsets;
    const dx =
      t >= 53.3
        ? keys(
            measured.map((v) => [v[0], v[1]]),
            t,
          )
        : 0;
    const dy =
      t >= 53.3
        ? keys(
            measured.map((v) => [v[0], v[2]]),
            t,
          )
        : 0;
    const rise = poseKeys(spectator.entryY, t),
      alienRise = poseKeys(motion.game.aliens.entryY, t);
    visible += `<g data-motion="source-alien-entry" transform="translate(0 ${alienRise})">${native('alien', 'translate(-139.5 597.3) scale(.505)') + native('alien', 'translate(-14 569.2) scale(.546)')}</g>`;
    visible += `<g data-motion="source-spectator-entry-and-measured-hold" transform="translate(${dx} ${rise + dy})">${choirSpectator()}</g>`;
  }
  visible += renderDisplayTitle(t);
  const blur = keys(
    [
      [64.966667, 0],
      [65.1, 8],
      [65.4, 36],
      [65.833333, 56],
    ],
    t,
  );
  visible = `<defs><filter id="game-exit-blur"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><g data-meow-visible ${blur > 0 ? 'filter="url(#game-exit-blur)"' : ''}>${visible}</g>`;
  const caption =
    t >= 3916 / 60
      ? tx(g.caption.text, 960, 432, 177, 'text-anchor="middle" letter-spacing="24"')
      : '';
  return wrapMeowScene(
    t,
    rect(0, 0, 1920, 1080, t < 52.3 ? choirBackdrop(t) : C.game) + visible + caption,
  );
}

export const render = game;
