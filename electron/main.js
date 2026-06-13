/**
 * Electron 主进程入口
 * 负责窗口管理、IPC通信、API调用调度、本地工具执行
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

// 导入各功能模块
const DoubaoAPI = require('./api/doubao')
const VolcanoAPI = require('./api/volcano')
const WhisperEngine = require('./local/whisper')
const FFmpegEngine = require('./local/ffmpeg')
const CryptoUtil = require('./utils/crypto')
const Logger = require('./utils/logger')

// 全局配置
const APP_DATA_PATH = path.join(os.homedir(), 'LocalAI-Video-Generator')
const CONFIG_PATH = path.join(APP_DATA_PATH, 'config.json')
const OUTPUT_PATH = path.join(APP_DATA_PATH, 'output')
const TEMP_PATH = path.join(APP_DATA_PATH, 'temp')

// 确保目录存在
function ensureDirs() {
  [APP_DATA_PATH, OUTPUT_PATH, TEMP_PATH].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

// 读取配置
function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      Logger.error('读取配置失败', e)
    }
  }
  return {}
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    return true
  } catch (e) {
    Logger.error('保存配置失败', e)
    return false
  }
}

// 创建主窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'LocalAI Video Generator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../resources/assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  })

  // 加载页面
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  return mainWindow
}

// IPC 通信处理
function setupIPC() {
  // 获取配置
  ipcMain.handle('get-config', () => {
    return loadConfig()
  })

  // 保存配置
  ipcMain.handle('save-config', (event, config) => {
    // 加密敏感字段
    if (config.doubaoApiKey) {
      config.doubaoApiKey = CryptoUtil.encrypt(config.doubaoApiKey)
    }
    if (config.volcanoApiKey) {
      config.volcanoApiKey = CryptoUtil.encrypt(config.volcanoApiKey)
    }
    if (config.volcanoAppId) {
      config.volcanoAppId = CryptoUtil.encrypt(config.volcanoAppId)
    }
    return saveConfig(config)
  })

  // 解密配置（内部使用）
  ipcMain.handle('get-decrypted-config', () => {
    const config = loadConfig()
    if (config.doubaoApiKey) {
      config.doubaoApiKey = CryptoUtil.decrypt(config.doubaoApiKey)
    }
    if (config.volcanoApiKey) {
      config.volcanoApiKey = CryptoUtil.decrypt(config.volcanoApiKey)
    }
    if (config.volcanoAppId) {
      config.volcanoAppId = CryptoUtil.decrypt(config.volcanoAppId)
    }
    return config
  })

  // 选择保存目录
  ipcMain.handle('select-output-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择视频保存目录'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // 打开外部链接
  ipcMain.handle('open-external', (event, url) => {
    shell.openExternal(url)
  })

  // 开始生成视频 - 主流程
  ipcMain.handle('generate-video', async (event, params) => {
    const { script, duration, style, outputDir } = params
    const config = loadConfig()
    
    // 解密API密钥
    const doubaoKey = config.doubaoApiKey ? CryptoUtil.decrypt(config.doubaoApiKey) : ''
    const volcanoKey = config.volcanoApiKey ? CryptoUtil.decrypt(config.volcanoApiKey) : ''
    const volcanoAppId = config.volcanoAppId ? CryptoUtil.decrypt(config.volcanoAppId) : ''

    if (!doubaoKey || !volcanoKey || !volcanoAppId) {
      return { success: false, error: '请先配置API密钥' }
    }

    const jobId = Date.now().toString()
    const jobTempDir = path.join(TEMP_PATH, jobId)
    fs.mkdirSync(jobTempDir, { recursive: true })

    try {
      // 阶段1: 文案拆分
      sendProgress(event, 'script-split', 10, '正在拆分文案为分镜...')
      const doubao = new DoubaoAPI(doubaoKey)
      const scenes = await doubao.splitScript(script, duration, style)
      Logger.info('文案拆分完成', { sceneCount: scenes.length })

      // 阶段2: 生成图片素材
      sendProgress(event, 'image-gen', 30, `正在生成 ${scenes.length} 个镜头的图片素材...`)
      const images = []
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const imagePath = path.join(jobTempDir, `scene_${i + 1}.png`)
        await doubao.generateImage(scene.imagePrompt, imagePath)
        images.push(imagePath)
        sendProgress(event, 'image-gen', 30 + Math.floor((i + 1) / scenes.length * 20), 
          `已生成 ${i + 1}/${scenes.length} 张图片`)
      }

      // 阶段3: 生成配音
      sendProgress(event, 'tts', 55, '正在生成中文旁白配音...')
      const volcano = new VolcanoAPI(volcanoAppId, volcanoKey)
      const audioPath = path.join(jobTempDir, 'voiceover.mp3')
      const fullScript = scenes.map(s => s.narration).join('。')
      await volcano.textToSpeech(fullScript, audioPath)
      Logger.info('配音生成完成', { audioPath })

      // 阶段4: 生成字幕
      sendProgress(event, 'subtitle', 70, '正在本地生成字幕...')
      const whisper = new WhisperEngine()
      const subtitlePath = path.join(jobTempDir, 'subtitles.srt')
      await whisper.generateSubtitle(audioPath, subtitlePath)
      Logger.info('字幕生成完成', { subtitlePath })

      // 阶段5: 视频合成
      sendProgress(event, 'compose', 85, '正在合成最终视频...')
      const ffmpeg = new FFmpegEngine()
      const finalOutput = path.join(outputDir || OUTPUT_PATH, `video_${jobId}.mp4`)
      await ffmpeg.composeVideo({
        images,
        audio: audioPath,
        subtitle: subtitlePath,
        scenes,
        output: finalOutput,
        duration: parseInt(duration)
      })
      Logger.info('视频合成完成', { finalOutput })

      sendProgress(event, 'complete', 100, '视频生成完成！')
      return { success: true, outputPath: finalOutput, jobId }

    } catch (error) {
      Logger.error('视频生成失败', error)
      sendProgress(event, 'error', 0, `生成失败: ${error.message}`)
      return { success: false, error: error.message }
    }
  })

  // 获取视频预览
  ipcMain.handle('get-video-preview', (event, videoPath) => {
    if (fs.existsSync(videoPath)) {
      return { exists: true, path: videoPath }
    }
    return { exists: false }
  })

  // 打开文件所在目录
  ipcMain.handle('show-item-in-folder', (event, filePath) => {
    shell.showItemInFolder(filePath)
  })
}

// 发送进度更新到渲染进程
function sendProgress(event, stage, percent, message) {
  event.sender.send('progress-update', { stage, percent, message, timestamp: Date.now() })
}

// 应用生命周期
app.whenReady().then(() => {
  ensureDirs()
  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
