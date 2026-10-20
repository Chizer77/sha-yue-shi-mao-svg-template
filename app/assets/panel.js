import { openFolder } from './folders.js';
import { createReplacement } from './replacement.js';
import { generatedCard } from './generated-card.js';

export async function mountAssets(renderer, playback, notice, generation) {
    const inventory = await fetch('config/media.json').then(response => response.json());
    const list = document.querySelector('#asset-list');
    const replace = createReplacement(renderer, playback, notice); let active = null;
    function show(unit, force = false) {
        if (active === unit.id && !force) return; const scroll = force ? list.scrollTop : 0; active = unit.id;
        const grouped = new Map();
        for (const asset of inventory.assets.filter(asset => asset.stages.includes(unit.id))) {
            if (!grouped.has(asset.group)) grouped.set(asset.group, []); grouped.get(asset.group).push(asset);
        }
        const selections = new Map([...list.querySelectorAll('select[data-generation]')].map(select => [select.dataset.generation, select.value]));
        const cards = [...grouped.values()].map(assets => {
            const group = generation.groups.find(group => group.directory === assets[0].group);
            return group ? generatedCard(group, generation, replace, notice) : assetCard(assets, replace, notice);
        });
        list.replaceChildren(...cards);
        for (const select of list.querySelectorAll('select[data-generation]')) { if (selections.has(select.dataset.generation)) { select.value = selections.get(select.dataset.generation); select.onchange(); } }
        list.scrollTop = scroll; document.querySelector('#asset-empty').hidden = cards.length > 0;
        document.querySelector('#asset-count').textContent = `${cards.length} 组素材`;
        document.querySelector('#scene-code').onclick = () => openFolder({ stage: unit.id }, notice);
    }
    renderer.events.addEventListener('frame', event => show(event.detail.unit));
    if (renderer.state) show(renderer.state.unit);
    generation.events.addEventListener('change', () => { if (renderer.state) show(renderer.state.unit, true); });
}
function assetCard(assets, replace, notice) {
    let selected = assets[0];
    const card = document.createElement('article'); card.className = 'asset-card';
    const row = document.createElement('div'); row.className = 'asset-summary';
    const image = document.createElement('img');
    image.src = selected.file; image.alt = selected.label; image.loading = 'lazy';
    const info = document.createElement('div'), title = document.createElement('strong'), subtitle = document.createElement('span');
    title.textContent = selected.label; title.title = selected.label; subtitle.textContent = assets.length > 1 ? `${assets.length} 张差分 / 动画帧` : selected.category;
    info.append(title, subtitle); row.append(image, info); card.append(row);
    const file = document.createElement('select'); file.className = 'asset-file'; file.setAttribute('aria-label', selected.label + '：选择素材文件');
    for (const asset of assets) { const option = document.createElement('option'); option.value = asset.file; option.textContent = asset.file.split('/').at(-1); file.append(option); }
    file.title = selected.file; file.onchange = () => { selected = assets.find(asset => asset.file === file.value); image.src = selected.file; file.title = selected.file; }; card.append(file);
    const actions = document.createElement('div'); actions.className = 'asset-actions';
    const open = document.createElement('button'), change = document.createElement('button');
    open.textContent = '打开素材 ↗'; open.title = '打开所选素材所在的文件夹'; open.onclick = () => openFolder({ asset: selected.file }, notice);
    change.textContent = '替换素材'; change.onclick = () => replace(selected); actions.append(open, change); card.append(actions); return card;
}
