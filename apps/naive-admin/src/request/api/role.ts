/**
 * 角色管理 API 模块
 * 基于 protobuf 定义的接口
 */

import { get, post } from '@/request/axios'

// 从共享类型文件导入角色管理相关类型
import type { Role, CreateRoleRequest, UpdateRoleRequest, GetRolesRequest } from '@/shared/role'

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
