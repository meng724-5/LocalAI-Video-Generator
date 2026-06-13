/**
 * 字节豆包开放平台 API 模块
 * 提供文案拆分和图片生成功能
 * 文档地址: https://www.volcengine.com/docs/82379
 */

const https = require('https')
const fs = require('fs')

class DoubaoAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseURL = 'ark.cn-beijing.volces.com'
  }

  /**
   * 调用大模型拆分文案为分镜
   * @param {string} script - 用户输入的原始文案/创意
   * @param {string} duration - 视频时长 (30s/60s/90s)
   * @param {string} style - 视频风格 (解说/剧情/口播)
   * @returns {Promise<Array>} 分镜数组
   */
  async splitScript(script, duration, style) {
    const prompt = this.buildSplitPrompt(script, duration, style)
    
    const requestData = {
      model: 'doubao-pro-32k',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的短视频分镜导演。请将用户提供的文案拆分为多个镜头分镜，每个分镜包含旁白文案和配图描述。输出必须为JSON格式。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }

    const response = await this.makeRequest('/api/v3/chat/completions', requestData)
    return this.parseScenes(response.choices[0].message.content)
  }

  /**
   * 生成图片素材
   * @param {string} prompt - 图片描述提示词
   * @param {string} outputPath - 图片保存路径
   */
  async generateImage(prompt, outputPath) {
    const requestData = {
      model: 'doubao-image-generation',
      prompt: prompt,
      width: 1080,
      height: 1920,  // 9:16 竖屏
      seed: Math.floor(Math.random() * 1000000)
    }

    const response = await this.makeRequest('/api/v3/images/generations', requestData)
    
    // 下载图片
    if (response.data && response.data[0] && response.data[0].url) {
      await this.downloadImage(response.data[0].url, outputPath)
    } else if (response.data && response.data[0] && response.data[0].b64_json) {
      // Base64编码的图片
      const buffer = Buffer.from(response.data[0].b64_json, 'base64')
      fs.writeFileSync(outputPath, buffer)
    }
  }

  /**
   * 构建文案拆分提示词
   */
  buildSplitPrompt(script, duration, style) {
    const sceneCount = duration === '30s' ? 3 : duration === '60s' ? 5 : 7
    
    return `请将以下${style}风格的短视频文案拆分为${sceneCount}个镜头分镜。

原始文案/创意：
${script}

要求：
1. 每个镜头包含：镜头编号、旁白文案（中文）、配图描述（详细的英文绘画提示词）
2. 配图描述需要适合AI绘画生成，包含场景、人物、光线、风格等细节
3. 总时长控制在${duration}左右
4. 输出格式为JSON数组，格式如下：
[
  {
    "sceneNumber": 1,
    "narration": "旁白文案",
    "imagePrompt": "英文绘画提示词，包含画面细节",
    "duration": 5
  }
]`
  }

  /**
   * 解析大模型返回的分镜JSON
   */
  parseScenes(content) {
    try {
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return JSON.parse(content)
    } catch (e) {
      // 如果JSON解析失败，使用正则提取
      console.error('JSON解析失败，尝试正则提取', e)
      return this.extractScenesByRegex(content)
    }
  }

  /**
   * 使用正则表达式提取分镜信息（备用方案）
   */
  extractScenesByRegex(content) {
    const scenes = []
    const sceneBlocks = content.split(/镜头\s*\d+|Scene\s*\d+/i).filter(Boolean)
    
    sceneBlocks.forEach((block, index) => {
      const narration = block.match(/旁白[：:]\s*([^\n]+)/)?.[1] || 
                       block.match(/文案[：:]\s*([^\n]+)/)?.[1] || ''
      const imagePrompt = block.match(/配图[：:]\s*([^\n]+)/)?.[1] || 
                         block.match(/提示词[：:]\s*([^\n]+)/)?.[1] || 
                         block.match(/Prompt[：:]\s*([^\n]+)/i)?.[1] || ''
      
      if (narration || imagePrompt) {
        scenes.push({
          sceneNumber: index + 1,
          narration: narration.trim(),
          imagePrompt: imagePrompt.trim() || narration.trim(),
          duration: 5
        })
      }
    })

    return scenes.length > 0 ? scenes : [{
      sceneNumber: 1,
      narration: content.substring(0, 100),
      imagePrompt: 'A cinematic scene, high quality, detailed',
      duration: 5
    }]
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
          'Authorization': `Bearer ${this.apiKey}`,
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
            if (parsed.error) {
              reject(new Error(parsed.error.message || 'API请求失败'))
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

  /**
   * 下载图片
   */
  downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : require('http')
      
      protocol.get(url, (res) => {
        if (res.statusCode === 200) {
          const fileStream = fs.createWriteStream(outputPath)
          res.pipe(fileStream)
          fileStream.on('finish', () => {
            fileStream.close()
            resolve()
          })
        } else {
          reject(new Error(`下载图片失败，状态码: ${res.statusCode}`))
        }
      }).on('error', reject)
    })
  }
}

module.exports = DoubaoAPI
