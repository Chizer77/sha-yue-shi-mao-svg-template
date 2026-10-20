import { renderDisplayFrame } from '../effects/display-frame.js';
import { meowSlotWorld } from '../scenes/08-meow-choir/characters.js';
const namespace = 'http://www.w3.org/2000/svg';
const scratch = document.createElementNS(namespace, 'g');
let cached = null;

function element(name, attributes = {}) {
  const node = document.createElementNS(namespace, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function cacheCharacters(art) {
  const characters = new Map();
  const lyrics = element('g', { 'data-meow-lyrics': 'true' });
  for (const original of [...art.querySelectorAll('image')]) {
    const name = original.getAttribute('data-meow-character');
    const group = element('g', { 'data-meow-character': name });
    const variants = new Map();
    for (const mouth of ['closed', 'open']) {
      const image = original.cloneNode(true);
      image.setAttribute('data-mouth', mouth);
      image.setAttribute(
        'href',
        original.getAttribute('href').replace(/-(closed|open)\.png$/, '-' + mouth + '.png'),
      );
      image.removeAttribute('transform');
      image.removeAttribute('data-meow-character');
      image.setAttribute('display', 'none');
      group.appendChild(image);
      variants.set(mouth, image);
    }
    original.replaceWith(group);
    characters.set(name, { group, variants, active: null });
  }
  art.querySelectorAll('[data-meow-lyric]').forEach((node) => node.remove());
  art.appendChild(lyrics);
  return { characters, lyrics };
}

function createLiveLayer(layer, time) {
  const container = element('g', { 'data-persistent-meow-live': 'true' });
  const background = element('g'),
    definitions = element('defs'),
    visible = element('g');
  const entry = element('g'),
    foreground = element('g'),
    caption = element('g');
  entry.innerHTML = renderDisplayFrame(52.3, meowSlotWorld(time));
  const artwork = cacheCharacters(entry.querySelector('[data-meow-art]'));
  visible.append(entry, foreground);
  container.append(background, definitions, visible, caption);
  layer.appendChild(container);
  return { container, background, definitions, visible, entry, foreground, caption, ...artwork };
}

function updateArtwork(viewport) {
  for (const image of viewport.querySelectorAll('[data-meow-character]')) {
    const character = cached.characters.get(image.getAttribute('data-meow-character'));
    const mouth = image.getAttribute('data-mouth'),
      variant = character.variants.get(mouth);
    character.group.setAttribute('transform', image.getAttribute('transform'));
    character.group.setAttribute('data-mouth', mouth);
    if (character.active === variant) continue;
    character.active?.setAttribute('display', 'none');
    variant.removeAttribute('display');
    character.active = variant;
  }
  cached.lyrics.innerHTML = [...viewport.querySelectorAll('[data-meow-lyric]')]
    .map((node) => node.outerHTML)
    .join('');
}

function updateScreen(viewport) {
  const outer = viewport.firstElementChild;
  const scaled = outer.tagName.toLowerCase() === 'g',
    shell = scaled ? outer : viewport;
  if (scaled) cached.entry.setAttribute('transform', outer.getAttribute('transform'));
  else cached.entry.removeAttribute('transform');
  const filter = shell.querySelector('[clip-path]').getAttribute('filter');
  const targetClip = cached.entry.querySelector('[clip-path]');
  if (filter) targetClip.setAttribute('filter', filter);
  else targetClip.removeAttribute('filter');
  cached.entry
    .querySelector('feDisplacementMap')
    .setAttribute('scale', shell.querySelector('feDisplacementMap').getAttribute('scale'));
  cached.entry
    .querySelector('path[fill="none"]')
    .setAttribute('d', shell.querySelector('path[fill="none"]').getAttribute('d'));
  updateArtwork(viewport);
}

// 口型的两张图片始终保留，只更新连续矩阵和可见性，避免重新载图造成闪烁。
export function renderMeowLiveStage(layer, artwork, state) {
  if (!cached) cached = createLiveLayer(layer, state.time);
  cached.container.removeAttribute('display');
  if (state.introTransform) cached.container.setAttribute('transform', state.introTransform);
  else cached.container.removeAttribute('transform');
  scratch.innerHTML = artwork;
  const visible = scratch.querySelector('[data-meow-visible]');
  const viewport = visible.querySelector('[data-meow-viewport]');
  cached.background.innerHTML = scratch.firstElementChild.outerHTML;
  cached.definitions.innerHTML = scratch.querySelector('#game-exit-blur').outerHTML;
  const filter = visible.getAttribute('filter');
  if (filter) cached.visible.setAttribute('filter', filter);
  else cached.visible.removeAttribute('filter');
  updateScreen(viewport);
  cached.foreground.innerHTML = [...visible.children]
    .filter((node) => node !== viewport)
    .map((node) => node.outerHTML)
    .join('');
  cached.caption.innerHTML = [...scratch.children]
    .filter(
      (node) =>
        node !== scratch.firstElementChild &&
        node.tagName.toLowerCase() !== 'defs' &&
        node !== visible,
    )
    .map((node) => node.outerHTML)
    .join('');
}

export function hideMeowLiveStage() {
  cached?.container.setAttribute('display', 'none');
}
