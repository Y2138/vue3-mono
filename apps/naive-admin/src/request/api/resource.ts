/**
 * 资源管理 API 模块
 * 基于 protobuf 定义的接口
 */

import { get, post, patch, del } from '../axios'

// 从共享类型文件导入资源管理相关类型
import type { CreateResourceRequest, UpdateResourceRequest, MoveResourceRequest, DuplicateResourceRequest, BatchDeleteResourcesRequest, ResourceListResponse, ResourceTreeResponse, ResourceResponse, ResourcePathResponse, GetResourcesRequest, Resource } from '@/shared/resource'

/**
 * 获取资源列表
 */
export const getResources = async (params?: GetResourcesRequest) => {
  return get<GetResourcesRequest, ResourceListResponse>('/api/resources', { params })
}

/**
 * 获取资源树
 */
export const getResourceTree = async (params?: GetResourcesRequest) => {
  return get<GetResourcesRequest, Resource[]>('/api/resources/tree', { params })
}

/**
 * 根据ID获取资源
 */
export const getResourceById = async (id: string) => {
  return get<void, ResourceResponse>('/api/resources/list', { params: { id } })
}

/**
 * 创建资源
 */
export const createResource = async (params: CreateResourceRequest) => {
  return post<CreateResourceRequest, ResourceResponse>('/api/resources', { data: params })
}

/**
 * 更新资源
 */
export const updateResource = async (params: UpdateResourceRequest) => {
  const { id, ...updateData } = params
  return post<Omit<UpdateResourceRequest, 'id'>, ResourceResponse>('/api/resources/update', { 
    params: { id },
    data: updateData 
  })
}

/**
 * 移动资源
 */
export const moveResource = async (id: string, params: MoveResourceRequest) => {
  return post<MoveResourceRequest, ResourceResponse>('/api/resources/move', { 
    params: { id },
    data: params 
  })
}

/**
 * 复制资源
 */
export const duplicateResource = async (id: string, params: DuplicateResourceRequest) => {
  return post<DuplicateResourceRequest, ResourceResponse>('/api/resources/duplicate', { 
    params: { id },
    data: params 
  })
}

/**
 * 删除资源
 */
export const deleteResource = async (id: string) => {
  return post<void, any>('/api/resources/remove', { params: { id } })
}

/**
 * 批量删除资源
 */
export const batchDeleteResources = async (ids: string[]) => {
  return post<BatchDeleteResourcesRequest, void>('/api/resources/batch-delete', { data: { ids } })
}

/**
 * 获取资源路径
 */
export const getResourcePath = async (id: string) => {
  return get<void, ResourcePathResponse>('/api/resources/path', { params: { id } })
}

/**
 * 获取资源子树
 */
export const getResourceSubtree = async (id: string) => {
  return get<void, ResourceTreeResponse>('/api/resources/tree', { params: { id } })
}

/**
 * 根据路径获取资源
 */
export const getResourceByPath = async (path: string) => {
  return get<void, ResourceResponse>(`/api/resources/by-path/${path}`)
}

/**
 * 验证资源树结构
 */
export const validateResourceTree = async () => {
  return get<void, any>('/api/resources/validate/tree')
}

// 获取资源枚举
export const getResourceEnums = () => get<void, any>('/api/resources/enums')

/**
 * RBAC API接口定义
 */

// 权限信息类型
export interface PermissionInfo {
  id: string
  name: string
  description?: string
  code: string
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

// 分页结果类型
interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 权限列表响应类型
export interface PermissionListResponse {
  permissions: PermissionInfo[]
  pagination: PaginationResult<PermissionInfo>
}

// 角色列表响应类型
export interface RoleListResponse {
  roles: RoleInfo[]
  pagination: PaginationResult<RoleInfo>
}
/**
 * 获取权限列表 - 使用资源树替代
 */
export const getPermissions = async (params?: { page?: number; pageSize?: number; keyword?: string }) => {
  return get<typeof params, ResourceListResponse>('/api/resources/list', { params })
}

// 获取角色列表
export const getRoles = async (params?: { page?: number; pageSize?: number; keyword?: string; includePermissions?: boolean }) => {
  return post<typeof params, RoleListResponse>('/api/roles/list', { data: params })
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

// 获取用户权限 - 后端未实现
export const getUserPermissions = async (_userId: string) => {
  console.warn('getUserPermissions API not implemented in backend')
  return Promise.resolve({ permissions: [] })
}

// 获取用户角色
export const getUserRoles = async (params: { userId: string }) => {
  return post<typeof params, { roles: RoleInfo[] }>('/api/roles/user', { data: params })
}

// 为用户分配角色 - 后端未实现
export const assignUserRoles = async (_userId: string, _roleIds: string[]) => {
  console.warn('assignUserRoles API not implemented in backend')
  return Promise.resolve({ success: true })
}

// 为角色分配权限
export const assignRolePermissions = async (roleId: string, resourcePermissions: Array<{ resourceId: string; view?: boolean; create?: boolean; update?: boolean; delete?: boolean }>) => {
  return post<typeof resourcePermissions, any>(`/api/roles/${roleId}/permissions`, { data: resourcePermissions })
}
