/**
 * 预览窗口
 * 生成完成后预览成品视频，支持导出到自定义路径
 */

<template>
  <div class="preview-view">
    <h2 class="page-title">视频预览</h2>

    <!-- 视频播放器 -->
    <el-card class="preview-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><VideoPlay /></el-icon>
          <span>成品视频</span>
        </div>
      </template>

      <div v-if="store.currentVideo" class="video-container">
        <video
          ref="videoPlayer"
          class="video-player"
          controls
          :src="videoUrl"
        />
      </div>

      <el-empty
        v-else
        description="暂无视频，请先生成"
        class="empty-state"
      >
        <el-button type="primary" @click="goToHome">
          去生成视频
        </el-button>
      </el-empty>
    </el-card>

    <!-- 视频信息 -->
    <el-card v-if="store.currentVideo" class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><InfoFilled /></el-icon>
          <span>视频信息</span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="文件路径">
          <div class="path-cell">
            <span class="file-path">{{ store.currentVideo }}</span>
            <el-button
              type="primary"
              link
              size="small"
              @click="showInFolder"
            >
              打开目录
            </el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="分辨率">1080 x 1920 (9:16)</el-descriptions-item>
        <el-descriptions-item label="格式">MP4</el-descriptions-item>
        <el-descriptions-item label="编码">H.264 + AAC</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 操作按钮 -->
    <div v-if="store.currentVideo" class="action-buttons">
      <el-button
        type="primary"
        size="large"
        @click="goToHome"
      >
        <el-icon><RefreshRight /></el-icon>
        再生成一个
      </el-button>

      <el-button
        type="success"
        size="large"
        @click="showInFolder"
      >
        <el-icon><FolderOpened /></el-icon>
        打开文件位置
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useAppStore()
const videoPlayer = ref(null)

// 视频URL（使用file协议）
const videoUrl = computed(() => {
  if (store.currentVideo) {
    return 'file://' + store.currentVideo
  }
  return ''
})

function goToHome() {
  store.resetJob()
  router.push('/')
}

function showInFolder() {
  if (store.currentVideo) {
    window.electronAPI.showItemInFolder(store.currentVideo)
  }
}
</script>

<style scoped>
.preview-view {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.preview-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.video-container {
  display: flex;
  justify-content: center;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  max-width: 100%;
  max-height: 70vh;
  aspect-ratio: 9/16;
}

.empty-state {
  padding: 60px 0;
}

.info-card {
  margin-bottom: 24px;
}

.path-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.file-path {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
