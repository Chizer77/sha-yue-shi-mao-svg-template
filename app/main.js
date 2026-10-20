import { createStage } from '../src/core/stage.js';
import { createPlayback } from './player/controller.js';
import { exposeAnimation } from './player/bridge.js';
import { mountNavigation } from './player/navigation.js';
import { mountPlaybackControls, enablePlaybackControls } from './player/controls.js';
import { mountExport } from './export/panel.js';
import { mountAssets } from './assets/panel.js';
import { mountTimingPanel } from './timing/panel.js';
import { find, mountInspector } from './ui/actions.js';
import { mountGeneration } from './generation/panel.js';

const notice = (message) => {
  find('status').textContent = message;
  find('status').title = message;
};
const replacementNotice = sessionStorage.getItem('asset-replacement-notice');
sessionStorage.removeItem('asset-replacement-notice');
let renderer = null,
  playback = null,
  resourcesReady = false;
// 生成入口独立于图片解码，首次克隆缺帧时也能使用。
const generation = mountGeneration(notice, {
  beforeBuild: () => playback?.pause(),
  getFrame: () => renderer?.state?.frame ?? 0,
});
renderer = createStage(find('stage'));
playback = createPlayback(renderer, find('soundtrack'));
const api = exposeAnimation(renderer, playback),
  query = new URLSearchParams(location.search);
renderer.ready.catch(() => { });

function showAvailability() {
  const blocked =
    !resourcesReady || generation.running || generation.missing > 0 || generation.needsReload;
  enablePlaybackControls(!blocked);
  find('preview-placeholder').hidden = !blocked;
  find('resolve-assets').hidden =
    !generation.missing && !generation.running && !generation.needsReload;
  find('preview-placeholder-text').textContent = generation.running
    ? '正在生成帧素材，完成后刷新预览。'
    : generation.needsReload
      ? '素材已生成，点击“生成素材”应用并刷新预览。'
      : generation.missing
        ? `缺少 ${generation.missing} 张生成帧，请先生成素材。`
        : '正在准备预览素材…';
  if (generation.running || generation.needsReload || generation.missing)
    notice(find('preview-placeholder-text').textContent);
  return !blocked;
}
generation.events.addEventListener('change', showAvailability);
find('resolve-assets').onclick = () => generation.open();

async function initialize() {
  const frame = Number(new URLSearchParams(location.hash.slice(1)).get('frame') || 0);
  renderer.renderFrame(frame);
  const timing = mountTimingPanel(renderer, playback, api.meowTiming, notice);
  const navigation = mountNavigation(renderer.project, playback, renderer, () =>
    timing.exit(false),
  );
  mountPlaybackControls(renderer, playback, navigation, timing, notice);
  mountInspector();
  mountExport(renderer, notice);
  await generation.ready;
  await mountAssets(renderer, playback, notice, generation);
  await renderer.ready;
  resourcesReady = true;
  playback.seek(frame / renderer.project.fps);
  if (showAvailability()) notice(replacementNotice || '已就绪 · 空格播放 / 暂停');
  if (query.get('mode') === 'timing') timing.enter();
  if (query.get('download') === 'svg') find('download-svg').click();
}

initialize().catch((error) => {
  showAvailability();
  notice(
    generation.missing
      ? `缺少 ${generation.missing} 张生成帧，点击顶部“生成素材”即可补齐。`
      : '载入失败：' + error.message,
  );
  if (!generation.missing) {
    find('preview-placeholder-text').textContent = '素材载入失败，请检查文件是否完整。';
    console.error(error);
  }
});
window.addEventListener('pagehide', () => playback.dispose(), { once: true });
