/**
 * FFmpeg 视频合成模块
 * 本地执行FFmpeg命令，实现图片运镜、转场、配音、字幕硬压
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

class FFmpegEngine {
  constructor() {
    this.ffmpegPath = this.getFFmpegPath()
  }

  /**
   * 获取FFmpeg可执行文件路径
   */
  getFFmpegPath() {
    const isPackaged = process.env.NODE_ENV === 'production' || 
                      __dirname.includes('app.asar')
    
    if (isPackaged) {
      return path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe')
    } else {
      // 开发环境优先使用系统FFmpeg，否则使用内置
      const localPath = path.join(__dirname, '../../resources/ffmpeg/ffmpeg.exe')
      if (fs.existsSync(localPath)) {
        return localPath
      }
      return 'ffmpeg' // 使用系统PATH中的FFmpeg
    }
  }

  /**
   * 合成最终视频
   * @param {Object} params - 合成参数
   * @param {string[]} params.images - 图片路径数组
   * @param {string} params.audio - 音频路径
   * @param {string} params.subtitle - 字幕路径
   * @param {Array} params.scenes - 分镜信息
   * @param {string} params.output - 输出路径
   * @param {number} params.duration - 目标时长（秒）
   */
  async composeVideo(params) {
    const { images, audio, subtitle, scenes, output, duration } = params
    
    // 创建临时工作目录
    const tempDir = path.dirname(output)
    const concatFile = path.join(tempDir, 'concat.txt')
    
    // 计算每个镜头的时长
    const sceneDuration = duration / images.length
    
    // 为每张图片添加运镜效果并转换为视频片段
    const videoSegments = []
    for (let i = 0; i < images.length; i++) {
      const segmentPath = path.join(tempDir, `segment_${i}.mp4`)
      await this.imageToVideo(images[i], segmentPath, sceneDuration, i)
      videoSegments.push(segmentPath)
    }

    // 创建concat文件
    const concatContent = videoSegments.map(v => `file '${v}'`).join('\n')
    fs.writeFileSync(concatFile, concatContent)

    // 合并视频片段并添加音频和字幕
    await this.mergeAndAddAudioSubtitle(concatFile, audio, subtitle, output, duration)

    // 清理临时文件
    this.cleanup(tempDir, videoSegments, concatFile)

    return output
  }

  /**
   * 图片转视频（添加运镜效果）
   * @param {string} imagePath - 图片路径
   * @param {string} outputPath - 输出视频路径
   * @param {number} duration - 时长（秒）
   * @param {number} index - 镜头索引（用于选择不同运镜效果）
   */
  async imageToVideo(imagePath, outputPath, duration, index) {
    return new Promise((resolve, reject) => {
      // 根据索引选择不同的运镜效果
      const zoomEffects = [
        'zoompan=z=\'min(zoom+0.0015,1.5)\':d=\'${duration*30}\':s=1080x1920', // 缓慢放大
        'zoompan=z=\'if(lte(onset,1),1.5,max(1.001,zoom-0.0015))\':d=\'${duration*30}\':s=1080x1920', // 缓慢缩小
        'zoompan=z=\'1.2\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=\'${duration*30}\':s=1080x1920', // 平移
      ]
      
      const effect = zoomEffects[index % zoomEffects.length]
      const fps = 30
      const totalFrames = Math.floor(duration * fps)

      const args = [
        '-loop', '1',
        '-i', imagePath,
        '-vf', `${effect},format=yuv420p`,
        '-c:v', 'libx264',
        '-t', duration.toString(),
        '-r', fps.toString(),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-y',
        outputPath
      ]

      const ffmpeg = spawn(this.ffmpegPath, args)
      
      let stderr = ''
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`图片转视频失败: ${stderr}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  /**
   * 合并视频片段并添加音频和字幕
   */
  async mergeAndAddAudioSubtitle(concatFile, audioPath, subtitlePath, outputPath, duration) {
    return new Promise((resolve, reject) => {
      const args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile,
        '-i', audioPath,
        '-vf', `subtitles=${subtitlePath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=50'`,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-movflags', '+faststart',
        '-y',
        outputPath
      ]

      const ffmpeg = spawn(this.ffmpegPath, args)
      
      let stderr = ''
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`视频合成失败: ${stderr}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  /**
   * 添加转场效果（使用xfade滤镜）
   */
  async addTransitions(videoSegments, outputPath) {
    if (videoSegments.length < 2) {
      // 只有一个片段，直接复制
      fs.copyFileSync(videoSegments[0], outputPath)
      return outputPath
    }

    // 使用concat + xfade添加转场
    const filterComplex = this.buildTransitionFilter(videoSegments)
    
    return new Promise((resolve, reject) => {
      const inputs = videoSegments.map(v => ['-i', v]).flat()
      
      const args = [
        ...inputs,
        '-filter_complex', filterComplex,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-y',
        outputPath
      ]

      const ffmpeg = spawn(this.ffmpegPath, args)
      
      let stderr = ''
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`转场添加失败: ${stderr}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  /**
   * 构建转场滤镜字符串
   */
  buildTransitionFilter(segments) {
    const transitions = ['fade', 'wipeleft', 'wiperight', 'slideleft', 'slideright']
    let filter = ''
    let lastLabel = '[0:v]'

    for (let i = 1; i < segments.length; i++) {
      const transition = transitions[i % transitions.length]
      const duration = 0.5 // 转场时长0.5秒
      
      if (i === 1) {
        filter += `[0:v][1:v]xfade=transition=${transition}:duration=${duration}:offset=${5 - duration}[v1];`
        lastLabel = '[v1]'
      } else {
        filter += `${lastLabel}[${i}:v]xfade=transition=${transition}:duration=${duration}:offset=${i * 5 - duration}[v${i}];`
        lastLabel = `[v${i}]`
      }
    }

    filter += `${lastLabel}format=yuv420p[outv]`
    return filter
  }

  /**
   * 清理临时文件
   */
  cleanup(tempDir, segments, concatFile) {
    try {
      // 删除临时视频片段
      segments.forEach(seg => {
        if (fs.existsSync(seg)) {
          fs.unlinkSync(seg)
        }
      })
      
      // 删除concat文件
      if (fs.existsSync(concatFile)) {
        fs.unlinkSync(concatFile)
      }
    } catch (e) {
      console.warn('清理临时文件失败', e)
    }
  }

  /**
   * 获取视频信息
   */
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn(this.ffmpegPath.replace('ffmpeg', 'ffprobe'), [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,duration',
        '-of', 'json',
        videoPath
      ])

      let stdout = ''
      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(stdout)
            resolve(info)
          } catch (e) {
            reject(e)
          }
        } else {
          reject(new Error('获取视频信息失败'))
        }
      })

      ffprobe.on('error', reject)
    })
  }
}

module.exports = FFmpegEngine
