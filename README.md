# sha-yue-shi-mao-svg-template

可替换人物与道具的《人是猫》SVG 动画模板，支持阶段预览、素材替换、喵喵对轴及 SVG / MP4 导出。

**1920 × 1080 · 60 FPS · 16 个阶段**

## 启动

需要 Node.js 20.9+；生成帧素材需要 Python 3.10–3.12，视频导出需要 FFmpeg / ffprobe（加入 PATH）。

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r scripts/build-assets/requirements.txt
npm start
```

macOS / Linux 使用 `python3` 创建环境，并将 Python 路径换为 `.venv/bin/python`。

打开 **http://127.0.0.1:8767**。Windows 也可双击 `start-preview.cmd`。导出使用本机 Edge 或 Playwright Chromium；没有可用浏览器时运行 `npx playwright install chromium`。

## 使用

- **首次运行**：点击顶部“生成素材”补齐帧，完成后“应用并刷新预览”。生成帧不纳入 Git，缺帧时完整播放与导出不可用。
- **替换素材**：在右侧选择文件并替换；标有“脚本生成”的素材需替换基础图，再重新生成。保持原画布尺寸与人物位置，原文件备份在 `exports/asset-backups/`。
- **喵喵对轴**：顶部切换模式，在同一画布调整动作、口型和文字偏移，支持 A–B 循环与保存到工程。
- **播放与导出**：空格播放/暂停，方向键逐帧，Shift＋方向键移动 10 帧；顶部可导出 SVG 或视频，结果保存在 `exports/`。

素材生成在本机执行，不调用图像生成 API。文件替换与生成操作需通过 `npm start` 启动的页面使用。

## 常用命令

```bash
npm run build:assets      # 生成全部帧素材
npm run build:thumbnails  # 生成阶段缩略图（可选）
npm run render:full       # 导出完整视频
npm run format            # Prettier 格式化
npm run format:check      # 检查格式
```

## 发布版本

推送版本标签后，GitHub Actions 会将完整源码与已跟踪素材打包为 ZIP，上传到 [Releases](https://github.com/Chizer77/sha-yue-shi-mao-svg-template/releases)。

```bash
git tag v1.0.0
git push origin v1.0.0
```

也可在 Actions → Package Release → Run workflow 中填写已推送的标签，重新打包。`v1.0.0-beta.1` 等带后缀版本会标记为预发布。发行包不包含依赖和生成帧，解压后按上述步骤安装、启动并生成素材。

## 目录

```text
app/       播放器、编辑面板与样式
assets/    静态素材与生成基础图
config/    时间轴、素材清单、署名与对轴设置
src/       场景、人物和 SVG 动画逻辑
scripts/   本地服务、素材生成与导出脚本
exports/   导出结果、缩略图及素材备份
```

素材署名见 [CREDITS.txt](CREDITS.txt)，字体许可随 `assets/fonts/` 提供。
