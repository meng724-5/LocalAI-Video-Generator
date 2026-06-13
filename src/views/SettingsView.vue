/**
 * 设置页面
 * 配置豆包API Key、火山语音API密钥，密钥本地加密保存
 */

<template>
  <div class="settings-view">
    <h2 class="page-title">API设置</h2>

    <el-card class="settings-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Key /></el-icon>
          <span>API密钥配置</span>
        </div>
      </template>

      <el-alert
        title="密钥安全说明"
        description="API密钥将使用AES-256加密后保存在本地，不会上传到任何服务器。请妥善保管您的密钥。"
        type="info"
        show-icon
        :closable="false"
        class="security-alert"
      />

      <el-form :model="form" label-position="top" class="settings-form">
        <!-- 豆包API Key -->
        <el-form-item label="豆包开放平台 API Key">
          <template #label>
            <div class="label-with-link">
              <span>豆包开放平台 API Key</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="openLink('https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey')"
              >
                获取密钥
              </el-button>
            </div>
          </template>
          <el-input
            v-model="form.doubaoApiKey"
            type="password"
            placeholder="请输入豆包API Key"
            show-password
          />
          <div class="field-hint">用于文案拆分和AI图片生成</div>
        </el-form-item>

        <!-- 火山App ID -->
        <el-form-item label="火山引擎 App ID">
          <template #label>
            <div class="label-with-link">
              <span>火山引擎 App ID</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="openLink('https://console.volcengine.com/speech/service/8')"
              >
                获取AppID
              </el-button>
            </div>
          </template>
          <el-input
            v-model="form.volcanoAppId"
            placeholder="请输入火山引擎App ID"
          />
          <div class="field-hint">语音合成服务的应用ID</div>
        </el-form-item>

        <!-- 火山API Key -->
        <el-form-item label="火山引擎 API Key">
          <template #label>
            <div class="label-with-link">
              <span>火山引擎 API Key</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="openLink('https://console.volcengine.com/speech/service/8')"
              >
                获取密钥
              </el-button>
            </div>
          </template>
          <el-input
            v-model="form.volcanoApiKey"
            type="password"
            placeholder="请输入火山引擎API Key"
            show-password
          />
          <div class="field-hint">用于中文语音合成（TTS）</div>
        </el-form-item>

        <!-- 保存按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="save-btn"
            :loading="saving"
            @click="saveSettings"
          >
            <el-icon><Check /></el-icon>
            保存配置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- API申请教程 -->
    <el-card class="tutorial-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Reading /></el-icon>
          <span>API申请教程</span>
        </div>
      </template>

      <el-collapse>
        <el-collapse-item title="1. 豆包开放平台 API Key 申请" name="1">
          <ol class="tutorial-list">
            <li>访问 <el-button type="primary" link @click="openLink('https://www.volcengine.com/product/doubao')">豆包开放平台</el-button></li>
            <li>注册/登录字节火山引擎账号</li>
            <li>进入控制台，找到"方舟大模型"服务</li>
            <li>创建API Key，复制保存</li>
            <li>确保账户有余额或免费额度</li>
          </ol>
        </el-collapse-item>

        <el-collapse-item title="2. 火山引擎语音合成 API 申请" name="2">
          <ol class="tutorial-list">
            <li>访问 <el-button type="primary" link @click="openLink('https://www.volcengine.com/product/speech')">火山语音合成</el-button></li>
            <li>登录火山引擎账号（与豆包通用）</li>
            <li>进入语音合成控制台，创建应用</li>
            <li>获取 App ID 和 API Key</li>
            <li>开通语音合成服务权限</li>
          </ol>
        </el-collapse-item>

        <el-collapse-item title="3. 费用说明" name="3">
          <ul class="tutorial-list">
            <li>豆包大模型：新用户有免费额度，后续按token计费</li>
            <li>豆包生图：按生成次数计费</li>
            <li>火山TTS：新用户有免费额度，后续按字符数计费</li>
            <li>建议先充值少量金额测试使用</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useAppStore } from '../stores'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const saving = ref(false)

const form = reactive({
  doubaoApiKey: '',
  volcanoApiKey: '',
  volcanoAppId: ''
})

onMounted(async () => {
  // 加载已保存的配置（解密后的）
  try {
    const config = await window.electronAPI.getDecryptedConfig()
    if (config) {
      form.doubaoApiKey = config.doubaoApiKey || ''
      form.volcanoApiKey = config.volcanoApiKey || ''
      form.volcanoAppId = config.volcanoAppId || ''
    }
  } catch (e) {
    console.log('加载配置失败', e)
  }
})

async function saveSettings() {
  if (!form.doubaoApiKey || !form.volcanoApiKey || !form.volcanoAppId) {
    ElMessage.warning('请填写所有API密钥')
    return
  }

  saving.value = true
  try {
    const success = await window.electronAPI.saveConfig({
      doubaoApiKey: form.doubaoApiKey,
      volcanoApiKey: form.volcanoApiKey,
      volcanoAppId: form.volcanoAppId
    })

    if (success) {
      store.setConfig({ ...form })
      ElMessage.success('配置保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('保存出错: ' + e.message)
  } finally {
    saving.value = false
  }
}

function openLink(url) {
  window.electronAPI.openExternal(url)
}
</script>

<style scoped>
.settings-view {
  max-width: 700px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.settings-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.security-alert {
  margin-bottom: 24px;
}

.settings-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.label-with-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.field-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.save-btn {
  width: 100%;
  height: 44px;
}

.tutorial-card {
  margin-bottom: 24px;
}

.tutorial-list {
  padding-left: 20px;
  line-height: 2;
  color: var(--text-secondary);
}

.tutorial-list li {
  margin-bottom: 4px;
}
</style>
