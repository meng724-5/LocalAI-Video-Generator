# LocalAI-Video-Generator 实施计划

## 项目概述
从零构建国内合规AI全自动短视频生成工具，用户输入创意后全自动完成分镜、生图、配音、字幕、视频合成，输出9:16竖屏1080P MP4。

## 技术栈
- **桌面框架**: Electron + Vue3 + Element Plus
- **API服务**: 字节豆包开放平台（文案拆分+生图）、火山引擎语音合成（TTS）
- **离线能力**: Whisper（本地字幕）、FFmpeg（本地视频合成）
- **打包**: electron-builder → Windows exe安装包

## 项目结构
```
LocalAI-Video-Generator/
├── electron/                  # Electron主进程
│   ├── main.js               # 主进程入口
│   ├── preload.js            # 预加载脚本（安全通信）
│   ├── api/                  # API调用模块
│   │   ├── doubao.js         # 豆包API（文案拆分+图片生成）
│   │   └── volcano.js        # 火山引擎TTS API
│   ├── local/                # 本地离线模块
│   │   ├── whisper.js        # Whisper字幕生成
│   │   └── ffmpeg.js         # FFmpeg视频合成
│   ├── utils/                # 工具函数
│   │   ├── crypto.js         # 密钥加密存储
│   │   └── logger.js         # 日志管理
│   └── config/               # 配置文件
│       └── default.js        # 默认配置
├── src/                       # Vue3前端源码
│   ├── main.js               # Vue入口
│   ├── App.vue               # 根组件
│   ├── views/                # 页面视图
│   │   ├── HomeView.vue      # 首页（输入创意）
│   │   ├── ProgressView.vue  # 进度面板
│   │   ├── SettingsView.vue  # 设置页面
│   │   └── PreviewView.vue   # 预览窗口
│   ├── components/           # 公共组件
│   │   ├── ThemeToggle.vue   # 主题切换
│   │   └── LogPanel.vue      # 日志面板
│   ├── stores/               # Pinia状态管理
│   │   └── index.js          # 全局状态
│   └── styles/               # 样式文件
│       ├── variables.css     # CSS变量
│       └── global.css        # 全局样式
├── resources/                 # 打包资源
│   ├── ffmpeg/               # FFmpeg二进制
│   ├── whisper/              # Whisper模型
│   └── assets/               # 静态资源
├── build/                     # 构建配置
│   └── electron-builder.yml  # 打包配置
├── docs/                      # 文档
│   ├── API申请教程.md
│   ├── 本地部署教程.md
│   └── 打包教程.md
├── package.json               # 项目依赖
├── vite.config.js            # Vite配置
├── index.html                # HTML模板
├── LICENSE                   # MIT协议
├── README.md                 # 项目说明
└── .gitignore                # Git忽略文件
```

## 实施步骤

### 阶段一：项目骨架搭建
1. 初始化npm项目，安装Electron、Vue3、Element Plus等依赖
2. 配置Vite + Electron开发环境
3. 创建主进程和渲染进程基础代码
4. 配置electron-builder打包脚本

### 阶段二：核心功能模块
1. **豆包API模块**：实现文案拆分和图片生成
2. **火山TTS模块**：实现语音合成
3. **Whisper模块**：本地字幕生成
4. **FFmpeg模块**：视频合成（运镜、转场、字幕硬压）
5. **加密工具**：API密钥本地安全存储

### 阶段三：UI界面开发
1. **首页**：创意输入、时长选择、风格选择
2. **进度面板**：分阶段进度展示、实时日志
3. **设置页面**：API密钥配置、密钥加密保存
4. **预览窗口**：视频预览、导出功能
5. **主题切换**：深色/浅色双模式

### 阶段四：离线依赖集成
1. 下载FFmpeg Windows二进制并配置
2. 下载轻量化Whisper模型
3. 配置资源打包路径

### 阶段五：开源文档
1. 编写README.md（含API申请、部署、打包教程）
2. 创建MIT LICENSE
3. 配置.gitignore
4. 编写详细使用文档

### 阶段六：测试打包
1. 本地功能测试
2. electron-builder打包exe
3. 验证安装包可用性
