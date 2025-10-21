/**
 * 权限管理 API 模块
 * 使用标准 HTTP/REST API，但保持 proto 类型定义
 */

import { get, post, put, del } from '../axios'
import type { Permission, Role, CreatePermissionRequest, UpdatePermissionRequest, CreateRoleRequest, UpdateRoleRequest, CheckPermissionRequest, CheckPermissionResponse } from '@/shared/rbac'

// ========================================
// 🔒 权限管理相关类型（基于 proto 定义）
// ========================================

// 使用 proto 生成的类型，去除方法
export type PermissionInfo = Permission
export type RoleInfo = Role

export type CreatePermissionParams = Omit<CreatePermissionRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>
export type UpdatePermissionParams = Omit<UpdatePermissionRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>
export type CreateRoleParams = Omit<CreateRoleRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>
export type UpdateRoleParams = Omit<UpdateRoleRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>
export type CheckPermissionParams = Omit<CheckPermissionRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>

// 扩展的查询参数类型
export interface GetPermissionsParams {
  page?: number
  pageSize?: number
  keyword?: string
  resource?: string
  action?: string
}

export interface GetRolesParams {
  page?: number
  pageSize?: number
  keyword?: string
  includePermissions?: boolean
}

export interface PermissionListResponse {
  permissions: PermissionInfo[]
  total: number
  page: number
  pageSize: number
}

export interface RoleListResponse {
  roles: RoleInfo[]
  total: number
  page: number
  pageSize: number
}

// ========================================
// 🔒 权限管理 API
// ========================================

/**
 * 获取权限列表
 */
export const getPermissions = async (params?: GetPermissionsParams) => {
  return get<void, PermissionListResponse>('/api/permissions', { params })
}

/**
 * 根据ID获取权限详情
 */
export const getPermissionById = async (id: string) => {
  return get<void, PermissionInfo>(`/api/permissions/${id}`)
}

/**
 * 创建权限
 */
export const createPermission = async (params: CreatePermissionParams) => {
  return post<CreatePermissionParams, PermissionInfo>('/api/permissions', { data: params })
}

/**
 * 更新权限
 */
export const updatePermission = async (params: UpdatePermissionParams) => {
  const { id, ...updateData } = params
  return put<Omit<UpdatePermissionParams, 'id'>, PermissionInfo>(`/api/permissions/${id}`, { data: updateData })
}

/**
 * 删除权限
 */
export const deletePermission = async (id: string) => {
  return del<void, void>(`/api/permissions/${id}`)
}

/**
 * 批量删除权限
 */
export const batchDeletePermissions = async (ids: string[]) => {
  return post<{ ids: string[] }, void>('/api/permissions/batch-delete', { data: { ids } })
}

// ========================================
// 👥 角色管理 API
// ========================================

/**
 * 获取角色列表
 */
export const getRoles = async (params?: GetRolesParams) => {
  return get<void, RoleListResponse>('/api/roles', { params })
}

/**
 * 根据ID获取角色详情
 */
export const getRoleById = async (id: string) => {
  return get<void, RoleInfo>(`/api/roles/${id}`)
}

/**
 * 创建角色
 */
export const createRole = async (params: CreateRoleParams) => {
  return post<CreateRoleParams, RoleInfo>('/api/roles', { data: params })
}

/**
 * 更新角色
 */
export const updateRole = async (params: UpdateRoleParams) => {
  const { id, ...updateData } = params
  return put<Omit<UpdateRoleParams, 'id'>, RoleInfo>(`/api/roles/${id}`, { data: updateData })
}

/**
 * 删除角色
 */
export const deleteRole = async (id: string) => {
  return del<void, void>(`/api/roles/${id}`)
}

/**
 * 批量删除角色
 */
export const batchDeleteRoles = async (ids: string[]) => {
  return post<{ ids: string[] }, void>('/api/roles/batch-delete', { data: { ids } })
}

/**
 * 为角色分配权限
 */
export const assignRolePermissions = async (roleId: string, permissionIds: string[]) => {
  return post<{ permissionIds: string[] }, RoleInfo>(`/api/roles/${roleId}/permissions`, { data: { permissionIds } })
}

/**
 * 移除角色权限
 */
export const removeRolePermissions = async (roleId: string, permissionIds: string[]) => {
  return del<{ permissionIds: string[] }, RoleInfo>(`/api/roles/${roleId}/permissions`, { data: { permissionIds } })
}

/**
 * 获取角色的权限列表
 */
export const getRolePermissions = async (roleId: string) => {
  return get<void, PermissionInfo[]>(`/api/roles/${roleId}/permissions`)
}

// ========================================
// 🔐 权限检查 API
// ========================================

/**
 * 检查当前用户是否有指定权限
 */
export const checkPermission = async (params: CheckPermissionParams) => {
  return post<CheckPermissionParams, CheckPermissionResponse>('/api/auth/check-permission', { data: params })
}

/**
 * 批量检查权限
 */
export const batchCheckPermissions = async (permissions: CheckPermissionParams[]) => {
  return post<{ permissions: CheckPermissionParams[] }, CheckPermissionResponse[]>('/api/auth/batch-check-permissions', { data: { permissions } })
}

/**
 * 获取当前用户的所有权限
 */
export const getCurrentUserPermissions = async () => {
  return get<void, PermissionInfo[]>('/api/auth/permissions')
}

/**
 * 获取当前用户的所有角色
 */
export const getCurrentUserRoles = async () => {
  return get<void, RoleInfo[]>('/api/auth/roles')
}

// ========================================
// 📊 权限统计 API
// ========================================

/**
 * 获取权限统计信息
 */
export const getPermissionStats = async () => {
  return get<
    void,
    {
      totalPermissions: number
      totalRoles: number
      activeRoles: number
      permissionsByResource: Record<string, number>
    }
  >('/api/permissions/stats')
}

/**
 * 获取角色统计信息
 */
export const getRoleStats = async () => {
  return get<
    void,
    {
      totalRoles: number
      rolesWithUsers: number
      averagePermissionsPerRole: number
      topRolesByUserCount: Array<{ roleId: string; roleName: string; userCount: number }>
    }
  >('/api/roles/stats')
}
