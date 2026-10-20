import {
  protagonistDialogue,
  protagonistDialogueFrameCache,
} from '../characters/protagonist/light-outfit.js';
import {
  darkOutfitDialogue,
  darkDialogueFrameCache,
} from '../characters/protagonist/dark-outfit.js';
import { renderMeowLiveStage, hideMeowLiveStage } from './meow-stage.js';
const namespace = 'http://www.w3.org/2000/svg';
const ending = '<!--protagonist-dialogue:end-->';
let layers = null;
const cachedCharacters = new Map();
let activeVariant = null;

function createLayers(content) {
  const before = document.createElementNS(namespace, 'g'),
    character = document.createElementNS(namespace, 'g'),
    after = document.createElementNS(namespace, 'g');
  character.setAttribute('data-persistent-dialogue', 'true');
  content.replaceChildren(before, character, after);
  return { before, character, after };
}
function getCachedCharacter(layer, artwork, variant) {
  if (cachedCharacters.has(variant)) return cachedCharacters.get(variant);
  // 两轮人物分别保留图片节点，防止同名局部帧混用及重新加载时闪烁。
  const container = document.createElementNS(namespace, 'g'),
    group = document.createElementNS(namespace, 'g');
  container.setAttribute('data-dialogue-variant', variant);
  container.innerHTML = artwork;
  group.setAttribute('data-frame-source', 'cached-frames');
  group.innerHTML = variant === 'brown' ? darkDialogueFrameCache : protagonistDialogueFrameCache;
  container.querySelector('[data-prebaked-frame]').replaceWith(group);
  layer.appendChild(container);
  const entry = {
    container,
    character: container.firstElementChild,
    frames: new Map(
      [...group.children].map((node) => [Number(node.getAttribute('data-cached-frame')), node]),
    ),
    active: null,
  };
  cachedCharacters.set(variant, entry);
  return entry;
}
function updateCharacter(layer, artwork, state) {
  const variant = state.variant || 'white',
    cachedCharacter = getCachedCharacter(layer, artwork, variant);
  if (activeVariant !== variant) {
    cachedCharacters.get(activeVariant)?.container.setAttribute('display', 'none');
    activeVariant = variant;
  }
  layer.removeAttribute('display');
  cachedCharacter.container.removeAttribute('display');
  const { character } = cachedCharacter,
    image = cachedCharacter.frames.get(state.frame);
  if (!image) throw new Error(`缺少全身透明帧 ${state.frame}`);
  character.setAttribute('opacity', state.opacity);
  character.setAttribute('data-expression', state.expression);
  character
    .querySelector('[data-dialogue-position]')
    .setAttribute('transform', `translate(${state.x} ${state.y})`);
  if (cachedCharacter.active !== image) {
    cachedCharacter.active?.setAttribute('display', 'none');
    image.removeAttribute('display');
    cachedCharacter.active = image;
  }
  character.setAttribute('data-prebaked-frame', state.frame);
}
export function initialiseProtagonistDialogueStage(content) {
  renderProtagonistStage(content, protagonistDialogue({ frame: 333, characterOpacity: 0 }));
  renderProtagonistStage(content, darkOutfitDialogue({ frame: 324, characterOpacity: 0 }));
  layers.character.setAttribute('display', 'none');
}
export function renderProtagonistStage(content, body, options = {}) {
  const movie = /<!--protagonist-meow:(\{[^]*?\})-->/.exec(body);
  if (movie) {
    const start = movie.index + movie[0].length,
      end = body.indexOf('<!--protagonist-meow:end-->', start);
    if (!layers) layers = createLayers(content);
    const prefix = body.slice(0, movie.index);
    layers.before.innerHTML = prefix;
    layers.after.innerHTML = body.slice(end + '<!--protagonist-meow:end-->'.length);
    layers.character.removeAttribute('display');
    for (const entry of cachedCharacters.values()) entry.container.setAttribute('display', 'none');
    activeVariant = null;
    const state = {
      ...JSON.parse(movie[1]),
      introTransform: /<g transform="([^"]+)">$/.exec(prefix)?.[1],
    };
    renderMeowLiveStage(layers.character, body.slice(start, end), state);
    return;
  }
  hideMeowLiveStage();
  const match = /<!--protagonist-dialogue:(\{[^]*?\})-->/.exec(body);
  if (!match) {
    if (!layers) {
      content.innerHTML = body;
      return;
    }
    layers.before.innerHTML = body;
    layers.after.innerHTML = '';
    layers.character.setAttribute('display', 'none');
    return;
  }
  const start = match.index + match[0].length,
    end = body.indexOf(ending, start),
    state = JSON.parse(match[1]);
  if (end < 0) throw new Error('全身镜头缺少结束标记');
  if (!layers) layers = createLayers(content);
  layers.before.innerHTML = body.slice(0, match.index);
  updateCharacter(layers.character, body.slice(start, end), state);
  layers.after.innerHTML = body.slice(end + ending.length);
}
