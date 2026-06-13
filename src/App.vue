/**
 * 根组件
 * 包含导航栏、主题切换、路由视图
 */

<template>
  <div class="app-container" :data-theme="store.theme">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="header-left">
        <el-icon class="logo-icon"><VideoCamera /></el-icon>
        <span class="app-title">LocalAI Video Generator</span>
      </div>
      
      <div class="header-center">
        <el-menu
          :default-active="$route.path"
          mode="horizontal"
          router
          class="nav-menu"
          background-color="transparent"
          text-color="var(--text-secondary)"
          active-text-color="var(--primary-color)"
        >
          <el-menu-item index="/">
            <el-icon><EditPen /></el-icon>
            <span>创意输入</span>
          </el-menu-item>
          <el-menu-item index="/progress">
            <el-icon><Loading /></el-icon>
            <span>生成进度</span>
          </el-menu-item>
          <el-menu-item index="/preview">
            <el-icon><VideoPlay /></el-icon>
            <span>视频预览</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>API设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="header-right">
        <el-switch
          v-model="isDarkTheme"
          active-text="暗"
          inactive-text="亮"
          inline-prompt
          @change="toggleTheme"
        />
      </div>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <!-- 底部状态栏 -->
    <el-footer class="app-footer">
      <div class="footer-left">
        <el-tag v-if="store.isConfigured" type="success" size="small">API已配置</el-tag>
        <el-tag v-else type="warning" size="small">API未配置</el-tag>
      </div>
      <div class="footer-center">
        <span v-if="store.isGenerating" class="status-text">
          <el-icon class="rotating"><Loading /></el-icon>
          {{ store.progressStageText }} {{ store.progress.percent }}%
        </span>
      </div>
      <div class="footer-right">
        <span class="version">v1.0.0</span>
      </div>
    </el-footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from './stores'

const store = useAppStore()
const isDarkTheme = ref(false)

function toggleTheme() {
  store.toggleTheme()
}

onMounted(async () => {
  // 加载配置
  try {
    const config = await window.electronAPI.getConfig()
    store.setConfig(config)
  } catch (e) {
    console.log('加载配置失败', e)
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  color: var(--primary-color);
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-menu {
  border-bottom: none;
}

.nav-menu :deep(.el-menu-item) {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

.app-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 40px;
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-muted);
}

.status-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--primary-color);
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.version {
  color: var(--text-muted);
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
