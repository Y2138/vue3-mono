/**
 * 用户状态管理模块
 * 提供用户登录、登出、用户基础信息等功能
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout } from '@/request/api/users'
import type { User } from '@/shared/users'

export const useUserStore = defineStore(
  'user',
  () => {
    // ========================================
    // 📊 状态定义
    // ========================================

    // 用户信息
    const userInfo = ref<User | null>(null)
    const authToken = ref<string | null>(null)

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
        phone: userInfo.value.phone,
        createdAt: userInfo.value.createdAt,
        updatedAt: userInfo.value.updatedAt,
        roleIds: userInfo.value.roleIds
      }
    })

    // ========================================
    // 🔐 用户认证相关方法
    // ========================================

    /**
     * 用户登录
     * @param phone 手机号
     * @param password 密码
     * @returns Promise<boolean> 登录是否成功
     */
    async function login(phone: string, password: string): Promise<boolean> {
      try {
        const [authResponse, error] = await apiLogin({ phone, password })

        if (error) {
          return false
        }

        if (authResponse && authResponse.data && authResponse.data.user) {
          userInfo.value = authResponse.data.user
          authToken.value = authResponse.data.token

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

        // 清除状态
        userInfo.value = null
        authToken.value = null
      } catch (error) {
        console.error('[User Store] Logout failed:', error)
        // 即使API调用失败，也要清除本地状态
        userInfo.value = null
        authToken.value = null
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
      userInfo: userInfo,
      authToken: authToken,

      // 计算属性
      isLoggedIn,
      userProfile,

      // 认证方法
      login,
      logout,
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
