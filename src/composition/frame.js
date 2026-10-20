import { chorusDefs } from '../sequences/chorus/typography.js';
import { closingCharacter } from '../sequences/chorus/scene.js';
import { narrativeDefs } from '../sequences/narrative/shared.js';
import { scifi, scifiDefs } from '../sequences/scifi/scene.js';
import { narrativeTransition } from './narrative-transitions.js';
import { scenes } from './registry.js';
import * as shared from '../core/svg.js';

export const project = await fetch(new URL('../../config/composition.json', import.meta.url)).then(
  (response) => response.json(),
);
export const definitions = shared.commonDefs + chorusDefs + narrativeDefs + scifiDefs;
const context = { ...shared, scifi };

export function composeAt(seconds) {
  if (!Number.isFinite(seconds)) throw new TypeError('时间必须是有限数值');
  const time = shared.clamp(seconds, 0, (project.frameCount - 1) / project.fps),
    frame = Math.round(time * project.fps);
  const unit =
    project.units.find((item) => frame >= item.start_frame && frame < item.end_frame) ||
    project.units.at(-1);
  const transition = unit.template === 'narrative' ? narrativeTransition(time, context) : null;
  let body = transition ?? scenes[unit.id](time, context, unit);
  // 前一段人物尚未完全退场时，继续叠加到新段，而不是按目录边界硬切。
  if (time >= 51.3 && time < 51.8166666667) body += closingCharacter(time, 2332 / 60);
  return { time, frame, unit, body };
}
