$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class TomatoFolderWindow {
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr window, int command);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
}
'@

function Find-FolderWindow {
    param($Shell, [string]$Directory)
    foreach ($window in $Shell.Windows()) {
        try {
            $openedDirectory = $window.Document.Folder.Self.Path
            if ([string]::Equals($openedDirectory.TrimEnd('\'), $Directory.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) {
                return $window
            }
        } catch {
            # 窗口可能正被关闭，继续寻找同目录的其他窗口。
        }
    }
    return $null
}

function Wait-FolderWindow {
    param($Shell, [string]$Directory)
    $deadline = [DateTime]::UtcNow.AddSeconds(8)
    do {
        $window = Find-FolderWindow -Shell $Shell -Directory $Directory
        if ($null -ne $window) { return $window }
        Start-Sleep -Milliseconds 100
    } while ([DateTime]::UtcNow -lt $deadline)
    throw '资源管理器没有创建目标文件夹窗口。'
}

function Show-FolderWindow {
    param($Window)
    $handle = [IntPtr]([long]$Window.HWND)
    # 后台服务启动的窗口可能继承隐藏状态，必须恢复实际窗口而非只启动进程。
    $Window.Visible = $true
    [void][TomatoFolderWindow]::ShowWindowAsync($handle, 9)
    $deadline = [DateTime]::UtcNow.AddSeconds(2)
    while (-not [TomatoFolderWindow]::IsWindowVisible($handle)) {
        if ([DateTime]::UtcNow -ge $deadline) { throw '目标文件夹窗口仍处于隐藏状态。' }
        Start-Sleep -Milliseconds 50
    }
    [void][TomatoFolderWindow]::SetForegroundWindow($handle)
}

$shell = $null
$window = $null
try {
    $directory = (Get-Item -LiteralPath $env:TOMATO_OPEN_FOLDER -Force).FullName
    $shell = New-Object -ComObject Shell.Application
    $window = Find-FolderWindow -Shell $shell -Directory $directory
    if ($null -eq $window) {
        # 优先复用窗口，避免连续点击不断生成后台资源管理器进程。
        $shell.Explore($directory)
        $window = Wait-FolderWindow -Shell $shell -Directory $directory
    }
    Show-FolderWindow -Window $window
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
} finally {
    if ($null -ne $window) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($window) }
    if ($null -ne $shell) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($shell) }
}
