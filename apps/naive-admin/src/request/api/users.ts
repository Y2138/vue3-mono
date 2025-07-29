/**
 * 用户认证 API 模块
 * 基于简化的 API 适配器实现
 */

import { apiCall } from '../api-adapter'
import type { UnifiedApiResponse } from './common'

// ========================================
// 🔐 用户认证相关类型
// ========================================

export interface LoginParams {
  phone: string
  password: string
}

export interface UserInfo {
  id: string
  username: string
  phone: string
  email?: string
  avatar?: string
  roles: string[]
  permissions: string[]
  createTime: string
  updateTime: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: UserInfo
  expiresIn: number
}

export interface CreateUserParams {
  username: string
  phone: string
  email?: string
  password: string
  roles?: string[]
}

export interface UpdateUserParams {
  id: string
  username?: string
  email?: string
  phone?: string
  avatar?: string
  roles?: string[]
}

// ========================================
// 🔐 用户认证 API
// ========================================

/**
 * 用户登录
 * @param phone 手机号
 * @param password 密码
 * @returns Promise<[UserInfo | null, Error | null]>
 */
export async function userLogin(
  phone: string, 
  password: string
): Promise<UnifiedApiResponse<LoginResponse>> {
  const loginData = {
    phone,
    password,
    deviceInfo: {
      platform: 'web',
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    }
  }

  const result = await apiCall<LoginResponse>('POST /auth/login', loginData)
  
  // 登录成功后保存 token
  const [data, _error] = result
  if (data && data.token) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }
  }

  return result
}

/**
 * 用户登出
 */
export async function userLogout(): Promise<UnifiedApiResponse<void>> {
  const result = await apiCall<void>('POST /auth/logout', {})
  
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('refreshToken')
  
  return result
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<UnifiedApiResponse<UserInfo>> {
  return apiCall<UserInfo>('GET /auth/me', {})
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<UnifiedApiResponse<{ token: string; expiresIn: number }>> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    return [null, new Error('没有有效的刷新令牌')]
  }

  const result = await apiCall<{ token: string; expiresIn: number }>('POST /auth/refresh', {
    refreshToken
  })

  // 更新本地存储的 token
  const [data, _error] = result
  if (data && data.token) {
    localStorage.setItem('token', data.token)
  }

  return result
}

/**
 * 检查登录状态
 */
export function isLoggedIn(): boolean {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  return !!(token && user)
}

/**
 * 获取本地存储的用户信息
 */
export function getLocalUserInfo(): UserInfo | null {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * 获取本地存储的 Token
 */
export function getLocalToken(): string | null {
  return localStorage.getItem('token')
}

// ========================================
// 👥 用户管理 API
// ========================================

/**
 * 获取用户列表
 */
export async function getUserList(params: {
  page?: number
  pageSize?: number
  keyword?: string
}): Promise<UnifiedApiResponse<{
  items: UserInfo[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}>> {
  return apiCall('GET /users', params)
}

/**
 * 根据ID获取用户详情
 */
export async function getUserById(id: string): Promise<UnifiedApiResponse<UserInfo>> {
  return apiCall<UserInfo>(`GET /users/${id}`, {})
}

/**
 * 创建用户
 */
export async function createUser(params: CreateUserParams): Promise<UnifiedApiResponse<UserInfo>> {
  return apiCall<UserInfo>('POST /users', params)
}

/**
 * 更新用户信息
 */
export async function updateUser(params: UpdateUserParams): Promise<UnifiedApiResponse<UserInfo>> {
  const { id, ...updateData } = params
  return apiCall<UserInfo>(`PUT /users/${id}`, updateData)
}

/**
 * 删除用户
 */
export async function deleteUser(id: string): Promise<UnifiedApiResponse<void>> {
  return apiCall<void>(`DELETE /users/${id}`, {})
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(id: string, newPassword: string): Promise<UnifiedApiResponse<void>> {
  return apiCall<void>('POST /users/reset-password', {
    userId: id,
    newPassword
  })
}

/**
 * 修改当前用户密码
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<UnifiedApiResponse<void>> {
  return apiCall<void>('POST /auth/change-password', {
    oldPassword,
    newPassword
  })
}

/**
 * 更新用户头像
 */
export async function updateUserAvatar(userId: string, avatar: string): Promise<UnifiedApiResponse<UserInfo>> {
  return apiCall<UserInfo>('PUT /users/avatar', {
    userId,
    avatar
  })
}

// ========================================
// 🔧 用户工具函数
// ========================================

/**
 * 检查用户是否有指定角色
 */
export function hasRole(role: string, userInfo?: UserInfo): boolean {
  const user = userInfo || getLocalUserInfo()
  if (!user) return false
  return user.roles.includes(role)
}

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(permission: string, userInfo?: UserInfo): boolean {
  const user = userInfo || getLocalUserInfo()
  if (!user) return false
  return user.permissions.includes(permission)
}

/**
 * 检查用户是否有任意一个指定权限
 */
export function hasAnyPermission(permissions: string[], userInfo?: UserInfo): boolean {
  return permissions.some(permission => hasPermission(permission, userInfo))
}

/**
 * 检查用户是否有所有指定权限
 */
export function hasAllPermissions(permissions: string[], userInfo?: UserInfo): boolean {
  return permissions.every(permission => hasPermission(permission, userInfo))
}

/**
 * 检查用户是否为管理员
 */
export function isAdmin(userInfo?: UserInfo): boolean {
  return hasRole('admin', userInfo) || hasRole('super_admin', userInfo)
}

/**
 * 格式化用户显示名称
 */
export function formatUserDisplayName(user: UserInfo): string {
  return user.username || user.phone || user.email || '未知用户'
}

/**
 * 验证手机号格式
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  isValid: boolean
  message: string
} {
  if (password.length < 6) {
    return { isValid: false, message: '密码长度不能少于6位' }
  }
  
  if (password.length > 20) {
    return { isValid: false, message: '密码长度不能超过20位' }
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { 
      isValid: false, 
      message: '密码必须包含大写字母、小写字母和数字' 
    }
  }
  
  return { isValid: true, message: '密码强度合格' }
} 