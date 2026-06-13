# LocalAI Video Generator

> 国内合规AI全自动短视频生成工具 - 基于Electron+Vue3

## 项目简介

LocalAI Video Generator 是一款面向国内用户的AI全自动短视频生成桌面应用。用户只需输入一条创意文案，软件即可全自动完成文案拆分、AI生图、语音合成、字幕生成、视频合成等全部工序，最终输出9:16竖屏1080P MP4成品短视频，可直接发布到抖音、快手等短视频平台。

## 核心特性

- **全自动流水线**：输入创意 → AI分镜 → AI生图 → TTS配音 → 字幕生成 → 视频合成
- **国内合规API**：仅使用字节豆包、火山引擎等国内可直连API
- **本地离线能力**：Whisper本地字幕识别、FFmpeg本地视频合成
- **新手极简操作**：无需专业知识，填入API密钥即可使用
- **深色浅色双模式**：支持主题切换，保护视力
- **一键打包exe**：electron-builder一键输出Windows安装包

## 技术架构

```
Electron (主进程)
├── API模块
│   ├── 豆包开放平台 - 文案拆分 + AI图片生成
│   └── 火山引擎 - 中文语音合成(TTS)
├── 本地模块
│   ├── Whisper - 本地字幕识别
│   └── FFmpeg - 视频合成(运镜/转场/字幕硬压)
└── 工具模块
    ├── 加密存储 - API密钥本地AES加密
    └── 日志管理 - 统一日志记录

Vue3 (渲染进程)
├── 首页 - 创意输入
├── 进度面板 - 实时进度 + 日志
├── 设置页面 - API配置 + 教程
└── 预览窗口 - 视频预览 + 导出
```

## 快速开始

### 1. 申请API密钥

#### 豆包开放平台 API Key
1. 访问 [豆包开放平台](https://www.volcengine.com/product/doubao)
2. 注册/登录字节火山引擎账号
3. 进入控制台 → 方舟大模型 → 创建API Key
4. 复制保存API Key

#### 火山引擎语音合成
1. 访问 [火山语音合成](https://www.volcengine.com/product/speech)
2. 进入语音合成控制台
3. 创建应用，获取 App ID 和 API Key
4. 开通语音合成服务权限

### 2. 安装使用

#### 方式一：直接下载安装包
1. 从 Releases 页面下载最新版 `LocalAI-Video-Generator-Setup.exe`
2. 运行安装程序，按向导完成安装
3. 打开软件，进入设置页面填入API密钥
4. 返回首页，输入创意文案，点击"开始生成视频"

#### 方式二：源码运行
```bash
# 克隆仓库
git clone https://github.com/yourusername/LocalAI-Video-Generator.git
cd LocalAI-Video-Generator

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 打包构建
npm run dist:win
```

### 3. 使用流程

1. **配置API**：首次使用进入"API设置"页面，填入豆包和火山引擎密钥
2. **输入创意**：在首页输入你的创意文案或脚本思路
3. **选择参数**：选择视频时长（30s/60s/90s）和风格（解说/剧情/口播）
4. **开始生成**：点击"开始生成视频"，等待全自动处理
5. **预览导出**：生成完成后在预览页面查看成品，可打开文件位置

## 项目结构

```
LocalAI-Video-Generator/
├── electron/              # Electron主进程
│   ├── main.js           # 主进程入口
│   ├── preload.js        # 预加载脚本
│   ├── api/              # API调用模块
│   │   ├── doubao.js     # 豆包API
│   │   └── volcano.js    # 火山TTS API
│   ├── local/            # 本地离线模块
│   │   ├── whisper.js    # Whisper字幕
│   │   └── ffmpeg.js     # FFmpeg视频合成
│   └── utils/            # 工具函数
│       ├── crypto.js     # 加密存储
│       └── logger.js     # 日志管理
├── src/                   # Vue3前端源码
│   ├── views/            # 页面视图
│   ├── stores/           # Pinia状态管理
│   └── styles/           # 样式文件
├── resources/             # 打包资源
│   ├── ffmpeg/           # FFmpeg二进制
│   └── whisper/          # Whisper模型
├── docs/                  # 文档
├── package.json           # 项目依赖
└── README.md             # 项目说明
```

## 打包发布

### 本地打包
```bash
# 安装依赖
npm install

# 打包Windows安装包
npm run dist:win

# 输出目录
# release/LocalAI-Video-Generator-Setup.exe
```

### GitHub发布
1. 在GitHub创建Release
2. 上传 `release/LocalAI-Video-Generator-Setup.exe`
3. 填写版本说明
4. 发布

## 费用说明

| 服务 | 计费方式 | 备注 |
|------|---------|------|
| 豆包大模型 | 按token计费 | 新用户有免费额度 |
| 豆包生图 | 按生成次数 | 新用户有免费额度 |
| 火山TTS | 按字符数计费 | 新用户有免费额度 |

建议先充值少量金额测试使用，具体费率请参考各平台官方文档。

## 开发计划

- [x] 基础项目架构
- [x] 豆包API集成（文案拆分+生图）
- [x] 火山TTS集成
- [x] Whisper本地字幕
- [x] FFmpeg视频合成
- [x] Vue3前端界面
- [x] 主题切换
- [ ] 更多视频转场效果
- [ ] 背景音乐支持
- [ ] 批量生成模式
- [ ] 模板市场

## 常见问题

**Q: 为什么需要申请API密钥？**
A: 软件本身完全免费开源，但AI服务（文案拆分、生图、配音）需要调用云端API，这些服务由字节火山引擎提供，需要用户自行申请密钥并按量付费。

**Q: API密钥安全吗？**
A: 密钥使用AES-256加密后保存在本地，不会上传到任何服务器。

**Q: 没有网络可以使用吗？**
A: 除AI服务需要联网外，字幕生成和视频合成完全本地执行。没有网络时可以使用备用字幕方案。

**Q: 支持Mac/Linux吗？**
A: 当前版本仅支持Windows。Mac/Linux版本需要替换FFmpeg和Whisper的二进制文件，后续可能支持。

## 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 联系方式

- GitHub Issues: [提交问题](https://github.com/yourusername/LocalAI-Video-Generator/issues)
- 邮箱: your.email@example.com

## 致谢

- [Electron](https://www.electronjs.org/)
- [Vue3](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [FFmpeg](https://ffmpeg.org/)
- [Whisper](https://github.com/openai/whisper)
- [豆包开放平台](https://www.volcengine.com/product/doubao)
- [火山引擎](https://www.volcengine.com/)
