// Timing keys are source-frame indices. Repeated sections have measured frame offsets.
import { characterMotion } from './motion.js';
import { protagonistPoint, protagonistClosed } from '../../characters/protagonist/light-outfit.js';
import { darkOutfitPoint, darkOutfitClosed } from '../../characters/protagonist/dark-outfit.js';
import { supportingCast } from '../../characters/representatives/chorus.js';
import { alienIntroduction } from './dialogue.js';
import { title, outline, tag, glyphs } from './typography.js';
import { background, g, text, track, clamp, ease, mix } from '../../core/svg.js';
const yellow = '#fbbf00';
const motionLayout = await fetch(new URL('./layout.json', import.meta.url)).then((r) => r.json());
function pose(kind, f, offset) {
  const layout =
    motionLayout.refrains.find((r) => r.offset_frames === Math.round(offset * 60)) ||
    motionLayout.refrains[0];
  const movement = characterMotion(kind, f),
    entry = layout[kind + '_enter'],
    exit = layout[kind + '_exit'];
  let y = motionLayout[kind + '_base_y'] + movement.bodyY;
  if (f <= entry.at(-1)[0]) y = track(entry, f);
  else if (f < entry.at(-1)[0] + 8) y = mix(entry.at(-1)[1], y, (f - entry.at(-1)[0]) / 8);
  if (f >= exit[0][0]) y = track(exit, f);
  return { y, motion: movement.motion, end: layout[kind + '_end_frame'] };
}
export function closingCharacter(t, offset = 0) {
  const f = (t - offset) * 60,
    p = pose('closed', f, offset);
  if (f < 417 || f >= p.end) return '';
  if (offset === 0) return protagonistClosed(motionLayout.closed_x, p.y, p.motion, f);
  // 第二、三轮共用棕衣素材和局部形变，进出场仍按各轮源片记录计算。
  return darkOutfitClosed(motionLayout.closed_x, p.y, p.motion, f);
}
export function chorus(t, ctx, offset = 0) {
  const q = t - offset,
    f = q * 60,
    third = offset > 100,
    second = Math.round(offset * 60) === 2332;
  let res = background(yellow);
  if (!third && f >= 732)
    res += g(background('#6b3f94'), ' ', `opacity="${clamp((f - 732) / 27)}"`);
  if (third && t >= 117.3)
    res += g(background('#000'), ' ', `opacity="${clamp((t - 117.3) / 0.35)}"`);
  if (offset > 0 && !second && q < 0.65) {
    if (third) res += g(ctx.scifi(105.55, ctx), '', `opacity="${1 - clamp((q - 0.23) / 0.32)}"`);
  }
  if (f >= (third ? 8 : 20) && f < 63) {
    const titleF = f + (third ? 12 : 0);
    let yy = track(
      [
        [20, -30],
        [29, 420],
        [38, 580],
        [49, 600],
        [63, 560],
      ],
      titleF,
    );
    res += g(title('人', 740, yy, 465, 420, 0, false), '', `data-event-frame="20"`);
    if (titleF >= 34)
      res += title(
        'は',
        1150,
        track(
          [
            [34, -40],
            [43, 565],
            [51, 600],
            [63, 560],
          ],
          titleF,
        ),
        430,
        450,
        0,
        false,
      );
  }
  if (f >= 63 && f < 156) {
    const a = track(
      [
        [63, 0.83],
        [69, 1.035],
        [77, 1],
        [151, 1],
        [156, 1],
      ],
      f,
    );
    res +=
      outline('猫', 1070, 820, 730, 900, -8) +
      g(
        title(
          '猫',
          68,
          715,
          710,
          895,
          track(
            [
              [63, -12],
              [77, -3],
              [144, -3],
              [156, -14],
            ],
            f,
          ),
        ),
        `translate(0 ${80 * (1 - a)}) scale(${a})`,
      );
  }
  if (f >= 156 && f < 249) {
    const a = ease((f - 156) / 12);
    res +=
      outline('PICO', 730, 320, 430, 1600) +
      g(glyphs('PO', 195, 180, 1110, 0), `translate(${-900 * (1 - a)} 0)`);
  }
  if (f >= 249 && f < 342) {
    const a = ease((f - 249) / 12);
    res +=
      outline('BIBO', 620, 330, 420, 1660) +
      g(glyphs('△]O', 65, 175, 1280, -2), `translate(0 ${-820 * (1 - a)})`);
  }
  if (third && f >= 342 && f < 450) res += supportingCast(f);
  if (!third) res += alienIntroduction(f, Math.round(offset * 60));
  if (f >= 32 && f < 375) {
    const p = pose('point', f, offset);
    if (f < p.end) {
      if (offset === 0) res += protagonistPoint(motionLayout.point_x, p.y, p.motion, f);
      // 同一局部帧调用同一摆臂实现，第三轮不再使用旧人物的独立骨架。
      else res += darkOutfitPoint(motionLayout.point_x, p.y, p.motion, f);
    }
  }
  if (f >= 93 && f < 156) res += tag('DALA DA DA DA DA', 1066, 110, (f - 93) / 60, true);
  if (f >= 187 && f < 249) res += tag('BALA BA BA BA', 205, 811, (f - 187) / 60);
  if (f >= 279 && f < 339) res += tag('BALA BA BA BA', 230, 815, (f - 279) / 60);
  if (f >= 410 && f < 442) {
    const label = third ? '本当に' : '絶対に';
    const count = f < 419 ? 1 : f < 432 ? 2 : 3;
    res += title(label.slice(0, count), 810, 700, 240, 230 * count, 0, false);
  }
  if (f >= 417) {
    if (f >= 443 && f < 545)
      res +=
        outline('そう', -65, 899, 580, 1550, -8) +
        title(
          'そう',
          842,
          718,
          414,
          1000,
          track(
            [
              [443, -10],
              [459, -4],
              [536, -4],
              [545, 12],
            ],
            f,
          ),
        );
    else if (f >= 545 && f < 639)
      res += outline('DIDO', 740, 1030, 440, 1560) + glyphs('OP', 889, 340, 1065, -3);
    else if (f >= 639 && f < 732)
      res +=
        glyphs('XEM', 740, 670, 1420, 0, true) +
        g(
          glyphs('XƎM', 812, 245, 1250, -3),
          `translate(0 ${f > 717 ? -ease((f - 717) / 15) * 1150 : 0})`,
        );
    res += closingCharacter(t, offset);
    if (f >= 475 && f < 545) res += tag('NYA NYA NYA NYA', 1066, 165, (f - 475) / 60, true);
    if (f >= 574 && f < 639) res += tag('BALA BA BA BA', 1306, 740, (f - 574) / 60);
    if (f >= 670 && f < 732) res += tag('NALA NA NA NA', 1250, 727, (f - 670) / 60);
  }
  return res;
}
