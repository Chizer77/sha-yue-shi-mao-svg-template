import {
  rect,
  tx,
  vertical,
  keys,
  poseKeys,
  bodyTrack,
  native,
  motion,
  thinkingArtwork,
} from '../../sequences/narrative/shared.js';
export function thinking(t, ctx) {
  const oh = t >= motion.thinking.pose_cut;
  const sink = poseKeys(motion.thinking.y, t);
  const bg = oh ? (t < 38.78 ? '#99933a' : '#ffbb00') : '#337a73';
  const behind = oh
    ? tx(
        '哦!',
        170,
        807,
        810,
        `fill="#ffefaa" opacity="${
          0.78 *
          keys(
            [
              [38.65, 1],
              [39.0, 1],
              [39.1, 0.2],
              [39.15, 0],
            ],
            t,
          )
        }"`,
      )
    : '';
  return (
    rect(0, 0, 1920, 1080, bg) +
    behind +
    thinkingArtwork(t, motion.thinking, bodyTrack(motion.thinking, t)) +
    (!oh && t < 38.15 ? vertical('似曾相识', 1556, 221, 74, 99) : '') +
    (!oh && t >= 37.1667 ? tx('难道说……', 150, 990, 133, 'fill="#d3e6c5" opacity=".17"') : '') +
    (oh ? native('bulb', `translate(300 ${-80 + sink})`) : '')
  );
}

// 中央合唱实时运行源程序，并使用发布版校准参数；外围继续使用模板运动。

export const render = thinking;
