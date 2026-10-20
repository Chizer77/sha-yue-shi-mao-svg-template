import { find } from '../ui/actions.js';
import { showGenerationOptions, showGenerationStatus } from './view.js';

export function mountGeneration(notice, { beforeBuild, getFrame }) {
  const dialog = find('generation-dialog'),
    events = new EventTarget();
  let state = { groups: [], job: null },
    selected = new Set(),
    timer = null,
    disposed = false,
    watchedJob = null,
    needsReload = false;
  function render() {
    showGenerationOptions(state, selected, (id, checked) => {
      checked ? selected.add(id) : selected.delete(id);
      render();
    });
    const { running } = showGenerationStatus(state, needsReload);
    find('start-generation').disabled = running || !selected.size;
  }
  async function refresh() {
    const response = await fetch('/api/asset-generation', { cache: 'no-store' });
    if (!response.ok) throw Error('无法读取生成状态，请重启 8767 的预览服务');
    state = await response.json();
    if (disposed) return;
    if (state.job?.status === 'running') watchedJob = state.job.id;
    if (state.job?.status === 'complete' && state.job.id === watchedJob) needsReload = true;
    render();
    events.dispatchEvent(new Event('change'));
    clearTimeout(timer);
    if (state.job?.status === 'running') timer = setTimeout(poll, 1000);
  }
  async function poll() {
    try {
      await refresh();
    } catch (error) {
      find('generation-error').textContent = error.message;
      if (!disposed) timer = setTimeout(poll, 2000);
    }
  }
  async function open(id) {
    find('generation-error').textContent = '';
    if (!dialog.open) dialog.showModal();
    try {
      await refresh();
      const pending = state.groups.filter((group) => group.missingFiles.length || group.outdated);
      const candidates = id
        ? state.groups.filter((group) => group.id === id)
        : pending.length
          ? pending
          : state.groups;
      selected = new Set(
        candidates.filter((group) => !group.missingSources.length).map((group) => group.id),
      );
      render();
    } catch (error) {
      find('generation-error').textContent = error.message;
    }
  }
  async function start() {
    beforeBuild();
    find('start-generation').disabled = true;
    find('generation-error').textContent = '';
    try {
      const response = await fetch('/api/asset-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected] }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || '无法开始生成');
      watchedJob = result.job.id;
      needsReload = false;
      await refresh();
      notice('正在生成帧素材，可关闭弹窗，任务会继续运行。');
    } catch (error) {
      find('generation-error').textContent = error.message;
      render();
    }
  }
  find('show-generation').onclick = () => open();
  find('close-generation').onclick = () => dialog.close();
  find('start-generation').onclick = start;
  find('apply-generated').onclick = () => {
    location.hash = 'frame=' + getFrame();
    location.reload();
  };
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      clearTimeout(timer);
    },
    { once: true },
  );
  const ready = refresh().catch((error) => {
    find('generation-error').textContent = error.message;
    notice(error.message);
  });
  return {
    ready,
    events,
    open,
    refresh,
    get groups() {
      return state.groups;
    },
    get running() {
      return state.job?.status === 'running';
    },
    get needsReload() {
      return needsReload;
    },
    get missing() {
      return state.groups.reduce((total, group) => total + group.missingFiles.length, 0);
    },
  };
}
