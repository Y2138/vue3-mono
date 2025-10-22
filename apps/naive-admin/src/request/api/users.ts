/**
 * 用户认证 API 模块
 * 使用标准 HTTP/REST API，但保持 proto 类型定义
 */

import { post, get, put, del, patch } from '../axios'
import type { User, AuthResponse, LoginRequest, RegisterRequest, GetUsersRequest, GetUsersResponse } from '@/shared/users'
// 使用 proto 生成的类型
import type { EnumResponse as ProtoEnumResponse, EnumItem } from '@/shared/common'

// 前端使用的枚举响应接口（转换后的）
export interface EnumResponse {
  domain: string
  enums: Record<string, Record<string, EnumItem>>
  version?: string
}

// ========================================
// 🔐 用户认证相关类型（基于 proto 定义）
// ========================================

// 使用 proto 生成的类型
export type UserInfo = User
export type LoginResponse = AuthResponse
export type LoginParams = Omit<LoginRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>
export type RegisterParams = Omit<RegisterRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>

// 扩展的用户管理类型
export interface CreateUserParams {
  phone: string
  username: string
  password: string
  roleIds?: string[]
}

export interface UpdateUserParams {
  phone: string // 用于路径参数
  username?: string
  isActive?: boolean
  roleIds?: string[]
}

export interface UserListParams {
  page?: number
  pageSize?: number
  keyword?: string
  isActive?: boolean
}

export interface UserListResponse {
  tableData: UserInfo[]
  pageData: {
    count: number
    page: number
    pageSize: number
  }
}

// ========================================
// 🔐 用户认证 API
// ========================================

/**
 * 用户登录
 */
export const login = async (params: LoginParams) => {
  return post<LoginParams, LoginResponse>('/api/auth/login', { data: params })
}

/**
 * 用户注册
 */
export const register = async (params: RegisterParams) => {
  return post<RegisterParams, LoginResponse>('/api/auth/register', { data: params })
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  return get<void, UserInfo>('/api/auth/profile')
}

/**
 * 用户登出
 */
export const logout = async () => {
  return post<void, void>('/api/auth/logout', {})
}

// ========================================
// 👥 用户管理 API
// ========================================

/**
 * 获取用户模块枚举
 */
export const getUserEnums = async (): Promise<{ data: EnumResponse; error?: any }> => {
  try {
    const [result, error] = await get<void, ProtoEnumResponse>('/api/users/enums')

    if (error) {
      return { data: { domain: '', enums: {} }, error }
    }

    if (result?.data) {
      // proto 的 map 类型在 ts-proto 中生成为普通对象，直接转换 items
      const convertedEnums: Record<string, Record<string, EnumItem>> = {}

      for (const [key, config] of Object.entries(result.data.enums)) {
        convertedEnums[key] = config.items
      }

      return {
        data: {
          domain: result.data.domain,
          enums: convertedEnums,
          version: result.data.version
        }
      }
    }

    return { data: { domain: '', enums: {} } }
  } catch (error) {
    return { data: { domain: '', enums: {} }, error }
  }
}

/**
 * 获取用户列表
 */
export const getUserList = async (params?: GetUsersRequest) => {
  return get<void, GetUsersResponse>('/api/users/list', { params })
}

/**
 * 根据手机号获取用户详情
 */
export const getUserByPhone = async (phone: string) => {
  return get<void, UserInfo>(`/api/users/${phone}`)
}

/**
 * 创建用户
 */
export const createUser = async (params: CreateUserParams) => {
  return post<CreateUserParams, UserInfo>('/api/users', { data: params })
}

/**
 * 更新用户信息
 */
export const updateUser = async (params: UpdateUserParams) => {
  const { phone, ...updateData } = params
  return put<Omit<UpdateUserParams, 'phone'>, UserInfo>(`/api/users/${phone}`, { data: updateData })
}

/**
 * 删除用户
 */
export const deleteUser = async (phone: string) => {
  return del<void, void>(`/api/users/${phone}`)
}

/**
 * 批量删除用户
 */
export const batchDeleteUsers = async (phones: string[]) => {
  return post<{ phones: string[] }, void>('/api/users/batch-delete', { data: { phones } })
}

/**
 * 激活/停用用户
 */
export const toggleUserStatus = async (phone: string, isActive: boolean) => {
  return patch<{ isActive: boolean }, UserInfo>(`/api/users/${phone}/status`, { data: { isActive } })
}

/**
 * 重置用户密码
 */
export const resetUserPassword = async (phone: string, newPassword: string) => {
  return patch<{ password: string }, void>(`/api/users/${phone}/password`, { data: { password: newPassword } })
}

/**
 * 为用户分配角色
 */
export const assignUserRoles = async (phone: string, roleIds: string[]) => {
  return patch<{ roleIds: string[] }, UserInfo>(`/api/users/${phone}/roles`, { data: { roleIds } })
}

/**
 * 获取用户的角色列表
 */
export const getUserRoles = async (phone: string) => {
  return get<void, string[]>(`/api/users/${phone}/roles`)
}

// ========================================
// 📊 用户统计 API
// ========================================

/**
 * 获取用户统计信息
 */
export const getUserStats = async () => {
  return get<
    void,
    {
      totalUsers: number
      activeUsers: number
      inactiveUsers: number
      newUsersToday: number
    }
  >('/api/users/stats')
}

/**
 * 检查手机号是否已存在
 */
export const checkPhoneExists = async (phone: string) => {
  return get<void, { exists: boolean }>(`/api/users/check-phone/${phone}`)
}

/**
 * 检查用户名是否已存在
 */
export const checkUsernameExists = async (username: string) => {
  return get<void, { exists: boolean }>(`/api/users/check-username/${username}`)
}
