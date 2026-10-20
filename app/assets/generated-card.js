import { openFolder } from './folders.js';
import { groupDescription } from '../generation/view.js';

export function generatedCard(group, generation, replace, notice) {
    const card = document.createElement('article'); card.className = 'asset-card generated-card'; card.dataset.generation = group.id;
    const heading = document.createElement('div'); heading.className = 'generated-heading';
    const title = document.createElement('strong'), badge = document.createElement('span'); title.textContent = group.label; badge.className = 'generated-badge'; badge.textContent = '脚本生成'; heading.append(title, badge);
    const status = document.createElement('p'); status.className = 'generated-state'; status.textContent = groupDescription(group);
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = '替换基础图后重新生成，输出帧无需逐张替换。';
    const row = document.createElement('div'); row.className = 'generated-source';
    const image = document.createElement('img'); image.loading = 'lazy'; image.alt = group.label + '基础图';
    const select = document.createElement('select'); select.className = 'asset-file'; select.dataset.generation = group.id; select.setAttribute('aria-label', group.label + '基础图');
    for (const source of group.sources) { const option = document.createElement('option'); option.value = source.file; option.textContent = source.label; select.append(option); }
    select.onchange = () => { image.src = select.value; }; select.onchange(); row.append(image, select);
    const actions = document.createElement('div'); actions.className = 'asset-actions';
    const folder = document.createElement('button'), change = document.createElement('button'), build = document.createElement('button');
    folder.textContent = '打开基础图 ↗'; folder.onclick = () => openFolder({ asset: select.value }, notice);
    change.textContent = '替换基础图'; change.disabled = generation.running; change.onclick = () => replace({ ...group.sources.find(source => source.file === select.value), label: group.label + ' · ' + select.selectedOptions[0].textContent, stages: group.stages, generation: group.id });
    build.textContent = group.missingFiles.length ? '生成本组帧' : '重新生成'; build.className = 'generate-group'; build.disabled = generation.running || group.missingSources.length > 0; build.onclick = () => generation.open(group.id);
    actions.append(folder, change); card.append(heading, status, row, hint, actions, build); return card;
}
