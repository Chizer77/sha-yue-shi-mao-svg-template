// Supplied suit portraits and formal PSD invitation hand, deterministic source-pixel motion.
export const representativeData = await fetch(new URL('./group.json', import.meta.url)).then(
  (r) => {
    if (!r.ok) throw Error('Missing representatives data');
    return r.json();
  },
);
const url = (p) => new URL('../../../' + p, import.meta.url).href;
const n = (x) => Number(x.toFixed(6)),
  clamp = (x) => Math.max(0, Math.min(1, x)),
  smooth = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
function sample(keys, f) {
  if (f <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++)
    if (f <= keys[i][0]) {
      const a = keys[i - 1],
        b = keys[i],
        q = (f - a[0]) / (b[0] - a[0]);
      return a.slice(1).map((x, k) => x + (b[k + 1] - x) * q);
    }
  return keys.at(-1).slice(1);
}
const area = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function invitationWarp(p) {
  const [x, y] = p;
  // Continuous upper-sleeve/elbow field. It is exactly zero at the shoulder,
  // collar, head and torso, so the new masked figure never swaps identity.
  const outerSource = sample(
    [
      [0, 240],
      [700, 251],
      [750, 232],
      [900, 222],
      [1050, 208],
      [1125, 201],
      [1200, 191],
      [1275, 174],
      [1340, 160],
      [1402, 153],
    ],
    y,
  )[0];
  const bend = sample(
    [
      [0, 0],
      [730, 0],
      [825, 0],
      [975, -12],
      [1080, -26],
      [1160, -14],
      [1220, 42],
      [1290, 98],
      [1402, 125],
    ],
    y,
  )[0];
  // The sleeve's elbow remains outside the torso; its lower edge returns into
  // the waist. Linear interior falloff keeps jacket pixels continuous without
  // making the original hanging sleeve remain as a second arm below the hand.
  const w = clamp((500 - x) / (500 - outerSource));
  return [x + bend * w, y];
}
export function representativesState(t) {
  const raw = t * 60,
    frame = Math.abs(raw - Math.round(raw)) < 1e-8 ? Math.round(raw) : raw,
    r = representativeData,
    gesture = frame >= r.gestureFrame;
  const actors = r.actors.map((a) => {
    const [dx, dy] = sample(a.bodyKeys, frame);
    return {
      ...a,
      dx,
      dy,
      x: a.base.x + dx,
      y: a.base.y + dy,
      scale: a.base.scale,
      gesture: a.id === 'center' && gesture,
    };
  });
  const vertices = r.mesh.vertices.map((p) => (gesture ? invitationWarp(p) : p)),
    ratios = r.mesh.triangles.map(
      (t) => area(...t.map((i) => vertices[i])) / area(...t.map((i) => r.mesh.vertices[i])),
    ),
    c = actors.find((a) => a.id === 'center');
  return {
    frame,
    active: frame >= r.frameInterval[0] && frame < r.frameInterval[1],
    gesture,
    gestureFrame: r.gestureFrame,
    actors,
    vertices,
    minAreaRatio: Math.min(...ratios),
    hand: { ...r.hand, x: r.hand.x + c.dx, y: r.hand.y + c.dy, visible: gesture },
  };
}
function affine(p, q) {
  const [a, b, c] = p,
    [u, v, w] = q,
    x1 = b[0] - a[0],
    y1 = b[1] - a[1],
    x2 = c[0] - a[0],
    y2 = c[1] - a[1],
    d = x1 * y2 - x2 * y1,
    ux = v[0] - u[0],
    uy = v[1] - u[1],
    vx = w[0] - u[0],
    vy = w[1] - u[1],
    A = (ux * y2 - vx * y1) / d,
    B = (uy * y2 - vy * y1) / d,
    C = (vx * x1 - ux * x2) / d,
    D = (vy * x1 - uy * x2) / d;
  return [A, B, C, D, u[0] - A * a[0] - C * a[1], u[1] - B * a[0] - D * a[1]].map(n).join(' ');
}
function expanded(p, d) {
  const sign = Math.sign(area(...p)),
    ns = p.map((a, i) => {
      const b = p[(i + 1) % 3],
        x = b[0] - a[0],
        y = b[1] - a[1],
        l = Math.hypot(x, y);
      return [(sign * y) / l, (-sign * x) / l];
    });
  return p.map(([x, y], i) => {
    const a = ns[(i + 2) % 3],
      b = ns[i],
      f = d / (1 + a[0] * b[0] + a[1] * b[1]);
    return [n(x + (a[0] + b[0]) * f), n(y + (a[1] + b[1]) * f)];
  });
}
function faceSticker(a) {
  const sticker = a.faceSticker;
  if (!sticker) return '';
  const [x, y] = sticker.center;
  // 贴在人物原生坐标内，伸手前后都跟随脸移动；不经过手臂网格变形。
  return `<g data-suit24-face-sticker="captain-censored" transform="translate(${x} ${y}) rotate(${sticker.rotation})"><image href="${url(sticker.file)}" x="${-sticker.width / 2}" y="${-sticker.height / 2}" width="${sticker.width}" height="${sticker.height}" preserveAspectRatio="xMidYMid meet"/></g>`;
}
function actor(a, s) {
  const r = representativeData,
    attrs = `data-suit24="${a.id}" data-asset-id="${a.assetId}" data-dx="${a.dx}" data-dy="${a.dy}" data-gesture="${a.gesture}" transform="translate(${a.x} ${a.y}) scale(${a.scale})"`;
  if (!a.gesture)
    return `<g ${attrs}><image href="${url(a.file)}" width="${a.nativeSize[0]}" height="${a.nativeSize[1]}"/>${faceSticker(a)}</g>`;
  let defs = `<image id="s24-center-source" href="${url(a.file)}" width="${a.nativeSize[0]}" height="${a.nativeSize[1]}"/>`,
    pieces = '';
  for (const [i, t] of r.mesh.triangles.entries()) {
    const p = t.map((k) => r.mesh.vertices[k]),
      q = t.map((k) => s.vertices[k]);
    defs += `<clipPath id="s24-tri-${i}" clipPathUnits="userSpaceOnUse"><path d="M${expanded(
      q,
      0.55 / a.scale,
    )
      .map((p) => p.join(' '))
      .join('L')}Z"/></clipPath>`;
    pieces += `<g clip-path="url(#s24-tri-${i})"><use href="#s24-center-source" transform="matrix(${affine(p, q)})"/></g>`;
  }
  const mouth = a.mouth
    ? `<path data-original-human-mouth="open" d="${a.mouth.path}" fill="${a.mouth.fill}"/>`
    : '';
  return `<g ${attrs} data-motion-rig="continuous-own-sleeve" data-min-area="${s.minAreaRatio}"><defs>${defs}</defs>${pieces}${mouth}${faceSticker(a)}</g>`;
}
export function renderRepresentatives(t) {
  const s = representativesState(t);
  if (!s.active) return '';
  const h = s.hand;
  return `<g data-scene="representatives" data-frame="${s.frame}" data-gesture="${s.gesture}">${s.actors.map((a) => actor(a, s)).join('')}${h.visible ? `<image data-suit24-hand="formal-PSD" href="${url(h.file)}" x="${h.x}" y="${h.y}" width="${h.nativeSize[0] * h.scale}" height="${h.nativeSize[1] * h.scale}"/>` : ''}</g>`;
}
export const representativesScene = renderRepresentatives;
