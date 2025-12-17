/**
 * 角色管理 API 模块
 * 基于 protobuf 定义的接口
 */

import { get, post } from '@/request/axios'

// 从共享类型文件导入角色管理相关类型
import type { Role, CreateRoleRequest, UpdateRoleRequest, GetRolesRequest } from '@/shared/role'
import type { ResourceListResponse } from '@/shared/resource'

// 权限信息类型
export interface PermissionInfo {
  id: string
  name: string
  description?: string
  resCode?: string
  resource?: string
  action?: string
  parentId?: string
  createdAt?: string
  updatedAt?: string
}

// 角色信息类型
export interface RoleInfo {
  id: string
  name: string
  description?: string
  code: string
  permissions?: PermissionInfo[]
  createdAt?: string
  updatedAt?: string
}

// 权限检查参数类型
export interface CheckPermissionParams {
  userPhone: string
  action: string
  resource: string
}

/**
 * 获取角色列表
 */
export const getRoles = async (params?: GetRolesRequest) => {
  return get<GetRolesRequest, Role[]>('/api/roles/list', { params })
}

/**
 * 获取角色详情
 */
export const getRole = async (params: { id: string }) => {
  return get<{ id: string }, Role>('/api/roles/detail', { params })
}

/**
 * 创建角色
 */
export const createRole = async (data: CreateRoleRequest) => {
  return post<CreateRoleRequest, Role>('/api/roles/create', { data })
}

/**
 * 更新角色
 */
export const updateRole = async (data: UpdateRoleRequest & { id: string }) => {
  return post<UpdateRoleRequest & { id: string }, Role>('/api/roles/update', { data })
}

/**
 * 删除角色
 */
export const deleteRole = async (params: { id: string }) => {
  return post<{ id: string }, any>('/api/roles/delete', { data: params })
}

/**
 * 根据角色ID列表预览权限
 * POST /api/roles/preview-permissions Body: { roleIds: string[] }
 */
export const previewPermissionsByRoleIds = async (roleIds: string[]) => {
  return post<{ roleIds: string[] }, { tree: any[]; list: any[] }>('/api/roles/preview-permissions', {
    data: { roleIds }
  })
}

/**
 * 获取权限列表 - 使用资源树替代
 */
export const getPermissions = async (params?: { page?: number; pageSize?: number; keyword?: string }) => {
  return get<typeof params, ResourceListResponse>('/api/resources/list', { params })
}

// 检查用户权限 - 后端未实现
export const checkPermission = async (_params: CheckPermissionParams) => {
  console.warn('checkPermission API not implemented in backend')
  return Promise.resolve({ hasPermission: true })
}

// 批量检查权限 - 后端未实现
export const batchCheckPermissions = async (params: CheckPermissionParams[]) => {
  console.warn('batchCheckPermissions API not implemented in backend')
  return Promise.resolve(params.map(() => ({ hasPermission: true })))
}
