# sha-yue-shi-mao-svg-template

一个可替换人物与道具的《人是猫》SVG 动画模板。包含 16 个视频阶段、实时预览、帧素材生成、独立 SVG 导出和带音轨的 MP4 导出。

**1920 × 1080 · 60 FPS · 7967 帧**

## 功能

- 按阶段浏览、跳转、循环和调节播放速度。
- 空格播放/暂停，方向键逐帧，Shift＋方向键移动 10 帧。
- 查看当前阶段的素材，生成各阶段的画面总览。
- 调节合唱动作、口型和文字偏移，预览与导出共用配置。
- 从基础表情图重建对话动画和嘴眼过渡帧。
- 导出全片、指定帧区间、PNG 帧或内嵌图片与字体的 SVG。

素材重建是本地的形变、采样与插帧，不调用图像生成 API。

## 环境要求

| 工具 | 要求 | 用途 |
| --- | --- | --- |
| Node.js | 20.9 或更高，推荐 22/24 | 预览、浅色对话帧、导出 |
| Python | 3.10–3.12，推荐 3.12 | 深色对话帧、表情插帧 |
| FFmpeg / ffprobe | 加入 PATH | 视频编码与音轨合成 |
| Chromium 或 Edge | Playwright Chromium，或 Windows 本机 Edge | 总览、PNG 帧和视频导出 |

Node 依赖由 `package-lock.json` 锁定；Python 依赖见 `scripts/build-assets/requirements.txt`。

## 快速开始

克隆或下载代码后，在项目根目录执行。

### Windows / PowerShell

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r scripts/build-assets/requirements.txt
npm run build:assets
```

### macOS / Linux

```bash
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/build-assets/requirements.txt
npm run build:assets
```

如未安装可用浏览器，先运行：

```bash
npx playwright install chromium
```

Windows 已安装 Edge 时可跳过这一步，导出器会自动选择可用浏览器。

生成总览并启动预览：

```bash
npm run overview
npm start
```

打开 **http://127.0.0.1:8767**。完成首次依赖安装和素材构建后，Windows 也可以双击根目录的 `启动预览.cmd`。

> 生成的 PNG 序列不纳入 Git。首次获取代码后需要执行 `npm run build:assets`，再打开完整预览。

## 重新生成帧素材

```bash
# 重建全部 256 张生成帧
npm run build:assets

# 或分别重建
npm run build:dialogue:light
npm run build:dialogue:dark
npm run build:expressions
```

| 内容 | 基础图目录 | 当前输出 |
| --- | --- | --- |
| 浅色服装对话 | `assets/characters/protagonist-light/dialogue/input/` | 119 张 `frame-*.png` |
| 深色服装对话 | `assets/characters/protagonist-dark/dialogue/input/` | 120 张 `frame-*.png` |
| 嘴眼同步过渡 | `assets/characters/protagonist-dark/expressions/input/` | 17 张 `reaction-*.png` |

两套对话各使用三张已经对齐的基础图：

- `open.png`：正常睁眼、张嘴。
- `closed-mouth.png`：闭嘴表情。
- `closed-eyes.png`：闭眼表情。

表情过渡使用 `start.png` 和 `end.png` 两张完整立绘。裁切区域由 `src/characters/protagonist/expressions.json` 的 `patchBox` 指定，眼口局部区域由 `expression-generation.json` 配置。

基础对话图使用 **1024 × 1536** 画布。替换图片时保持人物位置与画布一致；改变脸部位置或画风时，相应调整裁切区域和眼口分割规则。生成脚本不会重新绘制或自动对齐角色。

浅色对话复用播放器的位移滤镜；深色对话读取项目内的完整位移场。基础图、时间轴、位移数据和脚本均在本仓库内，生成不依赖旧工程或归档目录。

Python 启动器优先使用项目的 `.venv`。如需使用其他解释器，可通过 `PYTHON` 环境变量指定。

## 预览与导出

页面右上角的“导出视频”支持完整视频、当前阶段和自定义帧区间，并显示进度及下载链接。

命令行也可直接运行：

```bash
# 完整视频
npm run render:full

# 指定区间，包含开始帧、不包含结束帧
node scripts/export/video.mjs --start=3078 --end=3950 --out=exports/video/choir.mp4

# PNG + 可独立打开的 SVG
node scripts/export/frames.mjs --frames=120,3240 --embed

# 更新画面总览
npm run overview
```

不加 `--embed` 时，导出的 SVG 使用工程内相对资源路径。所有导出结果存放在 `exports/`，不纳入 Git。

可选环境变量：

| 变量 | 用途 |
| --- | --- |
| `PORT` | 预览端口，默认 `8767` |
| `SVG_BROWSER` | 指定 Playwright 浏览器通道，例如 `msedge` |
| `FFMPEG_PATH` / `FFPROBE_PATH` | 指定视频工具位置 |
| `PYTHON` | 指定帧生成使用的 Python 解释器 |

## 项目结构

```text
app/                         播放器、总览、素材面板和快捷键
assets/                      静态素材及生成脚本的基础图
  characters/
    protagonist-light/
      dialogue/input/        浅色对话基础图（提交）
      dialogue/frame-*.png   生成帧（忽略）
    protagonist-dark/
      dialogue/input/        深色对话基础图（提交）
      dialogue/frame-*.png   生成帧（忽略）
      expressions/input/     起止表情图（提交）
      expressions/reaction-*.png  过渡帧（忽略）
config/                      时间轴、运行素材表、署名和对轴设置
src/
  core/                      SVG 舞台、资源加载和 SVG 导出
  composition/               全片编排与跨阶段转场
  scenes/                    各阶段的画面和运动
  sequences/                 共用副歌、房间和场景组件
  characters/                人物播放逻辑、位移场和表情参数
scripts/
  build-assets/              独立帧生成脚本及 Python 依赖
  build-previews/            总览生成
  dev/                       本地服务与导出任务
  export/                    SVG、PNG 和视频导出
exports/                     本地生成的导出结果（忽略）
```

三轮副歌复用同一份代码，各轮时间偏移配置在 `config/composition.json`。修改署名编辑 `config/credits.json`；合唱偏移保存于 `config/meow-adjustments.json`。

## 素材与版本管理

Git 跟踪基础图、静态图片、脚本、时间轴和位移参数；忽略可重新生成的对话帧、表情帧、总览、视频、依赖目录及缓存。

- 修改基础表情图后，重建对应帧，再运行 `npm run overview`。
- 替换普通静态图片可保持原文件名；新增或改名时，同步修改场景引用和 `config/media.json`。
- `config/media.json`用于运行时预载及素材面板展示。
- 代码按角色职责命名，人物外观由素材决定。

## 来源与致谢

原作品及素材署名见 [CREDITS.txt](CREDITS.txt)。Noto 字体的 OFL 声明随 `assets/fonts/` 提供。
