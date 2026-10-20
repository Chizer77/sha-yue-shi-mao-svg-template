let current = null;

export function acquireOperation(kind) {
  if (current) {
    const error = Error(`正在${current.label}，请完成后再操作`);
    error.status = 409;
    throw error;
  }
  const labels = { generation: '生成帧素材', export: '导出视频', replacement: '保存素材' };
  const operation = { kind, label: labels[kind] };
  current = operation;
  // 同一进程内同步取得占用权，避免生成、导出和素材写入交错。
  return () => {
    if (current === operation) current = null;
  };
}
