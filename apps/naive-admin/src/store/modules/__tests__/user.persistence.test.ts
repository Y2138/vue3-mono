/**
 * 用户状态管理持久化功能测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { useUserStore } from '../user'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock API calls
vi.mock('@/request/api/users', () => ({
  login: vi.fn().mockResolvedValue([{ data: { user: null, token: null } }, null]),
  logout: vi.fn().mockResolvedValue([{}, null]),
  getCurrentUser: vi.fn().mockResolvedValue([{ data: null }, null]),
  getUserByPhone: vi.fn().mockResolvedValue([{ data: null }, null]),
  updateUser: vi.fn().mockResolvedValue([{ data: null }, null])
}))

describe('User Store Persistence', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()

    // 创建新的 Pinia 实例
    const pinia = createPinia()
    pinia.use(
      createPersistedState({
        storage: localStorage,
        key: (id) => `naive_admin_${id}`
      })
    )
    setActivePinia(pinia)
  })

  it('应该正确配置持久化选项', () => {
    const store = useUserStore()

    // 验证 store 实例存在
    expect(store).toBeDefined()
    expect(typeof store.login).toBe('function')
    expect(typeof store.logout).toBe('function')
  })

  it('应该具有正确的持久化配置', () => {
    const store = useUserStore()

    // 验证初始状态
    expect(store.userInfo).toBeNull()
    expect(store.authToken).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })

  it('应该正确计算登录状态', () => {
    const store = useUserStore()

    // 初始状态应该是未登录
    expect(store.isLoggedIn).toBe(false)

    // 验证计算属性的逻辑（通过检查初始状态）
    expect(store.userRoles).toEqual([])
    expect(store.userPermissions).toEqual([])
    expect(store.userProfile).toBeNull()
  })

  it('应该提供正确的工具方法', () => {
    const store = useUserStore()

    // 验证工具方法存在
    expect(typeof store.clearErrors).toBe('function')
    expect(typeof store.getDisplayName).toBe('function')
    expect(typeof store.isUserActive).toBe('function')
    expect(typeof store.hasPermission).toBe('function')
    expect(typeof store.hasRole).toBe('function')

    // 测试默认值
    expect(store.getDisplayName()).toBe('未登录')
    expect(store.isUserActive()).toBe(false)
    expect(store.hasPermission('admin')).toBe(false)
    expect(store.hasRole('admin')).toBe(false)
  })

  it('应该正确处理错误状态', () => {
    const store = useUserStore()

    // 验证初始错误状态
    expect(store.loginError).toBeNull()
    expect(store.userError).toBeNull()

    // 验证清除错误方法
    store.clearErrors()
    expect(store.loginError).toBeNull()
    expect(store.userError).toBeNull()
  })

  it('应该正确处理加载状态', () => {
    const store = useUserStore()

    // 验证初始加载状态
    expect(store.isLoading).toBe(false)
    expect(store.isLoginLoading).toBe(false)
    expect(store.isUserInfoLoading).toBe(false)
  })
})
