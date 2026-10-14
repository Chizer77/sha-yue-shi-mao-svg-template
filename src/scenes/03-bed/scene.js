import {C,clamp,ease,use,rect,tx,vertical,keys,bodyTrack,motion,timeline,bedArtwork} from '../../sequences/narrative/shared.js';
export function bed(t, ctx, background=true) {
  const colorMix=clamp((t-22.916667)/.333333);
  const exitX=keys([[23.6,0],[23.7333,-160],[23.9,-760],[24.15,-1920]],t);
  let words = timeline.bed.echoes.filter(e => t >= e.time && t < e.end).map(e => tx(e.text, e.x, e.y, 169, `text-anchor="middle" fill="#3e0c62" opacity="${clamp((e.end - t) / .16)}"`)).join('');
  if (t >= timeline.bed.captions[0].time) words += `<g opacity="${ease((t - timeline.bed.captions[0].time) / .38)}">${vertical('困倦还未', 1630, 414, 117, 141) + vertical('清零', 1494, 369, 117, 141)}</g>`;
  const s=motion.bed.sigh,age=clamp((t-s.start)/(s.end-s.start));
  const sigh=t>=s.start&&t<s.end?`<g data-motion="single-source-sigh" transform="translate(${550-age*70} ${635+age*5}) scale(${.4+age*.8})" opacity="${Math.sin(age*Math.PI)*.64}"><path d="M-11 5C-37 3-32-29-10-24C4-46 31-30 24-10L44-23C32-2 15 13-11 5Z" fill="#ecdbef"/></g>`:'';
  return (background?rect(0, 0, 1920, 1080, C.purple)+rect(0,0,1920,1080,'#66b2b2',`opacity="${colorMix}"`):'')+`<g transform="translate(${exitX} 0)">`
    + (() => {
      const drift=keys([[20.75,-32],[21,0],[21.25,26],[21.5,48],[21.75,64],[22,78],[22.25,88],[22.5,96],[22.75,102],[23,106],[23.25,128],[23.5,174],[23.65,212]],t);
      const glyphs=(outlined=false)=>`<g transform="translate(${drift} 0)"><g data-bed-glyph="惺" transform="matrix(1.071428571 0 0 .961325967 74.428571429 21.149171271)">${tx('惺',-154,467,573,outlined?'fill="none" stroke="#c7b3d6" stroke-width="1.3"':'')}</g><g data-bed-glyph="忪" transform="matrix(1.046345811 0 0 .812154696 149.374331551 53.867403315)">${tx('忪',419,467,573,outlined?'fill="none" stroke="#c7b3d6" stroke-width="1.3"':'')}</g></g>`;
      // The source has two smaller, lower outline echoes (0.90 / 0.86 of the filled title).
      return `<g data-bed-headline="惺忪"><g data-bed-outline="near" transform="translate(0 112) scale(.9)" opacity=".3">${glyphs(true)}</g><g data-bed-outline="far" transform="translate(0 191) scale(.86)" opacity=".3">${glyphs(true)}</g>${glyphs()}</g>`;
    })()
    + use('n-bed')
    + bedArtwork(t,motion.bed,bodyTrack(motion.bed,t))
    + use('n-duvet')
    + sigh+words+'</g>';
}

export const render=bed;
