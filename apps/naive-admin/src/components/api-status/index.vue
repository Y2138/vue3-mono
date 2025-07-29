<template>
  <div class="api-status-panel">
    <!-- 协议状态显示 -->
    <div class="protocol-status">
      <n-space align="center" :size="8">
        <n-icon :size="16" :color="protocolStatusColor">
          <div class="status-dot"></div>
        </n-icon>
        <span class="protocol-label">协议:</span>
        <n-tag :type="protocolTagType" size="small">
          {{ protocolLabel }}
        </n-tag>
        
        <!-- 健康状态 -->
        <n-tag :type="healthTagType" size="small">
          {{ healthLabel }}
        </n-tag>
      </n-space>
    </div>

    <!-- 开发模式：协议控制 -->
    <div v-if="isDevelopment" class="protocol-controls">
      <n-space :size="8">
        <n-button 
          size="small" 
          type="primary" 
          ghost
          @click="handleToggleProtocol"
          :loading="isToggling"
        >
          🔄 切换到 {{ currentProtocol === 'http' ? 'gRPC' : 'HTTP' }}
        </n-button>
        
        <n-button 
          size="small" 
          type="default" 
          ghost
          @click="showStatsModal = true"
        >
          📊 统计
        </n-button>
      </n-space>
    </div>

    <!-- 简化统计显示 -->
    <div v-if="isDevelopment" class="usage-stats-mini">
      <n-space :size="12">
        <span class="stat-item">
          <span class="stat-label">调用:</span>
          <span class="stat-value">{{ protocolUsageStats.totalCalls }}</span>
        </span>
        <span class="stat-item">
          <span class="stat-label">成功率:</span>
          <span class="stat-value">{{ protocolUsageStats.successRate }}</span>
        </span>
        <span class="stat-item">
          <span class="stat-label">响应时间:</span>
          <span class="stat-value">{{ protocolUsageStats.averageResponseTime }}</span>
        </span>
      </n-space>
    </div>

    <!-- 详细统计模态框 -->
    <n-modal v-model:show="showStatsModal" preset="card" title="API 协议使用统计" style="width: 600px;">
      <div class="stats-detail">
        <n-grid :cols="2" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-statistic label="HTTP 调用次数" :value="httpCalls" />
          </n-gi>
          <n-gi>
            <n-statistic label="gRPC 调用次数" :value="grpcCalls" />
          </n-gi>
          <n-gi>
            <n-statistic label="总调用次数" :value="protocolUsageStats.totalCalls" />
          </n-gi>
          <n-gi>
            <n-statistic label="成功率" :value="protocolUsageStats.successRate" />
          </n-gi>
          <n-gi>
            <n-statistic label="平均响应时间" :value="protocolUsageStats.averageResponseTime" />
          </n-gi>
          <n-gi>
            <n-statistic label="HTTP 使用率" :value="protocolUsageStats.httpUsage + '%'" />
          </n-gi>
        </n-grid>

        <n-divider />

        <div class="stats-actions">
          <n-space>
            <n-button type="primary" ghost @click="handleResetStats">
              重置统计
            </n-button>
            <n-button type="default" @click="showStatsModal = false">
              关闭
            </n-button>
          </n-space>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  NSpace, 
  NTag, 
  NButton, 
  NIcon, 
  NModal, 
  NStatistic, 
  NGrid, 
  NGi, 
  NDivider,
  useMessage 
} from 'naive-ui'
// 使用简单的文本图标，避免额外依赖
import { useGlobalStore } from '@/store/modules/global'

defineOptions({
  name: 'ApiStatus'
})

const message = useMessage()
const globalStore = useGlobalStore()

// 响应式状态
const isToggling = ref(false)
const showStatsModal = ref(false)

// 计算属性
const isDevelopment = computed(() => globalStore.isDevelopment)
const currentProtocol = computed(() => globalStore.currentProtocol)
const protocolUsageStats = computed(() => globalStore.protocolUsageStats)
const isAppHealthy = computed(() => globalStore.isAppHealthy)

// 协议显示标签
const protocolLabel = computed(() => {
  switch (currentProtocol.value) {
    case 'http': return 'HTTP'
    case 'grpc': return 'gRPC'
    case 'offline': return '离线'
    default: return '未知'
  }
})

// 协议标签类型
const protocolTagType = computed(() => {
  switch (currentProtocol.value) {
    case 'http': return 'info'
    case 'grpc': return 'success'
    case 'offline': return 'warning'
    default: return 'default'
  }
})

// 健康状态
const healthLabel = computed(() => {
  return isAppHealthy.value ? '健康' : '异常'
})

const healthTagType = computed(() => {
  return isAppHealthy.value ? 'success' : 'error'
})

// 状态指示器颜色
const protocolStatusColor = computed(() => {
  if (!isAppHealthy.value) return '#ff4757'
  switch (currentProtocol.value) {
    case 'http': return '#2f54eb'
    case 'grpc': return '#52c41a'
    case 'offline': return '#fa8c16'
    default: return '#8c8c8c'
  }
})

// 统计数据
const httpCalls = computed(() => globalStore.protocolStats?.httpCalls || 0)
const grpcCalls = computed(() => globalStore.protocolStats?.grpcCalls || 0)

// 方法
const handleToggleProtocol = async () => {
  try {
    isToggling.value = true
    globalStore.toggleProtocol()
    message.success(`已切换到 ${currentProtocol.value === 'http' ? 'HTTP' : 'gRPC'} 协议`)
  } catch (error) {
    console.error('协议切换失败:', error)
    message.error('协议切换失败')
  } finally {
    isToggling.value = false
  }
}

const handleResetStats = () => {
  globalStore.resetProtocolStats()
  message.success('统计数据已重置')
  showStatsModal.value = false
}
</script>

<style scoped>
.api-status-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  backdrop-filter: blur(4px);
}

.protocol-status {
  display: flex;
  align-items: center;
}

.protocol-label {
  color: #666;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
}

.protocol-controls {
  display: flex;
  align-items: center;
}

.usage-stats-mini {
  display: flex;
  align-items: center;
  padding-left: 12px;
  border-left: 1px solid #e0e0e0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  color: #999;
  font-size: 11px;
}

.stat-value {
  color: #333;
  font-weight: 600;
  font-size: 11px;
}

.stats-detail {
  padding: 16px 0;
}

.stats-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* 深色主题适配 */
html[data-theme="dark"] .api-status-panel {
  background: rgba(24, 24, 28, 0.8);
  border-color: #333;
}

html[data-theme="dark"] .protocol-label {
  color: #ccc;
}

html[data-theme="dark"] .usage-stats-mini {
  border-left-color: #333;
}

html[data-theme="dark"] .stat-label {
  color: #999;
}

html[data-theme="dark"] .stat-value {
  color: #fff;
}
</style> 