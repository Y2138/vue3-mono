<template>
  <!-- 只在开发模式下显示 -->
  <div v-if="isDevelopment" class="api-status-floating">
    <motion.div
      :initial="{ x: 100, opacity: 0 }"
      :animate="{ x: 0, opacity: 1 }"
      :transition="{ duration: 0.5, ease: 'easeOut' }"
      class="floating-container"
    >
      <!-- 悬浮按钮 -->
      <motion.div
        :animate="buttonAnimateStyle"
        :transition="{ duration: 0.2, ease: 'easeInOut' }"
        class="floating-button"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="button-content">
          <!-- 状态指示器 -->
          <motion.div
            :animate="{ scale: isHovered ? 1.2 : 1 }"
            :transition="{ duration: 0.2 }"
            class="status-indicator"
            :style="{ backgroundColor: protocolStatusColor }"
          />
          <!-- 协议标识 -->
          <span class="protocol-text">{{ protocolLabel }}</span>
        </div>
      </motion.div>

      <!-- 详细面板 -->
      <motion.div
        v-show="isHovered"
        :initial="{ opacity: 0, scale: 0.8, x: 20 }"
        :animate="panelAnimateStyle"
        :exit="{ opacity: 0, scale: 0.8, x: 20 }"
        :transition="{ duration: 0.3, ease: 'backOut' }"
        class="detail-panel"
        @mouseenter="handlePanelMouseEnter"
        @mouseleave="handlePanelMouseLeave"
      >
        <!-- 协议状态 -->
        <div class="panel-section">
          <div class="section-title">协议状态</div>
          <div class="status-row">
            <n-tag :type="protocolTagType" size="small">
              {{ protocolLabel }}
            </n-tag>
            <n-tag :type="healthTagType" size="small">
              {{ healthLabel }}
            </n-tag>
          </div>
        </div>

        <!-- 使用统计 -->
        <div class="panel-section">
          <div class="section-title">使用统计</div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">调用</span>
              <span class="stat-value">{{ protocolUsageStats.totalCalls }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">成功率</span>
              <span class="stat-value">{{ protocolUsageStats.successRate }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">响应时间</span>
              <span class="stat-value">{{ protocolUsageStats.averageResponseTime }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="panel-section">
          <n-space :size="8" vertical>
            <n-button 
              size="small" 
              type="primary" 
              block
              ghost
              @click="handleToggleProtocol"
              :loading="isToggling"
            >
              🔄 切换到 {{ currentProtocol === 'http' ? 'gRPC' : 'HTTP' }}
            </n-button>
            
            <n-button 
              size="small" 
              type="default" 
              block
              ghost
              @click="showStatsModal = true"
            >
              📊 详细统计
            </n-button>
          </n-space>
        </div>
      </motion.div>
    </motion.div>

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
import { computed, ref, onUnmounted } from 'vue'
import { motion } from 'motion-v'
import { 
  NSpace, 
  NTag, 
  NButton, 
  NModal, 
  NStatistic, 
  NGrid, 
  NGi, 
  NDivider,
  useMessage 
} from 'naive-ui'
import { useGlobalStore } from '@/store/modules/global'

defineOptions({
  name: 'ApiStatus'
})

const message = useMessage()
const globalStore = useGlobalStore()

// 响应式状态
const isToggling = ref(false)
const showStatsModal = ref(false)
const isHovered = ref(false)
const hideTimer = ref<ReturnType<typeof setTimeout> | null>(null)

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

// 动画样式
const buttonAnimateStyle = computed(() => ({
  scale: isHovered.value ? 1.05 : 1,
  rotate: isHovered.value ? 5 : 0
}))

const panelAnimateStyle = computed(() => ({
  opacity: isHovered.value ? 1 : 0,
  scale: isHovered.value ? 1 : 0.8,
  x: isHovered.value ? 0 : 20
}))

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

// 悬停事件处理
const handleMouseEnter = () => {
  // 清除隐藏定时器
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
    hideTimer.value = null
  }
  isHovered.value = true
}

const handleMouseLeave = () => {
  // 延迟隐藏，给鼠标移动到面板留出时间
  hideTimer.value = setTimeout(() => {
    isHovered.value = false
    hideTimer.value = null
  }, 100) // 100ms 延迟
}

// 面板鼠标事件处理
const handlePanelMouseEnter = () => {
  // 鼠标进入面板时，取消隐藏
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
    hideTimer.value = null
  }
  isHovered.value = true
}

const handlePanelMouseLeave = () => {
  // 鼠标离开面板时，立即隐藏
  isHovered.value = false
}

// 组件销毁时清理定时器
onUnmounted(() => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
    hideTimer.value = null
  }
})
</script>

<style scoped>
/* 悬浮容器 */
.api-status-floating {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  z-index: 1000;
  pointer-events: auto;
}

.floating-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 悬浮按钮 */
.floating-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-button:hover {
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-bottom: 2px;
}

.protocol-text {
  font-size: 10px;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* 详细面板 */
.detail-panel {
  position: absolute;
  right: 72px;
  top: 0;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 
    0 16px 64px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 16px;
  font-size: 12px;
}

.panel-section {
  margin-bottom: 16px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.status-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 10px;
  color: #999;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
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
html[data-theme="dark"] .floating-button {
  background: linear-gradient(135deg, rgba(24, 24, 28, 0.95), rgba(24, 24, 28, 0.85));
  border-color: rgba(255, 255, 255, 0.1);
}

html[data-theme="dark"] .protocol-text {
  color: #ccc;
}

html[data-theme="dark"] .detail-panel {
  background: rgba(24, 24, 28, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

html[data-theme="dark"] .section-title {
  color: #ccc;
}

html[data-theme="dark"] .stat-item {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

html[data-theme="dark"] .stat-label {
  color: #999;
}

html[data-theme="dark"] .stat-value {
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .api-status-floating {
    right: 12px;
  }
  
  .detail-panel {
    width: 260px;
    right: 68px;
  }
  
  .floating-button {
    width: 48px;
    height: 48px;
  }
}
</style> 