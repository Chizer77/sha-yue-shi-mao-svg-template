export async function openFolder(target, notice) {
    try {
        const response = await fetch('/api/local/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) });
        if ([404, 405].includes(response.status)) throw Error('8767 上的预览服务未加载新接口，请重启 npm start');
        if (!response.headers.get('content-type')?.includes('application/json')) throw Error('预览服务响应异常，请确认页面由 npm start 启动');
        const result = await response.json(); if (!response.ok) throw Error(result.error || '无法打开文件夹');
        notice('已打开文件夹：' + result.directory);
    } catch (error) { notice('打开失败：' + error.message); }
}

