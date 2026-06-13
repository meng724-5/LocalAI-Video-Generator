/**
 * 火山引擎语音合成 API 模块
 * 提供中文TTS配音功能
 * 文档地址: https://www.volcengine.com/docs/6561
 */

const https = require('https')
const fs = require('fs')
const crypto = require('crypto')

class VolcanoAPI {
  constructor(appId, apiKey) {
    this.appId = appId
    this.apiKey = apiKey
    this.baseURL = 'openspeech.bytedance.com'
  }

  /**
   * 文本转语音
   * @param {string} text - 要合成的文本
   * @param {string} outputPath - 音频保存路径
   * @param {Object} options - 额外选项
   */
  async textToSpeech(text, outputPath, options = {}) {
    const requestData = {
      app: {
        appid: this.appId,
        token: 'access_token',
        cluster: 'volcano_tts'
      },
      user: {
        uid: 'localai_user'
      },
      audio: {
        voice_type: options.voiceType || 'BV001_streaming',
        encoding: 'mp3',
        speed_ratio: options.speed || 1.0,
        volume_ratio: options.volume || 1.0,
        pitch_ratio: options.pitch || 1.0
      },
      request: {
        reqid: crypto.randomUUID(),
        text: text,
        text_type: 'plain',
        operation: 'query'
      }
    }

    const response = await this.makeRequest('/api/v1/tts', requestData)
    
    // 处理返回的音频数据
    if (response.data && response.data.audio) {
      const audioBuffer = Buffer.from(response.data.audio, 'base64')
      fs.writeFileSync(outputPath, audioBuffer)
    } else if (response.audio) {
      const audioBuffer = Buffer.from(response.audio, 'base64')
      fs.writeFileSync(outputPath, audioBuffer)
    } else {
      throw new Error('TTS响应中没有音频数据')
    }
  }

  /**
   * 长文本转语音（分段处理）
   * @param {string} text - 长文本
   * @param {string} outputPath - 音频保存路径
   */
  async longTextToSpeech(text, outputPath) {
    // 按标点符号分段，每段不超过500字
    const segments = this.splitText(text, 500)
    const tempFiles = []

    for (let i = 0; i < segments.length; i++) {
      const tempPath = outputPath.replace('.mp3', `_part_${i}.mp3`)
      await this.textToSpeech(segments[i], tempPath)
      tempFiles.push(tempPath)
    }

    // 合并音频文件
    if (tempFiles.length > 1) {
      await this.mergeAudioFiles(tempFiles, outputPath)
      // 清理临时文件
      tempFiles.forEach(f => {
        try { fs.unlinkSync(f) } catch (e) {}
      })
    }
  }

  /**
   * 分割长文本
   */
  splitText(text, maxLength) {
    const segments = []
    let current = ''
    
    const sentences = text.split(/([。！？.!?;；,，])/)
    
    for (const sentence of sentences) {
      if (current.length + sentence.length > maxLength) {
        if (current) segments.push(current)
        current = sentence
      } else {
        current += sentence
      }
    }
    
    if (current) segments.push(current)
    return segments
  }

  /**
   * 合并音频文件（使用FFmpeg）
   */
  async mergeAudioFiles(files, output) {
    const listFile = output.replace('.mp3', '_list.txt')
    const fileList = files.map(f => `file '${f}'`).join('\n')
    fs.writeFileSync(listFile, fileList)

    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process')
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        output
      ])

      ffmpeg.on('close', (code) => {
        try { fs.unlinkSync(listFile) } catch (e) {}
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg合并失败，退出码: ${code}`))
        }
      })

      ffmpeg.on('error', reject)
    })
  }

  /**
   * 发起HTTPS请求
   */
  makeRequest(path, data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data)
      
      const options = {
        hostname: this.baseURL,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      }

      const req = https.request(options, (res) => {
        let responseData = ''
        
        res.on('data', (chunk) => {
          responseData += chunk
        })
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData)
            if (parsed.code !== 0 && parsed.code !== undefined) {
              reject(new Error(parsed.message || 'TTS请求失败'))
            } else {
              resolve(parsed)
            }
          } catch (e) {
            reject(new Error('响应解析失败: ' + responseData))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.write(postData)
      req.end()
    })
  }
}

module.exports = VolcanoAPI
