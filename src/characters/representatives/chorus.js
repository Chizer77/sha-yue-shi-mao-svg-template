import { renderTomatoOutline } from '../../sequences/lab/panels.js';
/* Explicitly authorized manual SVG redraw of the source supporting cast.
 * Reference: source 111.70 / 111.90 / 112.10 seconds, inspected at full resolution.
 * Every shape below is an editable hand-traced path, not a reference-frame image.
 * localFrame = absolute output frame - 6322. This function owns its entry/exit.
 * Draw before the main character and 本当に foreground text. Do not add another
 * generic interlude entrance opacity/translate wrapper around this result.
 */
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};
function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (t <= keys[i][0]) {
      const [a, x] = keys[i - 1],
        [b, y] = keys[i];
      return x + (y - x) * smooth((t - a) / (b - a));
    }
  return keys.at(-1)[1];
}
const P = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const colors = {
  skin: '#fad7c4',
  cheek: '#eec3ae',
  hair: '#9ba8ae',
  brow: '#7c8787',
  coat: '#ebf1f5',
  cuff: '#a1aaad',
  shirt: '#737d84',
  trouser: '#313539',
  suit: '#171f2f',
  suitHair: '#b89582',
  tie: '#4a5881',
  mouth: '#b07668',
};
function doctor() {
  const c = colors;
  return (
    `<g data-redraw-role="doctor">` +
    // Trousers and the two separately shaped low shoes.
    P(
      'M548 742L548 804C559 847 566 893 573 957Q571 970 584 983L587 998Q590 1007 607 1007L658 1007Q662 995 654 986L640 976Q648 947 650 918L662 831L674 905L677 968Q677 979 692 984L689 998Q690 1006 708 1008L765 1009Q765 996 757 987L741 974Q748 962 746 942L752 742Z',
      c.trouser,
    ) +
    // Grey shirt remains behind the coat openings.
    P('M625 504L744 515L759 750C730 775 664 779 613 755Z', c.shirt) +
    // Left and right coat skirts, preserving the asymmetrical opening.
    P(
      'M625 492C595 501 574 522 558 553C541 587 534 639 531 689C528 729 529 790 532 821C551 832 586 840 617 844C619 811 631 779 639 747C653 691 665 611 668 531Z',
      c.coat,
    ) +
    P(
      'M720 532C723 565 716 626 711 672C705 725 697 776 698 824Q696 840 706 841C739 841 769 830 783 814L784 747C799 716 810 684 809 652C809 610 797 556 774 521Z',
      c.coat,
    ) +
    // Sleeve fold/cuff shapes are under both fists and the rod.
    P(
      'M565 681C589 693 621 677 639 650C650 633 661 612 657 595C645 584 627 589 620 604C608 627 606 643 617 654C604 671 587 681 570 678Z',
      '#dce3e7',
    ) +
    P('M628 582C610 599 607 624 615 641Q621 654 633 650C644 643 650 620 653 599Z', c.cuff) +
    P('M757 660C742 668 735 688 737 710Q741 732 753 724C762 712 770 693 770 678Z', c.cuff) +
    P('M751 721Q766 739 786 742L782 749Q759 746 746 730Z', '#dce3e7') +
    // A single diagonal teaser rod, string, bead and hanging user-supplied ornament silhouette.
    P('M570 526L784 674', 'none', 'stroke="#333c3d" stroke-width="5.2" stroke-linecap="round"') +
    P('M570 527L568 656', 'none', 'stroke="#8a9189" stroke-width="1.8"') +
    `<circle cx="568" cy="654" r="3" fill="#c2b47d"/><circle cx="570" cy="660" r="2.2" fill="#c2b47d"/>` +
    renderTomatoOutline('doctor') +
    // Both peach fists cover the rod and sleeve openings, as in the source.
    P(
      'M628 579C637 574 652 574 662 580C676 591 673 608 663 619C654 628 640 629 629 621C616 613 613 597 620 587Z',
      c.skin,
    ) +
    P(
      'M738 652C750 646 765 650 772 661C778 672 774 687 765 695C754 703 739 699 731 690C721 679 725 661 738 652Z',
      c.skin,
    ) +
    // Bald head with the domed forehead and broad lower cheek silhouette.
    P(
      'M620 437C613 410 627 380 651 359C672 342 697 335 716 340C750 345 776 365 789 391C803 418 803 455 796 484C790 510 773 528 747 535C721 541 688 540 663 533C638 526 621 510 620 486Z',
      c.skin,
    ) +
    // The source uses a large warm brow/eye-plane patch, not extra drawn eyes.
    P(
      'M644 455C650 435 672 422 696 422C723 421 748 434 761 455Q772 473 751 482C727 491 687 491 660 482Q640 476 644 455Z',
      c.cheek,
    ) +
    // The asymmetric two grey side hair masses.
    P(
      'M643 362C632 361 623 370 614 371C602 373 591 383 586 393C580 405 585 414 587 424C585 433 591 448 599 454Q611 462 618 451C625 440 630 428 634 415L645 394C650 391 653 383 655 378Q657 365 643 362Z',
      c.hair,
    ) +
    P(
      'M793 384C783 383 777 391 780 400L784 410C775 422 780 432 777 443C775 456 780 469 790 475C800 482 817 478 822 465C829 451 821 437 817 426C813 419 814 407 809 398Q808 385 793 384Z',
      c.hair,
    ) +
    // Small tilted brows, thin round glasses, nose, and the worried open mouth.
    P('M680 399Q688 392 694 402Q695 406 687 406L679 406Z', c.brow) +
    P('M739 418Q746 420 751 428Q753 434 748 433Q740 428 737 423Z', c.brow) +
    P(
      'M644 470C646 455 661 448 674 453C689 457 695 468 691 480C687 493 674 497 660 492C648 489 642 481 644 470ZM722 479C726 465 742 459 755 465C767 470 771 482 766 493C760 505 746 507 734 501C725 497 719 490 722 479Z',
      'none',
      'stroke="#7f8b87" stroke-width="2.6"',
    ) +
    P(
      'M700 478Q706 471 714 480',
      'none',
      'stroke="#7f8b87" stroke-width="2.4" stroke-linecap="round"',
    ) +
    P(
      'M675 503C684 496 698 492 708 497C717 501 722 510 718 517Q716 520 710 516C700 512 691 511 681 516C674 519 669 511 675 503Z',
      c.mouth,
    ) +
    '</g>'
  );
}
function suitedMan() {
  const c = colors;
  return (
    `<g data-redraw-role="suited-explainer">` +
    // Palm is behind the cuff. Its silhouette is deliberately flat, without
    // invented finger detail absent from the actual reference.
    P(
      'M1037 500C1021 492 1006 488 991 490C978 490 968 496 970 504C971 513 986 517 1005 518L1025 523Z',
      c.skin,
    ) +
    P('M1294 678L1331 679Q1335 699 1323 709Q1301 718 1294 698Z', c.skin) +
    // Full jacket, bent left sleeve, straight right sleeve, trousers and shoes.
    P(
      'M1176 422C1164 434 1148 436 1132 443C1121 448 1115 463 1108 478L1086 526L1040 500Q1033 497 1027 500L1005 532Q1000 539 1010 548C1034 568 1060 582 1087 594Q1113 606 1128 585L1129 704Q1130 712 1142 715L1137 945Q1128 961 1135 970L1102 979L1099 1004Q1139 1010 1189 1006Q1207 1005 1208 990L1219 828L1237 929L1242 976L1232 985L1233 1006L1304 1007Q1323 1006 1323 997L1325 978Q1332 970 1328 946L1311 847L1294 707Q1299 701 1299 693C1316 696 1334 691 1340 685C1343 672 1337 640 1335 619L1329 500C1327 477 1321 451 1308 446L1250 425L1243 414Z',
      c.suit,
    ) +
    // White collar and simple slate-blue tie overlap the jacket.
    P('M1175 416Q1208 424 1247 415L1231 485L1197 542L1182 484Z', '#eef4f6') +
    P('M1198 433L1207 442L1203 451L1214 498L1198 542L1185 506L1192 452L1189 443Z', c.tie) +
    // Face: the uninterrupted fringe hides the eye plane, exactly as provided
    // by the source; no additional eyes have been invented.
    P(
      'M1103 342C1100 356 1107 372 1126 389C1146 411 1174 423 1201 429C1228 429 1252 416 1270 395C1287 380 1305 366 1307 349L1293 326Z',
      c.skin,
    ) +
    P(
      'M1106 336C1104 301 1117 263 1144 241C1163 225 1187 223 1206 226C1240 225 1263 241 1278 265C1298 291 1303 320 1305 344L1308 351C1265 348 1221 347 1182 347Q1137 351 1102 367Q1097 356 1106 336Z',
      c.suitHair,
    ) +
    `<ellipse cx="1199" cy="389" rx="12.8" ry="11.5" fill="${c.mouth}"/>` +
    '</g>'
  );
}
function questionMarks() {
  return (
    `<g data-redraw-role="doctor-confusion" fill="none" stroke="#ef8a25" stroke-linecap="round" stroke-linejoin="round">` +
    P(
      'M482 331C468 325 478 304 492 301C510 296 523 307 522 321C522 334 512 335 511 345L510 357',
      'none',
      'stroke-width="7.5"',
    ) +
    `<circle cx="509" cy="384" r="4.5" fill="#ef8a25" stroke="none"/>` +
    P('M542 338Q553 328 563 340Q570 351 555 357L550 370', 'none', 'stroke-width="6.4"') +
    `<circle cx="538" cy="401" r="4" fill="#ef8a25" stroke="none"/></g>`
  );
}
function bubble(frame) {
  const y = track(
      [
        [365, 160],
        [379, 82],
        [390, 0],
        [400, -3],
        [425, -7],
        [442, -12],
      ],
      frame,
    ),
    a = track(
      [
        [365, 0],
        [380, 0.35],
        [392, 0.75],
        [401, 1],
        [444, 1],
      ],
      frame,
    );
  if (a <= 0) return '';
  let shapes = P(
    'M675 166C690 111 745 78 805 79C872 73 928 103 952 151C968 181 970 211 957 232L1000 256L946 256C927 283 897 304 851 312C794 322 738 300 703 269C675 244 660 205 675 166Z',
    '#fffdf6',
  );
  if (frame >= 372)
    shapes += P(
      'M752 171L732 214H776Z',
      'none',
      'stroke="#6f716e" stroke-width="7" stroke-linejoin="round"',
    );
  if (frame >= 400)
    shapes += `<g stroke="#6f716e" fill="#6f716e"><circle cx="819" cy="175" r="5.8" stroke="none"/><circle cx="809" cy="188" r="3.5" fill="none" stroke-width="1.6"/><circle cx="829" cy="188" r="3.5" fill="none" stroke-width="1.6"/><path d="M819 185V214" stroke-width="2.5"/><path d="M799 201H813V214H799Z" fill="none" stroke-width="2.8"/><circle cx="833" cy="209" r="6.3" stroke="none"/></g>`;
  if (frame >= 412)
    shapes +=
      P(
        'M884 182C873 174 858 181 858 195C858 211 875 221 888 215C904 209 906 188 891 181M887 188C879 182 866 188 867 199C868 208 880 211 886 205C892 200 887 191 880 192C875 193 876 201 881 200',
        'none',
        'stroke="#747671" stroke-width="2.3" stroke-linecap="round"',
      ) +
      P(
        'M899 181L900 184M903 187L904 190M905 194L905 197M905 201L905 204M903 208L902 211',
        'none',
        'stroke="#747671" stroke-width="1.8"',
      );
  return `<g data-redraw-role="explanation-bubble" transform="translate(0 ${y})" opacity="${a}">${shapes}</g>`;
}

