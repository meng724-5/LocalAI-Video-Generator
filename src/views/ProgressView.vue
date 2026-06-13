/**
 * 进度面板
 * 展示视频生成各阶段进度和实时日志
 */

<template>
  <div class="progress-view">
    <h2 class="page-title">生成进度</h2>

    <!-- 进度概览 -->
    <el-card class="progress-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Loading v-if="store.isGenerating" class="rotating" /></el-icon>
          <span>{{ store.isGenerating ? '正在生成...' : '生成状态' }}</span>
        </div>
      </template>

      <!-- 总体进度条 -->
      <div class="overall-progress">
        <el-progress
          :percentage="store.progress.percent"
          :status="progressStatus"
          :stroke-width="20"
          :text-inside="true"
        />
        <p class="progress-message">{{ store.progress.message || '等待开始...' }}</p>
      </div>

      <!-- 各阶段状态 -->
      <el-steps :active="currentStep" finish-status="success" class="steps">
        <el-step title="文案拆分" description="AI分镜" />
        <el-step title="素材生成" description="AI生图" />
        <el-step title="配音生成" description="TTS合成" />
        <el-step title="字幕合成" description="Whisper识别" />
        <el-step title="视频导出" description="FFmpeg合成" />
      </el-steps>
    </el-card>

    <!-- 实时日志 -->
    <el-card class="log-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>实时日志</span>
          <el-button
            v-if="store.logs.length > 0"
            type="primary"
            link
            size="small"
            @click="store.clearLogs"
          >
            清空
          </el-button>
        </div>
      </template>

      <div ref="logContainer" class="log-container">
        <div
          v-for="(log, index) in store.logs"
          :key="index"
          class="log-item"
          :class="`log-${log.type}`"
        >
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="store.logs.length === 0" class="log-empty">
          暂无日志，等待任务开始...
        </div>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button
        v-if="store.progress.stage === 'complete'"
        type="primary"
        size="large"
        @click="goToPreview"
      >
        <el-icon><VideoPlay /></el-icon>
        查看视频
      </el-button>
      
      <el-button
        v-if="store.progress.stage === 'error'"
        type="warning"
        size="large"
        @click="goToHome"
      >
        <el-icon><RefreshRight /></el-icon>
        重新生成
      </el-button>

      <el-button
        v-if="!store.isGenerating && store.progress.stage !== 'complete'"
        type="primary"
        size="large"
        @click="goToHome"
      >
        <el-icon><EditPen /></el-icon>
        返回输入
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores'

const router = useRouter()
const store = useAppStore()
const logContainer = ref(null)

// 当前步骤索引
const currentStep = computed(() => {
  const stageMap = {
    'script-split': 0,
    'image-gen': 1,
    'tts': 2,
    'subtitle': 3,
    'compose': 4,
    'complete': 5
  }
  return stageMap[store.progress.stage] ?? -1
})

// 进度条状态
const progressStatus = computed(() => {
  if (store.progress.stage === 'error') return 'exception'
  if (store.progress.stage === 'complete') return 'success'
  return ''
})

// 监听日志变化，自动滚动到底部
watch(() => store.logs.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})

// 监听进度更新
function handleProgressUpdate(data) {
  store.setProgress(data.stage, data.percent, data.message)
}

onMounted(() => {
  // 注册进度监听
  window.electronAPI.onProgressUpdate(handleProgressUpdate)
})

onUnmounted(() => {
  // 移除进度监听
  window.electronAPI.removeProgressListener()
})

function goToPreview() {
  router.push('/preview')
}

function goToHome() {
  store.resetJob()
  router.push('/')
}
</script>

<style scoped>
.progress-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.progress-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.overall-progress {
  margin-bottom: 32px;
}

.progress-message {
  text-align: center;
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.steps {
  margin-top: 24px;
}

.log-card {
  margin-bottom: 24px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid var(--border-color);
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--text-muted);
  margin-right: 12px;
}

.log-message {
  color: var(--text-primary);
}

.log-error .log-message {
  color: var(--danger-color);
}

.log-warning .log-message {
  color: var(--warning-color);
}

.log-success .log-message {
  color: var(--success-color);
}

.log-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 24px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
