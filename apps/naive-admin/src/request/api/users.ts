/**
 * 用户认证 API 模块
 * 使用标准 HTTP/REST API，但保持 proto 类型定义
 */

import { post, get, patch } from '../axios'
import type { User, AuthResponse, LoginRequest, RegisterRequest, GetUsersRequest, GetUsersResponse } from '@/shared/users'
import type { EnumItem, EnumResponse } from './common'

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

export interface CreateUserFormParams {
  phone: string
  username: string
}

export interface UpdateUserParams {
  phone: string
  username?: string
  status?: number
  roleIds?: string[]
}

export interface UpdateUserStatusParams {
  phone: string
  status: number // 1-待激活，2-激活，3-下线，4-锁定
}

export interface DeleteUserParams {
  phone: string
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
export const getUserEnums = async (): Promise<{ data: Record<string, EnumItem[]>; error?: any }> => {
  try {
    const [result, error] = await get<void, EnumResponse>('/api/users/enums')

    if (error) {
      return { data: {}, error }
    }
    if (result?.data) {
      return {
        data: result.data.enums
      }
    }
    return { data: {} }
  } catch (error) {
    return { data: {}, error }
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
 * 创建用户（完整信息）
 */
export const createUser = async (params: CreateUserParams) => {
  return post<CreateUserParams, UserInfo>('/api/users', { data: params })
}

/**
 * 新增人员（表单方式）
 */
export const createUserForm = async (params: CreateUserFormParams) => {
  return post<CreateUserFormParams, UserInfo>('/api/users/add', { data: params })
}

/**
 * 更新用户信息
 */
export const updateUser = async (params: UpdateUserParams) => {
  return post<UpdateUserParams, UserInfo>('/api/users/update', { data: params })
}

/**
 * 删除用户
 */
export const deleteUser = async (phone: string) => {
  return post<DeleteUserParams, void>('/api/users/delete', { data: { phone } })
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
// 🔄 用户状态操作 API
// ========================================

/**
 * 用户状态操作请求类型
 */
export interface UserStatusActionRequest {
  /** 操作类型：activate-激活，deactivate-下线，lock-锁定，unlock-解锁 */
  action: 'activate' | 'deactivate' | 'lock' | 'unlock'
}

/**
 * 统一的用户状态操作接口
 */
export const updateUserStatusByAction = async (phone: string, action: UserStatusActionRequest['action']) => {
  return post<UserStatusActionRequest, UserInfo>(`/api/users/${phone}/status`, { data: { action } })
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
