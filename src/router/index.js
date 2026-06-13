/**
 * Vue Router 配置
 * 定义应用路由：首页、进度、设置、预览
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '创意输入' }
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import('../views/ProgressView.vue'),
    meta: { title: '生成进度' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { title: 'API设置' }
  },
  {
    path: '/preview',
    name: 'preview',
    component: () => import('../views/PreviewView.vue'),
    meta: { title: '视频预览' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
