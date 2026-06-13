/**
 * Whisper 本地字幕生成模块
 * 使用轻量级Whisper模型本地运行，无需联网
 * 模型文件需提前下载放置在 resources/whisper 目录
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

class WhisperEngine {
  constructor() {
    // 根据环境确定Whisper可执行文件路径
    this.whisperPath = this.getWhisperPath()
    this.modelPath = this.getModelPath()
  }

  /**
   * 获取Whisper可执行文件路径
   */
  getWhisperPath() {
    const isPackaged = process.env.NODE_ENV === 'production' || 
                      __dirname.includes('app.asar')
    
    if (isPackaged) {
      // 打包后的路径
      return path.join(process.resourcesPath, 'whisper', 'whisper-cli.exe')
    } else {
      // 开发环境路径
      return path.join(__dirname, '../../resources/whisper/whisper-cli.exe')
    }
  }

  /**
   * 获取模型文件路径
   */
  getModelPath() {
    const isPackaged = process.env.NODE_ENV === 'production' || 
                      __dirname.includes('app.asar')
    
    if (isPackaged) {
      return path.join(process.resourcesPath, 'whisper', 'ggml-base.bin')
    } else {
      return path.join(__dirname, '../../resources/whisper/ggml-base.bin')
    }
  }

  /**
   * 生成字幕文件
   * @param {string} audioPath - 音频文件路径
   * @param {string} outputPath - 字幕输出路径（SRT格式）
   */
  async generateSubtitle(audioPath, outputPath) {
    // 检查Whisper是否可用
    if (!fs.existsSync(this.whisperPath)) {
      console.warn('Whisper可执行文件不存在，使用备用字幕生成方案')
      return this.generateFallbackSubtitle(audioPath, outputPath)
    }

    if (!fs.existsSync(this.modelPath)) {
      console.warn('Whisper模型文件不存在，使用备用字幕生成方案')
      return this.generateFallbackSubtitle(audioPath, outputPath)
    }

    return new Promise((resolve, reject) => {
      const args = [
        '-m', this.modelPath,
        '-f', audioPath,
        '-l', 'zh',
        '-osrt',
        '-of', outputPath.replace('.srt', ''),
        '--max-len', '20',
        '--split-on-word'
      ]

      const whisper = spawn(this.whisperPath, args)
      
      let stderr = ''
      whisper.stderr.on('data', (data) => {
        stderr += data.toString()
        console.log('Whisper:', data.toString())
      })

      whisper.on('close', (code) => {
        if (code === 0 || fs.existsSync(outputPath)) {
          // Whisper会自动添加.srt后缀
          const generatedPath = outputPath.replace('.srt', '') + '.srt'
          if (fs.existsSync(generatedPath) && generatedPath !== outputPath) {
            fs.renameSync(generatedPath, outputPath)
          }
          resolve(outputPath)
        } else {
          console.warn('Whisper执行失败，使用备用方案')
          this.generateFallbackSubtitle(audioPath, outputPath).then(resolve).catch(reject)
        }
      })

      whisper.on('error', (error) => {
        console.warn('Whisper启动失败:', error)
        this.generateFallbackSubtitle(audioPath, outputPath).then(resolve).catch(reject)
      })
    })
  }

  /**
   * 备用字幕生成方案
   * 当Whisper不可用时，基于音频时长生成均匀分布的字幕
   */
  async generateFallbackSubtitle(audioPath, outputPath) {
    try {
      // 获取音频时长
      const duration = await this.getAudioDuration(audioPath)
      
      // 读取原始文案（如果存在同目录的script.txt）
      const scriptPath = audioPath.replace('.mp3', '_script.txt')
      let text = '自动生成的字幕'
      if (fs.existsSync(scriptPath)) {
        text = fs.readFileSync(scriptPath, 'utf-8')
      }

      // 生成简单的SRT字幕（均匀分布）
      const segments = this.splitTextIntoSegments(text, duration)
      const srtContent = this.generateSRT(segments)
      
      fs.writeFileSync(outputPath, srtContent, 'utf-8')
      return outputPath
    } catch (error) {
      // 最简单的备用方案
      const srt = `1
00:00:00,000 --> 00:00:05,000
自动字幕生成中
`
      fs.writeFileSync(outputPath, srt, 'utf-8')
      return outputPath
    }
  }

  /**
   * 获取音频时长（使用FFmpeg）
   */
  getAudioDuration(audioPath) {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', audioPath,
        '-f', 'null',
        '-'
      ])

      let stderr = ''
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', () => {
        const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)
        if (match) {
          const hours = parseInt(match[1])
          const minutes = parseInt(match[2])
          const seconds = parseFloat(match[3])
          resolve(hours * 3600 + minutes * 60 + seconds)
        } else {
          resolve(30) // 默认30秒
        }
      })

      ffmpeg.on('error', () => resolve(30))
    })
  }

  /**
   * 将文本分割为时间段
   */
  splitTextIntoSegments(text, duration) {
    const sentences = text.split(/([。！？.!?])/).filter(Boolean)
    const segments = []
    const segmentDuration = duration / Math.max(sentences.length, 1)
    
    let currentTime = 0
    for (let i = 0; i < sentences.length; i++) {
      const start = currentTime
      const end = Math.min(currentTime + segmentDuration, duration)
      
      segments.push({
        index: i + 1,
        start,
        end,
        text: sentences[i].trim()
      })
      
      currentTime = end
    }
    
    return segments
  }

  /**
   * 生成SRT格式字幕
   */
  generateSRT(segments) {
    return segments.map(seg => {
      return `${seg.index}\n${this.formatTime(seg.start)} --> ${this.formatTime(seg.end)}\n${seg.text}\n`
    }).join('\n')
  }

  /**
   * 格式化时间为SRT格式
   */
  formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }
}

module.exports = WhisperEngine
