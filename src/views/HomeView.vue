/**
 * 首页 - 创意输入
 * 用户输入文案、选择时长和风格，开始生成
 */

<template>
  <div class="home-view">
    <div class="hero-section">
      <h1 class="hero-title">AI全自动短视频生成</h1>
      <p class="hero-subtitle">输入一条创意，全自动完成分镜、生图、配音、字幕、合成</p>
    </div>

    <el-card class="input-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><EditPen /></el-icon>
          <span>创意输入</span>
        </div>
      </template>

      <el-form :model="form" label-position="top" class="input-form">
        <!-- 文案输入 -->
        <el-form-item label="创意文案 / 脚本思路">
          <el-input
            v-model="form.script"
            type="textarea"
            :rows="6"
            placeholder="请输入你的创意文案或脚本思路，例如：一个关于城市夜景的治愈系短视频，展现繁华都市中的宁静时刻..."
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <!-- 时长选择 -->
          <el-col :span="12">
            <el-form-item label="视频时长">
              <el-radio-group v-model="form.duration" size="large">
                <el-radio-button label="30s">30秒</el-radio-button>
                <el-radio-button label="60s">60秒</el-radio-button>
                <el-radio-button label="90s">90秒</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <!-- 风格选择 -->
          <el-col :span="12">
            <el-form-item label="视频风格">
              <el-radio-group v-model="form.style" size="large">
                <el-radio-button label="解说">解说</el-radio-button>
                <el-radio-button label="剧情">剧情</el-radio-button>
                <el-radio-button label="口播">口播</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 输出目录 -->
        <el-form-item label="保存位置">
          <el-input
            v-model="form.outputDir"
            placeholder="选择视频保存目录"
            readonly
          >
            <template #append>
              <el-button @click="selectOutputDir">
                <el-icon><Folder /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <!-- 开始按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="generate-btn"
            :loading="store.isGenerating"
            :disabled="!canGenerate"
            @click="startGenerate"
          >
            <el-icon><VideoCamera /></el-icon>
            <span>{{ store.isGenerating ? '生成中...' : '开始生成视频' }}</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 功能特点 -->
    <el-row :gutter="20" class="features-row">
      <el-col :span="8">
        <div class="feature-item">
          <el-icon class="feature-icon"><MagicStick /></el-icon>
          <h3>AI智能分镜</h3>
          <p>自动拆分文案为专业分镜脚本</p>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="feature-item">
          <el-icon class="feature-icon"><Picture /></el-icon>
          <h3>AI生图</h3>
          <p>为每个镜头生成匹配的画面</p>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="feature-item">
          <el-icon class="feature-icon"><Microphone /></el-icon>
          <h3>智能配音</h3>
          <p>中文语音合成，自然流畅</p>
        </div>
      </el-col>
    </el-row>

    <!-- API配置提示 -->
    <el-alert
      v-if="!store.isConfigured"
      title="请先配置API密钥"
      description="首次使用需要配置豆包和火山引擎API密钥，点击右上角设置页面进行配置"
      type="warning"
      show-icon
      :closable="false"
      class="config-alert"
    />
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useAppStore()

const form = reactive({
  script: '',
  duration: '30s',
  style: '解说',
  outputDir: ''
})

const canGenerate = computed(() => {
  return form.script.trim().length > 0 && store.isConfigured && !store.isGenerating
})

async function selectOutputDir() {
  try {
    const dir = await window.electronAPI.selectOutputDir()
    if (dir) {
      form.outputDir = dir
    }
  } catch (e) {
    ElMessage.error('选择目录失败')
  }
}

async function startGenerate() {
  if (!form.script.trim()) {
    ElMessage.warning('请输入创意文案')
    return
  }

  if (!store.isConfigured) {
    ElMessage.warning('请先配置API密钥')
    router.push('/settings')
    return
  }

  // 启动生成任务
  store.startJob({ ...form })
  
  // 跳转到进度页面
  router.push('/progress')

  try {
    // 调用主进程生成视频
    const result = await window.electronAPI.generateVideo({
      script: form.script,
      duration: form.duration,
      style: form.style,
      outputDir: form.outputDir
    })

    if (result.success) {
      store.finishJob(true, result.outputPath)
      ElMessage.success('视频生成完成！')
    } else {
      store.finishJob(false)
      ElMessage.error(result.error || '生成失败')
    }
  } catch (error) {
    store.finishJob(false)
    ElMessage.error('生成过程出错: ' + error.message)
  }
}
</script>

<style scoped>
.home-view {
  max-width: 800px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  margin-bottom: 32px;
}

.hero-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.input-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.input-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--text-secondary);
}

.generate-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.features-row {
  margin-bottom: 24px;
}

.feature-item {
  text-align: center;
  padding: 24px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.feature-icon {
  font-size: 36px;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.feature-item h3 {
  font-size: 16px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.feature-item p {
  font-size: 12px;
  color: var(--text-muted);
}

.config-alert {
  margin-top: 16px;
}
</style>
