/**
 * 全局状态管理模块
 * 统一管理应用级别的状态、配置和协议切换
 */

import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

// 扩展Window接口
declare global {
  interface Window {
    __API_CONFIG__: {
      debug?: boolean
      timeout?: number
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

  // API 配置
  const apiConfig = ref({
    apiUrl: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000',
    apiTimeout: (import.meta as any).env?.VITE_API_TIMEOUT || 10000,
    apiDebug: (import.meta as any).env?.VITE_API_DEBUG === 'true'
  })

  // 枚举数据管理
  const enumsMap = ref<Record<string, any>>({})
  const enumsRequestMap = ref<Record<string, any>>({})

  const setEnums = (key: string, value: any) => {
    enumsMap.value[key] = value
  }

  const getEnums = (key: string) => {
    return enumsMap.value[key]
  }

  const clearEnums = (key: string) => {
    delete enumsMap.value[key]
  }

  const setEnumsRequest = (key: string, value: any) => {
    enumsRequestMap.value[key] = value
  }

  const getEnumsRequest = (key: string) => {
    return enumsRequestMap.value[key]
  }

  const clearEnumsRequest = (key: string) => {
    delete enumsRequestMap.value[key]
  }

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

  // 加载状态
  const isLoading = ref(false)
  const isInitializing = ref(false)
  /**
   * 设置刷新状态
   * @param status 刷新状态
   * @param options 可选配置
   */
  function setRefreshStatus(status: boolean, options?: { from?: string }) {
    refreshStatus.value = status
    if (options?.from && apiConfig.value.apiDebug) {
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

      console.log('[Global Store] Initialized successfully')
    } catch (error) {
      console.error('[Global Store] Initialization failed:', error)
    } finally {
      isInitializing.value = false
    }
  }

  // ========================================
  // 🔄 自动初始化
  // ========================================

  // 自动初始化
  initialize()

  // ========================================
  // 📤 导出
  // ========================================

  return {
    // 状态
    pageRefreshKey: readonly(pageRefreshKey),
    refreshStatus: readonly(refreshStatus),
    theme: readonly(theme),
    appConfig: readonly(appConfig),
    apiConfig: readonly(apiConfig),
    isLoading: readonly(isLoading),
    isInitializing: readonly(isInitializing),

    // 主题方法
    toggleTheme,
    setTheme,
    restoreTheme,

    // 页面控制
    setRefreshStatus,
    refresh,
    refreshPage,
    forceRefresh,

    initialize,

    // 枚举数据管理
    setEnums,
    getEnums,
    clearEnums,
    setEnumsRequest,
    getEnumsRequest,
    clearEnumsRequest
  }
})
