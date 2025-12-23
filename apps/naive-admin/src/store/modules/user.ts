/**
 * 用户状态管理模块
 * 提供用户登录、登出、用户基础信息等功能
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/request/api/users'
import type { SimpleUser } from '@/shared/users'
import type { Resource } from '@/shared/resource'
import { useMenuStore } from './menu'

export const useUserStore = defineStore(
  'user',
  () => {
    // ========================================    // 📊 状态定义
    // ========================================    // 用户信息
    const userInfo = ref<SimpleUser | null>(null)
    const authToken = ref<string | null>(null)
    // 用户资源列表
    const resources = ref<Resource[]>([])

    // 登录状态
    const isLoggedIn = computed(() => {
      return !!(authToken.value && userInfo.value)
    })

    // 用户基本信息
    const userProfile = computed(() => {
      if (!userInfo.value) return null

      return {
        id: userInfo.value.phone, // 使用phone作为用户ID
        username: userInfo.value.username,
        phone: userInfo.value.phone
      }
    })

    // ========================================
    // 🔐 用户认证相关方法
    // ========================================

    /**
     * 获取用户信息和权限树
     * @returns Promise<boolean> 获取是否成功
     */
    async function getProfile(): Promise<boolean> {
      try {
        const [profileResponse, error] = await getCurrentUser()

        if (error) {
          console.error('[User Store] Get profile failed:', error)
          return false
        }

        if (profileResponse && profileResponse.data) {
          // 更新用户信息
          userInfo.value = profileResponse.data.user || null
          // 更新用户资源
          resources.value = profileResponse.data.permissions?.resources || []

          // 更新菜单树
          const menuStore = useMenuStore()
          menuStore.updateMenuTree(profileResponse.data.permissions?.menuTree || [])

          return true
        }

        return false
      } catch (error) {
        console.error('[User Store] Get profile failed:', error)
        return false
      }
    }

    /**
     * 用户登录
     * @param phone 手机号
     * @param password 密码
     * @returns Promise<boolean> 登录是否成功
     */
    async function login(phone: string, password: string): Promise<boolean> {
      try {
        const [authResponse, error] = await apiLogin({
          phone,
          password
        })

        if (error) {
          return false
        }

        if (authResponse && authResponse.data) {
          // 更新用户信息（基础信息）
          userInfo.value = authResponse.data.user || null
          authToken.value = authResponse.data.token

          // 获取完整用户信息和权限树
          await getProfile()

          return true
        }

        return false
      } catch (error) {
        console.error('[User Store] Login failed:', error)
        return false
      }
    }

    /**
     * 用户登出
     */
    async function logout(): Promise<void> {
      try {
        // 调用登出API
        await apiLogout()
      } catch (error) {
        console.error('[User Store] Logout failed:', error)
      } finally {
        // 清除状态
        userInfo.value = null
        authToken.value = null
        resources.value = []

        // 重置菜单树
        const menuStore = useMenuStore()
        menuStore.resetMenuTree()
      }
    }

    /**
     * 检查登录状态
     */
    function checkLoginStatus(): boolean {
      return isLoggedIn.value && !!authToken.value
    }

    return {
      // 状态
      userInfo,
      authToken,
      resources,

      // 计算属性
      isLoggedIn,
      userProfile,

      // 认证方法
      login,
      logout,
      getProfile,
      checkLoginStatus
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage,
      pick: ['userInfo', 'authToken', 'isLoggedIn']
    }
  }
)
