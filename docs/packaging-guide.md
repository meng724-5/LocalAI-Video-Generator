# 打包教程

## 一、打包前准备

### 1. 确认环境
```bash
# 检查Node.js版本（需v18+）
node -v

# 检查npm版本
npm -v

# 检查是否安装了必要的依赖
npm list electron electron-builder
```

### 2. 配置资源文件
确保以下资源文件已正确放置：

```
resources/
├── ffmpeg/
│   └── ffmpeg.exe          # FFmpeg Windows可执行文件
├── whisper/
│   ├── whisper-cli.exe     # Whisper可执行文件（可选）
│   └── ggml-base.bin       # Whisper模型文件（可选）
└── assets/
    ├── icon.ico            # 应用图标（用于打包）
    └── icon.png            # 应用图标
```

### 3. 修改应用信息（可选）
编辑 `package.json` 中的以下字段：
```json
{
  "name": "localai-video-generator",
  "version": "1.0.0",
  "description": "国内合规AI全自动短视频生成工具",
  "author": "Your Name",
  "build": {
    "appId": "com.yourcompany.localai-video-generator",
    "productName": "LocalAI Video Generator"
  }
}
```

## 二、执行打包

### 方式一：一键打包命令
```bash
# 构建前端 + 打包Electron（推荐）
npm run electron:build

# 或仅打包Windows版本
npm run dist:win
```

### 方式二：分步执行
```bash
# 1. 构建Vue3前端资源
npm run build

# 2. 打包Electron应用
npm run dist
```

## 三、打包输出

打包完成后，文件位于 `release/` 目录：

```
release/
├── LocalAI-Video-Generator-Setup.exe    # Windows安装包（推荐分发）
├── LocalAI-Video-Generator-1.0.0.exe    # 便携版（无需安装）
├── win-unpacked/                        # 未打包的文件目录
│   ├── LocalAI Video Generator.exe      # 可直接运行的exe
│   └── resources/                       # 资源文件
└── builder-effective-config.yaml        # 打包配置记录
```

## 四、打包配置说明

### package.json 中的 build 配置
```json
{
  "build": {
    "appId": "com.localai.video-generator",
    "productName": "LocalAI Video Generator",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "resources/**/*",
      "node_modules/**/*"
    ],
    "extraResources": [
      {
        "from": "resources/ffmpeg",
        "to": "ffmpeg"
      },
      {
        "from": "resources/whisper",
        "to": "whisper"
      }
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "resources/assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "LocalAI Video Generator"
    }
  }
}
```

### 配置说明
| 配置项 | 说明 |
|--------|------|
| appId | 应用唯一标识 |
| productName | 应用显示名称 |
| directories.output | 输出目录 |
| files | 包含的文件 |
| extraResources | 额外资源（FFmpeg、Whisper等） |
| win.target | Windows打包目标（nsis=安装包） |
| nsis.oneClick | 是否一键安装 |
| nsis.allowToChangeInstallationDirectory | 允许选择安装目录 |

## 五、自定义打包

### 仅打包便携版（不生成安装程序）
```json
{
  "build": {
    "win": {
      "target": [
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    }
  }
}
```

### 打包32位版本
```json
{
  "build": {
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ]
    }
  }
}
```

### 添加数字签名（正式发布需要）
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "your-password"
    }
  }
}
```

## 六、GitHub发布步骤

### 1. 创建Release
1. 打开GitHub仓库页面
2. 点击右侧 "Releases"
3. 点击 "Create a new release"
4. 点击 "Choose a tag"
5. 输入新版本号（如 `v1.0.0`），点击 "Create new tag"

### 2. 填写发布信息
```
Title: LocalAI Video Generator v1.0.0

Description:
## 更新内容
- 首次发布
- 支持AI全自动短视频生成
- 支持文案拆分、AI生图、TTS配音、字幕生成、视频合成

## 安装说明
1. 下载 LocalAI-Video-Generator-Setup.exe
2. 运行安装程序
3. 配置API密钥后即可使用

## 系统要求
- Windows 10/11 64位
- 8GB内存以上
```

### 3. 上传安装包
1. 点击 "Attach binaries by dropping them here or selecting them"
2. 选择 `release/LocalAI-Video-Generator-Setup.exe`
3. 等待上传完成

### 4. 发布
1. 确认信息无误
2. 点击 "Publish release"
3. 用户即可在Release页面下载安装包

## 七、常见问题

### 问题1: 打包时提示找不到electron-builder
**解决方案：**
```bash
npm install -D electron-builder
```

### 问题2: 打包后运行报错
**解决方案：**
1. 检查 `resources` 目录是否正确包含
2. 检查 `extraResources` 配置是否正确
3. 尝试重新打包

### 问题3: 安装包太大
**解决方案：**
- 在 `files` 中排除不必要的文件
- 使用 `!` 前缀排除：
```json
{
  "files": [
    "dist/**/*",
    "electron/**/*",
    "resources/**/*",
    "node_modules/**/*",
    "!node_modules/.cache",
    "!**/*.map"
  ]
}
```

### 问题4: 图标不显示
**解决方案：**
- 确保图标文件存在：`resources/assets/icon.ico`
- 图标尺寸建议：256x256 或更大
- 格式：Windows使用 `.ico`，Mac使用 `.icns`

## 八、自动化打包（CI/CD）

### GitHub Actions 配置
创建 `.github/workflows/build.yml`：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build application
      run: npm run dist:win
    
    - name: Upload to Release
      uses: softprops/action-gh-release@v1
      with:
        files: release/*.exe
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

每次推送 `v*` 标签时，GitHub Actions 会自动打包并上传到Release。
