export function createReplacement(renderer, playback, notice) {
    const input = document.querySelector('#replacement-file'), dialog = document.querySelector('#replacement-dialog');
    const preview = document.querySelector('#replacement-preview'), error = document.querySelector('#replacement-error');
    const save = document.querySelector('#save-replacement'); let asset = null, objectURL = null, file = null, saving = false;
    function clear() { if (objectURL) URL.revokeObjectURL(objectURL); objectURL = null; preview.removeAttribute('src'); input.value = ''; file = null; }
    dialog.addEventListener('close', clear);
    document.querySelector('#cancel-replacement').onclick = () => { if (!saving) dialog.close(); };
    input.onchange = async () => {
        file = input.files[0]; if (!file) return; playback.pause(); error.textContent = ''; save.disabled = true;
        document.querySelector('#replacement-size').textContent = '正在读取图片…';
        document.querySelector('#replacement-target').textContent = asset.file;
        document.querySelector('#replacement-sharing').textContent = asset.generation ? '这是动画基础图。替换后需重新生成对应帧，预览与导出才会更新。' : asset.stages.length > 1 ? `此素材由 ${asset.stages.length} 个阶段共用，替换后会一起更新。` : '替换会保存到工程，预览和后续导出都会使用新素材。';
        dialog.showModal();
        if (file.size > 32 * 1024 * 1024) { error.textContent = '图片不能超过 32 MB'; return; }
        objectURL = URL.createObjectURL(file); preview.src = objectURL;
        try {
            await preview.decode();
            const [width, height] = asset.size || [];
            document.querySelector('#replacement-size').textContent = `新图片 ${preview.naturalWidth} × ${preview.naturalHeight}${width ? ` · 原画布 ${width} × ${height}` : ''}。建议保持人物位置、画布尺寸和透明背景一致。`;
            save.disabled = false;
        } catch { error.textContent = '无法读取图片，请选择有效的图片文件。'; }
    };
    document.querySelector('#replacement-form').onsubmit = async event => {
        event.preventDefault(); save.disabled = true; saving = true; error.textContent = '';
        try {
            const response = await fetch('/api/local/replace-asset?file=' + encodeURIComponent(asset.file), { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file });
            const result = await response.json(); if (!response.ok) throw Error(result.error || '替换失败');
            // 完整刷新清除人物节点、图片与 SVG 导出缓存，保持当前帧不变。
            sessionStorage.setItem('asset-replacement-notice', '已替换 ' + asset.label + (result.rebuild ? ' · 请重新生成“' + result.rebuild.label + '”帧素材。' : result.backup ? ' · 原文件备份：' + result.backup : ''));
            location.hash = 'frame=' + renderer.state.frame; location.reload();
        } catch (problem) { error.textContent = problem.message; notice('素材未替换：' + problem.message); save.disabled = false; }
        finally { saving = false; }
    };
    dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
    return selected => { asset = selected; input.accept = asset.file.endsWith('.svg') ? '.svg' : '.png,.jpg,.jpeg,.webp'; input.click(); };
}
