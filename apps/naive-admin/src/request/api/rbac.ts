/**
 * 权限管理 API 模块
 * 基于简化的 API 适配器实现
 */

import { apiCall } from '../api-adapter'
import type { UnifiedApiResponse } from './common'

// ========================================
// 🔒 权限管理相关类型
// ========================================

export interface Permission {
  id: string
  name: string
  code: string
  description?: string
  resource: string
  action: string
  category?: string
  createTime: string
  updateTime: string
}

export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: string[]
  userCount?: number
  createTime: string
  updateTime: string
}

export interface GetPermissionsParams {
  page?: number
  pageSize?: number
  keyword?: string
  category?: string
  resource?: string
}

export interface GetRolesParams {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface CreatePermissionParams {
  name: string
  code: string
  description?: string
  resource: string
  action: string
  category?: string
}

export interface UpdatePermissionParams {
  id: string
  name?: string
  code?: string
  description?: string
  resource?: string
  action?: string
  category?: string
}

export interface CreateRoleParams {
  name: string
  code: string
  description?: string
  permissions: string[]
}

export interface UpdateRoleParams {
  id: string
  name?: string
  code?: string
  description?: string
  permissions?: string[]
}

// ========================================
// 🔒 权限管理 API
// ========================================

/**
 * 获取权限列表
 */
export async function getPermissions(
  params: GetPermissionsParams = {}
): Promise<UnifiedApiResponse<{
  items: Permission[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}>> {
  return apiCall('GET /permissions', params)
}

/**
 * 根据ID获取权限详情
 */
export async function getPermissionById(id: string): Promise<UnifiedApiResponse<Permission>> {
  return apiCall<Permission>(`GET /permissions/${id}`, {})
}

/**
 * 创建权限
 */
export async function createPermission(params: CreatePermissionParams): Promise<UnifiedApiResponse<Permission>> {
  return apiCall<Permission>('POST /permissions', params)
}

/**
 * 更新权限
 */
export async function updatePermission(params: UpdatePermissionParams): Promise<UnifiedApiResponse<Permission>> {
  const { id, ...updateData } = params
  return apiCall<Permission>(`PUT /permissions/${id}`, updateData)
}

/**
 * 删除权限
 */
export async function deletePermission(id: string): Promise<UnifiedApiResponse<void>> {
  return apiCall<void>(`DELETE /permissions/${id}`, {})
}

/**
 * 批量删除权限
 */
export async function batchDeletePermissions(ids: string[]): Promise<UnifiedApiResponse<void>> {
  return apiCall<void>('DELETE /permissions/batch', { ids })
}

// ========================================
// 👥 角色管理 API
// ========================================

/**
 * 获取角色列表
 */
export async function getRoles(
  params: GetRolesParams = {}
): Promise<UnifiedApiResponse<{
  items: Role[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}>> {
  return apiCall('GET /roles', params)
}

/**
 * 根据ID获取角色详情
 */
export async function getRoleById(id: string): Promise<UnifiedApiResponse<Role>> {
  return apiCall<Role>(`GET /roles/${id}`, {})
}

/**
 * 创建角色
 */
export async function createRole(params: CreateRoleParams): Promise<UnifiedApiResponse<Role>> {
  return apiCall<Role>('POST /roles', params)
}

/**
 * 更新角色
 */
export async function updateRole(params: UpdateRoleParams): Promise<UnifiedApiResponse<Role>> {
  const { id, ...updateData } = params
  return apiCall<Role>(`PUT /roles/${id}`, updateData)
}

/**
 * 删除角色
 */
export async function deleteRole(id: string): Promise<UnifiedApiResponse<void>> {
  return apiCall<void>(`DELETE /roles/${id}`, {})
}

/**
 * 批量删除角色
 */
export async function batchDeleteRoles(ids: string[]): Promise<UnifiedApiResponse<void>> {
  return apiCall<void>('DELETE /roles/batch', { ids })
}

// ========================================
// 🔗 权限检查 API
// ========================================

/**
 * 检查单个权限
 */
export async function checkPermission(
  userId: string,
  permission: string
): Promise<UnifiedApiResponse<{ hasPermission: boolean; reason?: string }>> {
  return apiCall('POST /permissions/check', {
    userId,
    permission
  })
}

/**
 * 批量检查权限
 */
export async function checkPermissions(
  userId: string,
  permissions: string[]
): Promise<UnifiedApiResponse<{ 
  results: Array<{ permission: string; hasPermission: boolean; reason?: string }>
}>> {
  return apiCall('POST /permissions/check-batch', {
    userId,
    permissions
  })
}

/**
 * 检查用户是否有指定角色
 */
export async function checkRole(
  userId: string,
  role: string
): Promise<UnifiedApiResponse<{ hasRole: boolean; reason?: string }>> {
  return apiCall('POST /roles/check', {
    userId,
    role
  })
}

/**
 * 获取用户的所有权限
 */
export async function getUserPermissions(
  userId: string
): Promise<UnifiedApiResponse<{ permissions: Permission[] }>> {
  return apiCall(`GET /users/${userId}/permissions`, {})
}

/**
 * 获取用户的所有角色
 */
export async function getUserRoles(
  userId: string
): Promise<UnifiedApiResponse<{ roles: Role[] }>> {
  return apiCall(`GET /users/${userId}/roles`, {})
}

// ========================================
// 👤 用户角色分配 API
// ========================================

/**
 * 为用户分配角色
 */
export async function assignRole(
  userId: string,
  roleId: string
): Promise<UnifiedApiResponse<void>> {
  return apiCall('POST /users/assign-role', {
    userId,
    roleId
  })
}

/**
 * 批量为用户分配角色
 */
export async function assignRoles(
  userId: string,
  roleIds: string[]
): Promise<UnifiedApiResponse<void>> {
  return apiCall('POST /users/assign-roles', {
    userId,
    roleIds
  })
}

/**
 * 撤销用户角色
 */
export async function revokeRole(
  userId: string,
  roleId: string
): Promise<UnifiedApiResponse<void>> {
  return apiCall('POST /users/revoke-role', {
    userId,
    roleId
  })
}

/**
 * 批量撤销用户角色
 */
export async function revokeRoles(
  userId: string,
  roleIds: string[]
): Promise<UnifiedApiResponse<void>> {
  return apiCall('POST /users/revoke-roles', {
    userId,
    roleIds
  })
}

/**
 * 设置用户角色（完全替换）
 */
export async function setUserRoles(
  userId: string,
  roleIds: string[]
): Promise<UnifiedApiResponse<void>> {
  return apiCall('PUT /users/roles', {
    userId,
    roleIds
  })
}

// ========================================
// 🔧 工具函数
// ========================================

/**
 * 解析权限代码
 */
export function parsePermissionCode(code: string): {
  resource: string
  action: string
} {
  const parts = code.split(':')
  return {
    resource: parts[0] || '',
    action: parts[1] || ''
  }
}

/**
 * 构造权限代码
 */
export function buildPermissionCode(resource: string, action: string): string {
  return `${resource}:${action}`
}

/**
 * 格式化权限显示名称
 */
export function formatPermissionName(permission: Permission): string {
  return permission.name || `${permission.resource}:${permission.action}`
}

/**
 * 格式化角色显示名称
 */
export function formatRoleName(role: Role): string {
  return role.name || role.code
}

/**
 * 检查权限代码格式是否有效
 */
export function isValidPermissionCode(code: string): boolean {
  const parts = code.split(':')
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0
}

/**
 * 检查角色代码格式是否有效
 */
export function isValidRoleCode(code: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(code)
}

/**
 * 对权限进行分组
 */
export function groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((groups, permission) => {
    const resource = permission.resource
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(permission)
    return groups
  }, {} as Record<string, Permission[]>)
}

/**
 * 对权限进行分类
 */
export function groupPermissionsByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((groups, permission) => {
    const category = permission.category || '未分类'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(permission)
    return groups
  }, {} as Record<string, Permission[]>)
}

/**
 * 搜索权限
 */
export function searchPermissions(permissions: Permission[], keyword: string): Permission[] {
  if (!keyword.trim()) return permissions
  
  const lowerKeyword = keyword.toLowerCase()
  return permissions.filter(permission => 
    permission.name.toLowerCase().includes(lowerKeyword) ||
    permission.code.toLowerCase().includes(lowerKeyword) ||
    permission.resource.toLowerCase().includes(lowerKeyword) ||
    permission.action.toLowerCase().includes(lowerKeyword) ||
    (permission.description && permission.description.toLowerCase().includes(lowerKeyword))
  )
}

/**
 * 搜索角色
 */
export function searchRoles(roles: Role[], keyword: string): Role[] {
  if (!keyword.trim()) return roles
  
  const lowerKeyword = keyword.toLowerCase()
  return roles.filter(role => 
    role.name.toLowerCase().includes(lowerKeyword) ||
    role.code.toLowerCase().includes(lowerKeyword) ||
    (role.description && role.description.toLowerCase().includes(lowerKeyword))
  )
}

/**
 * 检查角色是否包含指定权限
 */
export function roleHasPermission(role: Role, permissionId: string): boolean {
  return role.permissions.includes(permissionId)
}

/**
 * 计算角色的权限数量
 */
export function getRolePermissionCount(role: Role): number {
  return role.permissions.length
}

/**
 * 检查是否为系统内置角色（不可删除）
 */
export function isSystemRole(role: Role): boolean {
  const systemRoles = ['admin', 'super_admin', 'guest']
  return systemRoles.includes(role.code)
}

/**
 * 检查是否为系统内置权限（不可删除）
 */
export function isSystemPermission(permission: Permission): boolean {
  const systemPermissions = ['system:admin', 'user:manage', 'rbac:manage']
  return systemPermissions.includes(permission.code)
} 