/** f is the third-chorus local frame, typically 342..443. */
export function supportingCast(localFrame) {
  const f = Number(localFrame);
  if (!Number.isFinite(f) || f < 344 || f >= 444) return '';
  const y = track(
    [
      [344, 420],
      [350, 382],
      [356, 300],
      [362, 145],
      [370, 18],
      [378, -3],
      [388, 0],
      [402, -2],
      [421, 0],
      [437, 9],
      [444, 18],
    ],
    f,
  );
  const a = clamp((f - 346) / 29) * (1 - clamp((f - 427) / 17));
  const q = smooth((f - 382) / 20);
  const body = doctor() + suitedMan();
  return `<g data-art-source="authorized-manual-svg-redraw" data-scene="source-supporting-cast" data-local-frame="${f}">${bubble(f)}<g opacity="${a}" transform="translate(0 ${y})">${body}</g><g opacity="${q * (1 - clamp((f - 427) / 17))}">${questionMarks()}</g></g>`;
}
export const supportingCastMetadata = {
  sourceFrames: [6702, 6714, 6726],
  sourceTimes: [111.7, 111.9, 112.1],
  coordinateSystem: [1920, 1080],
  localFrameOffset: 6322,
  artSource: 'manual SVG shape tracing following explicit user redraw authorization',
  rasterReferencesUsedInOutput: false,
  mainCharacterIncluded: false,
  entryExitOwnedByModule: true,
  knownDifferences: [
    'Hand-traced edge curvature and small facial details approximate the compressed reference.',
    'Entry, bubble and question timing are sampled from inspected dense/high-resolution evidence; continuous curves remain approximate.',
  ],
};
