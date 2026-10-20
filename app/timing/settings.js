import { timingValuesFromRecord } from '../../src/scenes/08-meow-choir/timing.js';
import { find, handleAction } from '../ui/actions.js';

async function saveTiming(timing, notice) {
  const button = find('save-timing');
  button.disabled = true;
  try {
    const response = await fetch('/api/meow-timing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timing.get()),
    });
    const result = await response.json();
    if (!response.ok || !result.saved) throw Error(result.error || '保存失败');
    try {
      timing.save();
      notice('已保存到工程，预览和视频导出将使用同一份对轴参数。');
    } catch {
      notice('已保存到工程；浏览器本机记录无法更新，重新载入即可使用工程参数。');
    }
  } finally {
    button.disabled = false;
  }
}

function exportTiming(timing, notice) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(timing.exportSettings(), null, 2) + '\n'], {
      type: 'application/json;charset=utf-8',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'choir-timing.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice('已导出对轴参数。');
}

export function mountTimingSettings(timing, refresh, notice) {
  find('save-timing').onclick = handleAction(notice, () => saveTiming(timing, notice));
  find('export-timing').onclick = () => exportTiming(timing, notice);
  find('reset-timing').onclick = handleAction(notice, async () => {
    const response = await fetch('config/meow-adjustments.json', { cache: 'no-store' });
    if (!response.ok) throw Error('无法读取工程参数');
    timing.set(timingValuesFromRecord(await response.json()));
    refresh();
    notice('已恢复工程当前保存的对轴参数。');
  });
  find('import-timing').onclick = () => find('timing-file').click();
  find('timing-file').onchange = handleAction(notice, async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      timing.set({
        ...timing.defaults(),
        ...timingValuesFromRecord(JSON.parse(await file.text())),
      });
      refresh();
      notice('已导入并应用，点击“保存到工程”后用于视频导出。');
    } finally {
      event.target.value = '';
    }
  });
}
