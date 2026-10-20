export const formatTime = (time) =>
  `${String(Math.floor(time / 60)).padStart(2, '0')}:${(time % 60).toFixed(3).padStart(6, '0')}`;
export function mountNavigation(project, playback, renderer, beforeSelect = () => { }) {
  const list = document.querySelector('#stage-list'),
    buttons = new Map();
  const select = document.querySelector('#stage-select');
  const choose = (unit) => {
    beforeSelect();
    playback.seek(unit.start);
  };
  for (const unit of project.units) {
    const button = document.createElement('button');
    button.className = 'stage-item';
    button.dataset.stage = unit.id;
    const image = document.createElement('img');
    image.className = 'stage-thumb';
    image.alt = '';
    image.loading = 'lazy';
    image.src = `exports/thumbnails/stage-${String(unit.id).padStart(2, '0')}.jpg`;
    image.onerror = () => {
      image.hidden = true;
      button.classList.add('thumbnail-missing');
    };
    const details = document.createElement('span'),
      title = document.createElement('span'),
      meta = document.createElement('span');
    title.className = 'stage-title';
    title.textContent = String(unit.id).padStart(2, '0') + ' · ' + unit.name;
    meta.className = 'stage-meta';
    meta.textContent = formatTime(unit.start) + ' · ' + (unit.end - unit.start).toFixed(1) + '秒';
    details.append(title, meta);
    button.append(image, details);
    button.onclick = () => choose(unit);
    list.append(button);
    buttons.set(unit.id, button);
    const option = document.createElement('option');
    option.value = unit.id;
    option.textContent = String(unit.id).padStart(2, '0') + ' · ' + unit.name;
    select.append(option);
  }
  select.onchange = () => choose(project.units.find((unit) => unit.id === Number(select.value)));
  let selected = null;
  function showUnit(unit) {
    if (selected === unit.id) return;
    buttons.get(selected)?.removeAttribute('aria-current');
    buttons.get(unit.id).setAttribute('aria-current', 'true');
    selected = unit.id;
    // 只滚动阶段列表，避免切段时带动整个页面。
    const button = buttons.get(unit.id),
      itemBounds = button.getBoundingClientRect(),
      listBounds = list.getBoundingClientRect();
    if (itemBounds.top < listBounds.top) list.scrollTop += itemBounds.top - listBounds.top;
    else if (itemBounds.bottom > listBounds.bottom)
      list.scrollTop += itemBounds.bottom - listBounds.bottom;
    select.value = unit.id;
    document.querySelector('#scene-number').textContent =
      'STAGE ' + String(unit.id).padStart(2, '0');
    document.querySelector('#scene-name').textContent = unit.name;
  }
  renderer.events.addEventListener('frame', (event) => showUnit(event.detail.unit));
  // 缺帧时资源预载不会完成，仍需展示已经确定的当前阶段。
  if (renderer.state) showUnit(renderer.state.unit);
  return {
    jump(delta) {
      const unit = renderer.state.unit,
        index = project.units.indexOf(unit);
      choose(project.units[Math.max(0, Math.min(project.units.length - 1, index + delta))]);
    },
  };
}
