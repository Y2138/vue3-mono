/**
 * 全局状态管理模块
 * 统一管理应用级别的状态、配置和协议切换
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { checkApiHealth as checkApiHealthApi } from '@/request/api/common'

// 扩展Window接口
declare global {
  interface Window {
    __API_CONFIG__: {
      useGrpc?: boolean
      debug?: boolean
      autoFallback?: boolean
    }
  }
}

// ========================================
// 🌍 全局状态管理 Store
// ========================================

export const useGlobalStore = defineStore('global', () => {
  // ========================================
  // 📊 状态定义
  // ========================================

  // 页面刷新控制
  const pageRefreshKey = ref(1)
  const refreshStatus = ref(false)

  // 主题管理
  const theme = ref<'light' | 'dark'>('light')

  // 应用配置
  const appConfig = ref({
    title: 'Vue3 Admin',
    version: '1.0.0',
    apiVersion: 'v1',
    environment: (import.meta as any).env?.MODE || 'development',
    debug: (import.meta as any).env?.DEV || false
  })

  // 协议配置
  const protocolConfig = ref({
    useGrpc: (import.meta as any).env?.VITE_USE_GRPC === 'true',
    grpcEndpoint: (import.meta as any).env?.VITE_GRPC_ENDPOINT || 'http://localhost:5000',
    apiUrl: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000',
    apiDebug: (import.meta as any).env?.VITE_API_DEBUG === 'true'
  })

  // 加载状态
  const isLoading = ref(false)
  const isInitializing = ref(false)

  // 网络状态
  const isOnline = ref(navigator.onLine)
  const networkError = ref<string | null>(null)

  // 应用健康状态
  const healthStatus = ref({
    api: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
    lastCheck: 0
  })

  // 协议使用统计
  const protocolStats = ref({
    httpCalls: 0,
    grpcCalls: 0,
    totalCalls: 0,
    successRate: 0,
    averageResponseTime: 0,
    lastUpdated: Date.now()
  })

  // ========================================
  // 🧮 计算属性
  // ========================================

  // 是否为开发环境
  const isDevelopment = computed(() => appConfig.value.environment === 'development')

  // 是否启用调试
  const isDebugEnabled = computed(() => appConfig.value.debug || protocolConfig.value.apiDebug)

  // 应用是否健康
  const isAppHealthy = computed(() => {
    return healthStatus.value.api === 'healthy'
  })

  // 当前使用的协议
  const currentProtocol = computed(() => {
    if (!isOnline.value) return 'offline'
    return protocolConfig.value.useGrpc ? 'grpc' : 'http'
  })

  // 协议使用统计
  const protocolUsageStats = computed(() => {
    const { httpCalls, grpcCalls, totalCalls, successRate } = protocolStats.value

    return {
      httpUsage: totalCalls > 0 ? ((httpCalls / totalCalls) * 100).toFixed(1) : '0',
      grpcUsage: totalCalls > 0 ? ((grpcCalls / totalCalls) * 100).toFixed(1) : '0',
      totalCalls,
      successRate: `${(successRate * 100).toFixed(1)}%`,
      averageResponseTime: `${protocolStats.value.averageResponseTime.toFixed(0)}ms`
    }
  })

  // ========================================
  // 🎨 主题管理
  // ========================================

  /**
   * 切换主题
   */
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'

    // 保存到本地存储
    localStorage.setItem('app_theme', theme.value)

    // 应用主题到文档
    applyThemeToDocument()
  }

  /**
   * 设置主题
   */
  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
    localStorage.setItem('app_theme', newTheme)
    applyThemeToDocument()
  }

  /**
   * 应用主题到文档
   */
  function applyThemeToDocument() {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme.value)
      document.documentElement.classList.toggle('dark', theme.value === 'dark')
    }
  }

  /**
   * 从本地存储恢复主题
   */
  function restoreTheme() {
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark' | null
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      theme.value = savedTheme
    } else {
      // 检测系统主题偏好
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        theme.value = prefersDark ? 'dark' : 'light'
      }
    }
    applyThemeToDocument()
  }

  // ========================================
  // 🔄 页面刷新控制
  // ========================================

  /**
   * 设置刷新状态
   * @param status 刷新状态
   * @param options 可选配置
   */
  function setRefreshStatus(status: boolean, options?: { from?: string }) {
    refreshStatus.value = status
    if (options?.from && isDebugEnabled.value) {
      console.log(`[Global Store] Refresh status set to ${status} from ${options.from}`)
    }
  }

  /**
   * 执行刷新
   */
  function refresh() {
    refreshPage()
  }

  /**
   * 刷新页面内容
   */
  function refreshPage() {
    pageRefreshKey.value++
  }

  /**
   * 强制刷新（重新初始化）
   */
  async function forceRefresh() {
    isLoading.value = true

    try {
      // 刷新页面
      refreshPage()

      // 重新初始化
      await initialize()
    } catch (error) {
      console.error('[Global Store] Force refresh failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  // ========================================
  // 🏥 健康检查
  // ========================================

  /**
   * 检查应用健康状态
   */
  async function checkHealth(): Promise<void> {
    try {
      await checkApiHealth()
      healthStatus.value.lastCheck = Date.now()
    } catch (error) {
      console.error('[Global Store] Health check failed:', error)
    }
  }

  /**
   * 检查API健康状态
   */
  async function checkApiHealth(): Promise<void> {
    try {
      const [healthData, error] = await checkApiHealthApi()
      if (error || !healthData) {
        healthStatus.value.api = 'unhealthy'
        console.warn('[Global Store] API health check failed:', error)
        return
      }
      healthStatus.value.api = healthData.data?.status || 'unknown'
    } catch (error) {
      healthStatus.value.api = 'unhealthy'
      console.warn('[Global Store] API health check failed:', error)
    }
  }

  // ========================================
  // 📊 协议管理和统计
  // ========================================

  /**
   * 更新协议使用统计
   */
  function updateProtocolStats(protocol: 'http' | 'grpc', responseTime: number, success: boolean) {
    if (protocol === 'http') {
      protocolStats.value.httpCalls++
    } else {
      protocolStats.value.grpcCalls++
    }

    protocolStats.value.totalCalls++

    // 计算成功率
    const currentSuccess = protocolStats.value.successRate * (protocolStats.value.totalCalls - 1)
    protocolStats.value.successRate = (currentSuccess + (success ? 1 : 0)) / protocolStats.value.totalCalls

    // 计算平均响应时间
    const currentAverage = protocolStats.value.averageResponseTime
    const totalCalls = protocolStats.value.totalCalls
    protocolStats.value.averageResponseTime = (currentAverage * (totalCalls - 1) + responseTime) / totalCalls

    protocolStats.value.lastUpdated = Date.now()
  }

  /**
   * 重置协议统计
   */
  function resetProtocolStats() {
    protocolStats.value = {
      httpCalls: 0,
      grpcCalls: 0,
      totalCalls: 0,
      successRate: 0,
      averageResponseTime: 0,
      lastUpdated: Date.now()
    }
  }

  /**
   * 切换协议
   */
  function toggleProtocol() {
    protocolConfig.value.useGrpc = !protocolConfig.value.useGrpc

    // 保存到本地存储
    localStorage.setItem('protocol_config', JSON.stringify(protocolConfig.value))

    // 通知API适配器更新配置
    if (typeof window !== 'undefined') {
      window.__API_CONFIG__ = {
        ...window.__API_CONFIG__,
        useGrpc: protocolConfig.value.useGrpc
      }
    }

    // 重新检查健康状态
    checkHealth()
  }

  // ========================================
  // 🌐 网络状态监控
  // ========================================

  /**
   * 监听网络状态变化
   */
  function setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      const updateOnlineStatus = () => {
        isOnline.value = navigator.onLine
        if (isOnline.value) {
          networkError.value = null
          checkHealth() // 网络恢复时检查健康状态
        } else {
          networkError.value = '网络连接已断开'
        }
      }

      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
    }
  }

  // ========================================
  // 🚀 初始化和配置
  // ========================================

  /**
   * 初始化全局状态
   */
  async function initialize(): Promise<void> {
    try {
      isInitializing.value = true

      // 恢复主题
      restoreTheme()

      // 恢复协议配置
      restoreProtocolConfig()

      // 设置网络监听
      setupNetworkListeners()

      // 检查健康状态
      await checkHealth()

      console.log('[Global Store] Initialized successfully')
    } catch (error) {
      console.error('[Global Store] Initialization failed:', error)
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * 更新协议配置
   */
  function updateProtocolConfig(config: Partial<typeof protocolConfig.value>) {
    protocolConfig.value = {
      ...protocolConfig.value,
      ...config
    }

    // 保存到本地存储
    localStorage.setItem('protocol_config', JSON.stringify(protocolConfig.value))

    // 更新全局配置
    if (typeof window !== 'undefined') {
      window.__API_CONFIG__ = {
        ...window.__API_CONFIG__,
        ...config
      }
    }

    // 重新检查健康状态
    checkHealth()
  }

  /**
   * 恢复协议配置
   */
  function restoreProtocolConfig() {
    try {
      const saved = localStorage.getItem('protocol_config')
      if (saved) {
        const config = JSON.parse(saved)
        protocolConfig.value = {
          ...protocolConfig.value,
          ...config
        }
      }

      // 初始化全局配置
      if (typeof window !== 'undefined') {
        window.__API_CONFIG__ = {
          useGrpc: protocolConfig.value.useGrpc,
          debug: protocolConfig.value.apiDebug,
          autoFallback: true
        }
      }
    } catch (error) {
      console.warn('[Global Store] Restore protocol config failed:', error)
    }
  }

  // ========================================
  // 🔄 自动初始化
  // ========================================

  // 自动初始化
  initialize()

  // 定期健康检查（每5分钟）
  if (typeof window !== 'undefined') {
    setInterval(checkHealth, 5 * 60 * 1000)
  }

  // ========================================
  // 📤 导出
  // ========================================

  return {
    // 状态
    pageRefreshKey: readonly(pageRefreshKey),
    refreshStatus: readonly(refreshStatus),
    theme: readonly(theme),
    appConfig: readonly(appConfig),
    protocolConfig: readonly(protocolConfig),
    isLoading: readonly(isLoading),
    isInitializing: readonly(isInitializing),
    isOnline: readonly(isOnline),
    networkError: readonly(networkError),
    healthStatus: readonly(healthStatus),
    protocolStats: readonly(protocolStats),

    // 计算属性
    isDevelopment,
    isDebugEnabled,
    isAppHealthy,
    currentProtocol,
    protocolUsageStats,

    // 主题方法
    toggleTheme,
    setTheme,
    restoreTheme,

    // 页面控制
    setRefreshStatus,
    refresh,
    refreshPage,
    forceRefresh,

    // 健康检查
    checkHealth,
    checkApiHealth,

    // 协议管理
    updateProtocolStats,
    resetProtocolStats,
    toggleProtocol,

    // 配置管理
    updateProtocolConfig,
    initialize
  }
})
