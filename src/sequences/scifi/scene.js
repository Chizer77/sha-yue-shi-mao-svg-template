import { render as lab } from '../../scenes/11-lab/scene.js';
import { render as landing } from '../../scenes/12-landing/scene.js';
import { render as encounter } from '../../scenes/13-encounter/scene.js';
import { render as wand } from '../../scenes/14-tomato-wand/scene.js';
import { render as credits } from '../../scenes/16-credits/scene.js';
export { scifiDefs } from './shared.js';
export function scifi(t, ctx = {}) {
  return (
    t < 4900 / 60 ? lab : t < 90.05 ? landing : t < 102.8 ? encounter : t < 105.8 ? wand : credits
  )(t, ctx);
}
