/**
 * Pinia 全局状态管理
 * 管理应用配置、生成任务状态、主题设置
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const config = ref({
    doubaoApiKey: '',
    volcanoApiKey: '',
    volcanoAppId: '',
    outputDir: ''
  })
  
  const isGenerating = ref(false)
  const currentJob = ref(null)
  const progress = ref({
    stage: '',
    percent: 0,
    message: ''
  })
  const logs = ref([])
  const theme = ref('light')
  const currentVideo = ref('')

  // 计算属性
  const isConfigured = computed(() => {
    return config.value.doubaoApiKey && 
           config.value.volcanoApiKey && 
           config.value.volcanoAppId
  })

  const progressStageText = computed(() => {
    const stageMap = {
      'script-split': '文案拆分',
      'image-gen': '素材生成',
      'tts': '配音生成',
      'subtitle': '字幕合成',
      'compose': '视频导出',
      'complete': '完成',
      'error': '出错'
    }
    return stageMap[progress.value.stage] || '准备中'
  })

  // 方法
  function setConfig(newConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  function addLog(message, type = 'info') {
    logs.value.push({
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    })
    // 保留最近200条日志
    if (logs.value.length > 200) {
      logs.value = logs.value.slice(-200)
    }
  }

  function clearLogs() {
    logs.value = []
  }

  function setProgress(stage, percent, message) {
    progress.value = { stage, percent, message }
    if (message) {
      addLog(message, stage === 'error' ? 'error' : 'info')
    }
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  function startJob(params) {
    isGenerating.value = true
    currentJob.value = params
    logs.value = []
    progress.value = { stage: 'start', percent: 0, message: '开始生成...' }
  }

  function finishJob(success, outputPath = '') {
    isGenerating.value = false
    if (success) {
      currentVideo.value = outputPath
      progress.value = { stage: 'complete', percent: 100, message: '生成完成！' }
    }
  }

  function resetJob() {
    isGenerating.value = false
    currentJob.value = null
    progress.value = { stage: '', percent: 0, message: '' }
    logs.value = []
  }

  return {
    config,
    isGenerating,
    currentJob,
    progress,
    logs,
    theme,
    currentVideo,
    isConfigured,
    progressStageText,
    setConfig,
    addLog,
    clearLogs,
    setProgress,
    setTheme,
    toggleTheme,
    startJob,
    finishJob,
    resetJob
  }
})
