/**
 * 默认配置文件
 * 包含应用的默认参数和常量
 */

module.exports = {
  // 应用信息
  app: {
    name: 'LocalAI Video Generator',
    version: '1.0.0',
    description: '国内合规AI全自动短视频生成工具'
  },

  // 视频生成默认配置
  video: {
    // 默认分辨率 (9:16 竖屏)
    width: 1080,
    height: 1920,
    
    // 默认帧率
    fps: 30,
    
    // 视频编码参数
    videoCodec: 'libx264',
    audioCodec: 'aac',
    videoBitrate: '4000k',
    audioBitrate: '192k',
    
    // 视频质量 (CRF值，越小质量越高，文件越大)
    crf: 23,
    
    // 预设 (影响编码速度和质量)
    preset: 'medium'
  },

  // 时长配置
  duration: {
    '30s': {
      seconds: 30,
      sceneCount: 3,
      sceneDuration: 10
    },
    '60s': {
      seconds: 60,
      sceneCount: 5,
      sceneDuration: 12
    },
    '90s': {
      seconds: 90,
      sceneCount: 7,
      sceneDuration: 13
    }
  },

  // 风格配置
  styles: {
    '解说': {
      promptPrefix: '请生成解说风格的短视频分镜',
      voiceType: 'BV001_streaming',
      speed: 1.0
    },
    '剧情': {
      promptPrefix: '请生成剧情风格的短视频分镜',
      voiceType: 'BV001_streaming',
      speed: 1.0
    },
    '口播': {
      promptPrefix: '请生成口播风格的短视频分镜',
      voiceType: 'BV001_streaming',
      speed: 1.1
    }
  },

  // API配置
  api: {
    // 豆包API
    doubao: {
      baseURL: 'ark.cn-beijing.volces.com',
      model: 'doubao-pro-32k',
      imageModel: 'doubao-image-generation',
      timeout: 60000
    },
    
    // 火山TTS API
    volcano: {
      baseURL: 'openspeech.bytedance.com',
      cluster: 'volcano_tts',
      timeout: 30000
    }
  },

  // 字幕配置
  subtitle: {
    // 默认字体大小
    fontSize: 24,
    
    // 字体颜色 (白色)
    primaryColor: '&H00FFFFFF',
    
    // 描边颜色 (黑色)
    outlineColor: '&H00000000',
    
    // 描边宽度
    outline: 2,
    
    // 对齐方式 (2=底部居中)
    alignment: 2,
    
    // 底部边距
    marginV: 50,
    
    // 最大行长度
    maxLineLength: 20
  },

  // 运镜效果配置
  camera: {
    effects: [
      {
        name: '缓慢放大',
        filter: "zoompan=z='min(zoom+0.0015,1.5)':d='{frames}':s=1080x1920"
      },
      {
        name: '缓慢缩小',
        filter: "zoompan=z='if(lte(onset,1),1.5,max(1.001,zoom-0.0015))':d='{frames}':s=1080x1920"
      },
      {
        name: '平移',
        filter: "zoompan=z='1.2':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d='{frames}':s=1080x1920"
      }
    ]
  },

  // 转场效果配置
  transition: {
    effects: ['fade', 'wipeleft', 'wiperight', 'slideleft', 'slideright'],
    duration: 0.5
  },

  // 日志配置
  log: {
    // 日志级别: debug, info, warn, error
    level: 'info',
    
    // 日志保留天数
    retainDays: 7
  }
}
