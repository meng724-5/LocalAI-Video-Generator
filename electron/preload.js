/**
 * Electron 预加载脚本
 * 提供安全的IPC通信桥接，隔离渲染进程与主进程
 */

const { contextBridge, ipcRenderer } = require('electron')

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 配置管理
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getDecryptedConfig: () => ipcRenderer.invoke('get-decrypted-config'),

  // 视频生成
  generateVideo: (params) => ipcRenderer.invoke('generate-video', params),

  // 进度监听
  onProgressUpdate: (callback) => {
    ipcRenderer.on('progress-update', (event, data) => callback(data))
  },
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('progress-update')
  },

  // 文件操作
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  getVideoPreview: (path) => ipcRenderer.invoke('get-video-preview', path),
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),

  // 外部链接
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
})
