/**
 * 用户认证 API 模块
 * 使用标准 HTTP/REST API，但保持 proto 类型定义
 */

import { post, get } from '../axios'
import type { EnumItem } from '@/shared/common'
import type { EnumResponse } from './common'
import type { AuthResponse, LoginRequest, RegisterRequest, GetUsersRequest, GetUsersResponse, ProfileResponse, SimpleUser } from '@/shared/users'
import type { Resource, ResourceTree } from '@/shared/resource'

// ========================================
// 🔐 用户认证相关类型（基于 proto 定义）
// ========================================

// 使用 proto 生成的类型
export type UserInfo = SimpleUser
export type LoginResponse = AuthResponse
export type LoginParams = Omit<LoginRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>
export type RegisterParams = Omit<RegisterRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>

// 用户配置文件响应类型
export interface UserProfileResponse {
  user: SimpleUser
  permissions: {
    menuTree: ResourceTree[]
    resources: Resource[]
  }
}

// 扩展的用户管理类型
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
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  return get<void, ProfileResponse>('/api/auth/profile')
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
  return get<void, UserInfo>('/api/users/detail', { params: { phone } })
}

/**
 * 新增人员（表单方式）
 */
export const createUserForm = async (params: CreateUserFormParams) => {
  return post<CreateUserFormParams, UserInfo>('/api/users/create', { data: params })
}

/**
 * 更新用户信息
 * POST /api/users/update Body: UpdateUserRequest & { phone: string }
 */
export const updateUser = async (params: UpdateUserParams) => {
  return post<UpdateUserParams, UserInfo>('/api/users/update', { data: params })
}

/**
 * 删除用户
 * POST /api/users/delete Body: { phone: string }
 */
export const deleteUser = async (phone: string) => {
  return post<{ phone: string }, void>('/api/users/delete', { data: { phone } })
}

/**
 * 分配用户角色
 * POST /api/users/roles Body: { phone: string; roleIds: string[] }
 */
export const assignUserRoles = async (phone: string, roleIds: string[]) => {
  return post<{ phone: string; roleIds: string[] }, { success: boolean; assignedCount: number }>('/api/users/roles', {
    data: { phone, roleIds }
  })
}

/**
 * 获取用户资源树
 * GET /api/users/resources?phone={phone}
 */
export const getUserResources = async (phone: string) => {
  return get<void, { tree: any[]; list: any[] }>('/api/users/resources', { params: { phone } })
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
  return post<UserStatusActionRequest & { phone: string }, UserInfo>('/api/users/update-status', { data: { phone, action } })
}
