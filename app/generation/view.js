import { find } from '../ui/actions.js';

export function groupDescription(group) {
  if (group.missingSources.length)
    return `基础图缺失 ${group.missingSources.length} 张，请先恢复基础图`;
  if (group.missingFiles.length) return `缺失 ${group.missingFiles.length} / ${group.total} 帧`;
  return group.outdated ? `基础图已更新 · ${group.total} 帧待重建` : `已就绪 · ${group.total} 帧`;
}

export function showGenerationOptions(state, selected, onSelect) {
  const list = find('generation-options');
  list.replaceChildren();
  for (const group of state.groups) {
    const label = document.createElement('label');
    label.className = 'generation-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = group.id;
    checkbox.checked = selected.has(group.id);
    checkbox.disabled = state.job?.status === 'running' || group.missingSources.length > 0;
    checkbox.onchange = () => onSelect(group.id, checkbox.checked);
    const text = document.createElement('span'),
      title = document.createElement('strong'),
      description = document.createElement('small');
    title.textContent = group.label;
    description.textContent = groupDescription(group);
    text.append(title, description);
    label.append(checkbox, text);
    list.append(label);
  }
}

export function showGenerationStatus(state, needsReload) {
  const job = state.job,
    running = job?.status === 'running';
  const missing = state.groups.reduce((count, group) => count + group.missingFiles.length, 0);
  const outdated = state.groups.some((group) => group.outdated),
    badge = find('generation-badge');
  badge.hidden = !missing && !outdated && !running;
  badge.textContent = running ? '生成中' : missing ? String(missing) : '待更新';
  find('generation-summary').textContent = missing
    ? `缺少 ${missing} 张生成帧。选择对应组，生成后即可完整预览。`
    : '生成帧不会提交到 Git；修改基础图后，可在这里重新生成。';
  find('generation-job').hidden = !job;
  if (job) {
    find('generation-job-title').textContent = running
      ? `正在生成：${job.label}`
      : job.status === 'complete'
        ? '素材生成完成'
        : job.status === 'interrupted'
          ? '生成任务已中断'
          : '素材生成失败';
    const frames = job.completedFrames + (job.currentFrames || 0);
    find('generation-job-detail').textContent =
      job.error || `生成进度 ${frames} / ${job.totalFrames} 帧`;
    find('generation-progress').max = job.totalFrames || 1;
    find('generation-progress').value = frames;
    find('generation-log').textContent = job.log || '等待生成任务输出…';
  }
  find('apply-generated').hidden = !needsReload || running;
  return { missing, running };
}
