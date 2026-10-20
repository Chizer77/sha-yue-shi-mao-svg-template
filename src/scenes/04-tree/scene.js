// 新人物使用原生 URL，避免被旧人物素材移除策略映射为占位图。
// 树、树洞与人物共用模板世界坐标，探头采用短缓动和树洞自然遮挡。
// Source video frames are QA only. All scenery below is editable SVG geometry.
let data;
export const treeAssetURL = new URL(
  '../../../assets/characters/protagonist-dark/tree-peek.png',
  import.meta.url,
).href;
export const ready = (async () => {
  const response = await fetch(new URL('./motion.json', import.meta.url));
  if (!response.ok) throw new Error('Unable to load tree-scene.json');
  data = await response.json();
  const image = new Image();
  image.src = treeAssetURL;
  await image.decode();
  return true;
})();
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function linear(keys, frame, column = 1) {
  if (frame <= keys[0][0]) return keys[0][column];
  for (let i = 1; i < keys.length; i++)
    if (frame <= keys[i][0]) {
      const u = (frame - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      return keys[i - 1][column] + (keys[i][column] - keys[i - 1][column]) * u;
    }
  return keys.at(-1)[column];
}
function step(keys, frame) {
  return keys.findLast((k) => frame >= k[0])?.[1] ?? keys[0][1];
}
function peekMotion(frame) {
  const motion = data.character.reveal_motion;
  const progress = clamp((frame - motion.start_frame) / (motion.end_frame - motion.start_frame));
  // 首尾速度归零；只舒缓探出过程，不增加回弹或循环摆动。
  const eased = progress * progress * (3 - 2 * progress);
  return {
    headX: motion.hidden_x * (1 - eased),
    headOpacity: frame < motion.start_frame ? 0 : 1,
    revealPhase:
      frame < motion.start_frame ? 'hidden' : frame < motion.end_frame ? 'revealing' : 'full-hold',
  };
}
const trunk =
  'M1650-560L1900-520L1935-80L2350-400L2670-50L2105 490Q2088 670 2140 805C2200 955 2370 1230 2560 1800H1480Q1570 1190 1534 1022C1510 947 1497 897 1515 818Q1526 763 1550 732Q1590 648 1560 526Q1508 378 1370 282L1022 54L1039 28L1357 170L1580 193Z';
const canopy =
  'M115-190H1633Q1651-36 1607 7Q1593 61 1550 85Q1567 133 1567 201L1561 293Q1522 310 1491 248Q1455 243 1441 213L1405 161Q1324 216 1244 108Q1162 140 1120 84L1039 28L1024 50Q1235 141 1370 279Q1474 366 1532 439Q1575 509 1573 632Q1581 729 1545 753Q1518 759 1485 750Q1470 847 1370 807Q1330 844 1290 829L1230 829Q1180 833 1163 778Q1121 812 1063 777Q1011 790 965 771Q937 762 927 729Q884 744 856 705Q808 758 758 708Q714 734 670 696Q644 732 594 700Q539 677 521 640Q481 633 490 583Q463 545 493 506Q454 510 435 468Q393 472 385 416Q351 393 339 355Q302 337 326 268Q291 248 284 221Q259 201 253 209Q191 215 211 145Q184 122 182 79Q169 46 158 0Z';
const canopyRight =
  'M1930-400H2960V1210Q2770 1260 2660 1040Q2510 1135 2440 977Q2350 1020 2323 962Q2245 1010 2202 940Q2160 988 2099 932L2055 803Q1990 817 1987 739Q1915 785 1870 726L1870 390L1920 226Q1880 70 1930-400Z';
const trunkLines =
  'M1648 46Q1706 150 1702 277C1699 441 1764 595 1760 740M1612 238L1620 328M2106 160L2242 5M2075 592L2115 716M2117 744Q2185 939 2250 1062Q2293 1150 2278 1230M1677 1220L1671 1055';
// The lip is a curve with an open left edge: the head may project outside the
// oval, but its native right cut edge and unseen torso stay inside the tree.
const lipLeft = 'M1600-400V702C1618 743 1624 801 1622 866C1620 929 1616 970 1600 996V1450';
const exposedMask = lipLeft + 'H-1600V-400Z';
const rimLine = 'M1604 716Q1642 732 1647 795Q1664 1000 1640 1005';
function face(frame) {
  // Conservative held line variants follow the source doodle; their exact
  // drawing-change frames remain approximate. No independent animation clock.
  const variants = [
    [
      'M791 409Q817 440 841 451',
      'M894 358Q895 368 911 377',
      'M885 430Q901 465 932 453Q980 462 1021 449',
    ],
    [
      'M791 409Q806 435 834 450',
      'M894 358L899 375L919 379',
      'M885 430Q901 461 933 455Q975 474 994 455Q1010 467 1021 441',
    ],
    [
      'M791 409L804 432L817 448',
      'M894 358Q889 381 911 380',
      'M885 430Q901 458 932 455Q975 462 1021 449',
    ],
  ];
  const events = [
    [1416, 0],
    [1452, 1],
    [1464, 0],
    [1476, 1],
    [1488, 2],
    [1500, 0],
    [1512, 1],
    [1524, 2],
    [1536, 0],
    [1548, 1],
    [1560, 0],
    [1572, 1],
    [1584, 1],
  ];
  const paths = variants[step(events, frame)];
  return `<g data-tree-face="held-drawing" fill="none" stroke="${data.colors.face}" stroke-width="21" stroke-linecap="round" stroke-linejoin="round">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
}
export function treeSceneState(t) {
  if (!data) throw new Error('Await tree-scene.ready before rendering');
  const frame = t * 60,
    k = Math.floor(frame + 1e-6);
  return {
    frame,
    sourceFrame: k,
    cameraX: linear(data.camera_xy, frame, 1),
    cameraY: linear(data.camera_xy, frame, 2),
    treeOpacity: clamp(linear(data.tree_opacity, frame)),
    ...peekMotion(frame),
    assetId: data.character.asset_id,
  };
}
export function treeScene(t, { background = true } = {}) {
  const state = treeSceneState(t),
    c = data.colors,
    k = state.sourceFrame;
  const def = `<defs><clipPath id="r3-tree-exposed"><path d="${exposedMask}"/></clipPath></defs>`;
  let result = background ? `<rect width="1920" height="1080" fill="${c.background}"/>` : '';
  result +=
    def +
    `<g data-scene="tree-revision3" data-source-frame="${k}" transform="translate(${state.cameraX} ${state.cameraY})" opacity="${state.treeOpacity}">`;
  result += `<path d="${canopyRight}" transform="translate(0 -150)" fill="${c.foliage}"/><path d="${trunk}" fill="${c.trunk}" stroke="${c.trunk}" stroke-width="8"/><path d="M1000-300H1850V550L1450 310L1000 50Z" fill="${c.trunk}"/><path d="${trunkLines}" fill="none" stroke="${c.bark}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="${canopy}" fill="${c.foliage}"/>${face(k)}`;
  result += `<ellipse cx="1577" cy="868" rx="38" ry="120" fill="${c.hole}"/>`;
  if (state.headOpacity) {
    const a = data.character.world_image;
    // 始终使用同一树洞前景遮挡，避免解除临时裁切时轮廓突然展开。
    result += `<g data-asset-id="${data.character.asset_id}" data-source="protagonist-brown-eri" data-motion="short-eased-tree-peek" clip-path="url(#r3-tree-exposed)"><image href="${treeAssetURL}" x="${a.x + state.headX}" y="${a.y}" width="${a.size}" height="${a.size}" preserveAspectRatio="xMidYMid meet"/></g>`;
  }
  // The front lip covers only the unseen side; redraw its bark marker on top.
  result += `<path d="${rimLine}" fill="none" stroke="${c.bark}" stroke-width="16" stroke-linecap="round"/></g>`;
  const caption = data.captions.find((e) => k >= e.start && k < e.end);
  if (caption) {
    const entry =
      caption.fade_in_end <= caption.start
        ? 1
        : clamp((t * 60 - caption.start) / (caption.fade_in_end - caption.start));
    const alpha = entry * linear(data.caption_out, t * 60);
    result += `<text data-tree-caption="${caption.text}" x="${caption.x}" y="${caption.y}" text-anchor="middle" font-family="'MV Serif',serif" font-size="${caption.size}" font-weight="900" fill="${c.text}" stroke="${c.text}" stroke-width="1.8" paint-order="stroke fill" letter-spacing="${caption.letter_spacing}" opacity="${alpha}">${caption.text}</text>`;
  }
  return result;
}

export const render = treeScene;
