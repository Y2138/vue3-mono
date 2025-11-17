/**
 * 认证相关的组合式函数
 * 提供登录、登出、状态管理等功能
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store/modules/user'
import type { LoginParams } from '@/request/api/users'

export function useAuth() {
  // ========================================
  // 🔧 依赖注入
  // ========================================

  const router = useRouter()
  const message = useMessage()
  const userStore = useUserStore()

  // ========================================
  // 📊 响应式状态
  // ========================================

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ========================================
  // 💡 计算属性
  // ========================================

  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const currentUser = computed(() => userStore.userProfile)
  const userRoles = computed(() => userStore.userRoles)

  // ========================================
  // 🎯 认证方法
  // ========================================

  /**
   * 用户登录
   */
  const login = async (credentials: LoginParams, rememberMe = false) => {
    try {
      isLoading.value = true
      error.value = null

      // 调用用户存储的登录方法
      const success = await userStore.login(credentials.phone, credentials.password)

      if (!success) {
        throw new Error(userStore.loginError || '登录失败')
      }

      // 处理记住我功能
      if (rememberMe) {
        localStorage.setItem('remembered_phone', credentials.phone)
      } else {
        localStorage.removeItem('remembered_phone')
      }

      return true
    } catch (err: any) {
      error.value = err.message || '登录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 用户登出
   */
  const logout = async (showMessage = true) => {
    try {
      isLoading.value = true
      error.value = null

      // 调用用户存储的登出方法
      await userStore.logout()

      if (showMessage) {
        message.success('已安全退出')
      }

      // 跳转到登录页
      await router.push('/login')

      return true
    } catch (err: any) {
      error.value = err.message || '登出失败'
      if (showMessage) {
        message.error(error.value || '')
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 检查认证状态
   */
  const checkAuth = async () => {
    try {
      if (!userStore.authToken) {
        return false
      }

      // 如果有token但没有用户信息，尝试获取用户信息
      if (!userStore.userInfo) {
        await userStore.fetchUserInfo()
      }

      return userStore.isLoggedIn
    } catch (err) {
      console.error('Auth check failed:', err)
      return false
    }
  }

  /**
   * 刷新用户信息
   */
  const refreshUser = async () => {
    try {
      isLoading.value = true
      error.value = null

      const success = await userStore.fetchUserInfo(undefined, true)
      if (!success) {
        throw new Error(userStore.userError || '刷新用户信息失败')
      }
      return true
    } catch (err: any) {
      error.value = err.message || '刷新用户信息失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null
  }

  // ========================================
  // 🔒 权限检查方法
  // ========================================

  /**
   * 检查用户是否有指定角色
   */
  const hasRole = (roleId: string) => {
    return userRoles.value.includes(roleId)
  }

  /**
   * 检查用户是否有任意一个角色
   */
  const hasAnyRole = (roleIds: string[]) => {
    return roleIds.some((roleId) => userRoles.value.includes(roleId))
  }

  /**
   * 检查用户是否有所有角色
   */
  const hasAllRoles = (roleIds: string[]) => {
    return roleIds.every((roleId) => userRoles.value.includes(roleId))
  }

  // ========================================
  // 🔄 返回接口
  // ========================================

  return {
    // 状态
    isLoading,
    error,
    isLoggedIn,
    currentUser,
    userRoles,

    // 认证方法
    login,
    logout,
    checkAuth,
    refreshUser,
    clearError,

    // 权限方法
    hasRole,
    hasAnyRole,
    hasAllRoles
  }
}

// ========================================
// 🔧 验证工具函数
// ========================================

/**
 * 验证手机号格式
 */
function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证密码强度
 */
function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: '密码长度不能少于6位' }
  }

  if (password.length > 50) {
    return { isValid: false, message: '密码长度不能超过50位' }
  }

  // 可以添加更多密码强度检查
  // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
  //   return { isValid: false, message: '密码必须包含大小写字母和数字' }
  // }

  return { isValid: true }
}

/**
 * 表单验证相关的组合式函数
 */
export function useAuthValidation() {
  /**
   * 获取手机号验证规则
   */
  const getPhoneRules = () => [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve()
        return validatePhone(value) ? Promise.resolve() : Promise.reject(new Error('请输入正确的手机号格式'))
      },
      trigger: ['blur', 'input']
    }
  ]

  /**
   * 获取密码验证规则
   */
  const getPasswordRules = () => [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (_: any, value: string) => {
        if (!value) return Promise.resolve()
        const result = validatePassword(value)
        return result.isValid ? Promise.resolve() : Promise.reject(new Error(result.message))
      },
      trigger: ['blur', 'input']
    }
  ]

  return {
    validatePhone,
    validatePassword,
    getPhoneRules,
    getPasswordRules
  }
}
