# 本地部署教程

## 环境要求

- **操作系统**: Windows 10/11 (64位)
- **Node.js**: v18.x 或更高版本
- **npm**: v9.x 或更高版本
- **内存**: 建议 8GB 以上
- **磁盘空间**: 至少 2GB 可用空间

## 一、安装 Node.js

1. 访问 [Node.js官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 v18.x 或 v20.x）
3. 运行安装程序，按默认选项安装
4. 打开命令提示符，验证安装：
   ```bash
   node -v
   npm -v
   ```

## 二、克隆项目

```bash
# 使用git克隆仓库
git clone https://github.com/yourusername/LocalAI-Video-Generator.git

# 进入项目目录
cd LocalAI-Video-Generator
```

## 三、安装依赖

```bash
# 安装项目依赖
npm install
```

## 四、配置离线依赖（可选但推荐）

### 1. FFmpeg
软件需要 FFmpeg 进行视频合成。

**方式一：自动使用系统FFmpeg**
- 如果系统已安装FFmpeg并添加到PATH，软件会自动检测使用

**方式二：手动放置到resources目录**
1. 访问 [FFmpeg官方下载页](https://ffmpeg.org/download.html)
2. 下载 Windows 64-bit 静态构建版本
3. 解压后将 `ffmpeg.exe` 放到 `resources/ffmpeg/` 目录

### 2. Whisper（可选）
Whisper用于本地字幕识别，如果不放置会使用备用字幕方案。

1. 访问 [whisper.cpp Releases](https://github.com/ggerganov/whisper.cpp/releases)
2. 下载 Windows 版本的 `whisper-cli.exe`
3. 下载 `ggml-base.bin` 模型文件
4. 将两者放到 `resources/whisper/` 目录

## 五、开发模式运行

```bash
# 启动开发服务器
npm run dev

# 另开一个终端，启动Electron
npm run electron:dev
```

## 六、生产构建

```bash
# 构建前端资源
npm run build

# 打包Electron应用
npm run dist:win
```

打包完成后，安装包位于 `release/LocalAI-Video-Generator-Setup.exe`

## 七、本地测试步骤

### 1. 配置API密钥
1. 运行软件
2. 点击"API设置"
3. 填入豆包API Key、火山App ID、火山API Key
4. 点击保存

### 2. 测试生成
1. 返回首页
2. 输入一段测试文案，例如：
   ```
   一个关于春天花海的治愈系短视频，展现樱花盛开的美丽场景
   ```
3. 选择时长（建议先选30秒测试）
4. 选择风格（"解说"即可）
5. 点击"开始生成视频"
6. 观察进度面板，等待完成

### 3. 验证输出
1. 生成完成后自动跳转到预览页面
2. 检查视频是否正常播放
3. 检查字幕是否正确显示
4. 检查音频是否清晰

## 八、常见问题排查

### 问题1: npm install 失败
**解决方案：**
```bash
# 清除缓存后重试
npm cache clean --force
npm install

# 或使用淘宝镜像加速
npm config set registry https://registry.npmmirror.com
npm install
```

### 问题2: 提示找不到FFmpeg
**解决方案：**
- 确保FFmpeg已正确放置到 `resources/ffmpeg/ffmpeg.exe`
- 或在系统PATH中添加FFmpeg路径

### 问题3: API调用失败
**解决方案：**
1. 检查API密钥是否正确
2. 检查网络连接
3. 查看日志文件（位于用户目录下的 `LocalAI-Video-Generator/logs/`）

### 问题4: 视频生成失败
**解决方案：**
1. 检查磁盘空间是否充足
2. 检查是否有杀毒软件拦截
3. 查看实时日志获取详细错误信息

## 九、目录结构说明

```
LocalAI-Video-Generator/
├── electron/              # Electron主进程代码
├── src/                   # Vue3前端代码
├── resources/             # 资源文件
│   ├── ffmpeg/           # FFmpeg二进制（需自行放置）
│   └── whisper/          # Whisper模型（需自行放置）
├── docs/                  # 文档
├── dist/                  # 构建输出（自动生成）
├── release/               # 打包输出（自动生成）
└── package.json           # 项目配置
```

## 十、更新维护

### 更新代码
```bash
git pull origin main
npm install
```

### 重新打包
```bash
npm run dist:win
```
