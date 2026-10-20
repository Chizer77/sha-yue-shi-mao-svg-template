import { renderFood } from './food.js';
import { background, g, serif, handFrame, clamp, ease } from '../../core/svg.js';
const slots = [
  { x: 440, from: 'noodles', to: 'can', arrival: 3950, replace: 4149 },
  { x: 960, from: 'spicy', to: 'catTreat', arrival: 3998, replace: 4191 },
  { x: 1460, from: 'cable', to: 'yarn', arrival: 4038, replace: 4224 },
];
const props = {
  can: ['can', [582, 1295, 704, 443]],
  catTreat: ['cat-treat', [1712, 831, 422, 988]],
  yarn: ['yarn-ball', [2589, 1234, 749, 514]],
};
const urls = Object.fromEntries(
  Object.entries(props).map(([k, [n]]) => [
    k,
    new URL('../../../assets/props/food/' + n + '.png', import.meta.url).href,
  ]),
);
function prop(id, x, bottom) {
  if (id === 'can') return renderFood(id, x, bottom);
  const b = props[id][1],
    s = Math.min(350 / b[2], 370 / b[3]),
    w = b[2] * s,
    h = b[3] * s;
  return `<svg data-template-prop="${id}" x="${x - w / 2}" y="${bottom - h}" width="${w}" height="${h}" viewBox="${b.join(' ')}"><image href="${urls[id]}" width="3840" height="2160"/></svg>`;
}
const labelKeys = [
  [3950, '泡面'],
  [3998, '辣条'],
  [4038, '充电线'],
  [4090, '它们本质上就是'],
  [4149, '罐头'],
  [4191, '猫条'],
  [4224, '毛线球'],
  [4280, '无论说得多上流'],
];
export function objects(t) {
  const f = Math.round(t * 60);
  let body = '';
  for (const s of slots) {
    if (f < s.arrival) continue;
    const r = f >= s.replace;
    let bottom = 880;
    if (r) {
      bottom += (1 - ease((f - s.replace) / 14)) * 470;
      body += prop(s.to, s.x, bottom);
    } else {
      bottom += (1 - ease((f - s.arrival) / 17)) * 500;
      if (f > s.replace - 11) bottom -= ease((f - s.replace + 11) / 11) * 800;
      body +=
        s.from === 'noodles' || s.from === 'spicy'
          ? renderFood(s.from, s.x, bottom)
          : `<use href="#obj-${s.from}" transform="translate(${s.x} ${bottom})"/>`;
    }
  }
  const label = labelKeys.findLast((k) => k[0] <= f)?.[1] || '';
  body +=
    label === '它们本质上就是'
      ? serif('它们', 302, 333, 142) +
        serif('本质上', 598, 333, 142, '#f47775') +
        serif('就是', 1052, 333, 142)
      : serif(
          label,
          960,
          345,
          label.length > 5 ? 95 : 165,
          '#fff',
          'text-anchor="middle" letter-spacing="18"',
        );
  return (
    background('#54c9e0') + handFrame(t) + g(body, '', `opacity="${1 - clamp((f - 4323) / 17)}"`)
  );
}

export const render = objects;
