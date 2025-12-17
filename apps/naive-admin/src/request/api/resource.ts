/**
 * 资源管理 API 模块
 * 基于 protobuf 定义的接口
 */

import { get, post } from '../axios'

// 从共享类型文件导入资源管理相关类型
import type { CreateResourceRequest, UpdateResourceRequest, ResourceResponse, GetResourcesRequest, Resource, ResourceTree } from '@/shared/resource'

/**
 * 获取资源列表
 */
export const getResources = async (params?: GetResourcesRequest) => {
  return get<GetResourcesRequest, Resource[]>('/api/resources/list', { params })
}

/**
 * 获取资源树
 */
export const getResourceTree = async (params?: GetResourcesRequest) => {
  return get<GetResourcesRequest, ResourceTree[]>('/api/resources/tree', { params })
}

/**
 * 根据ID获取资源
 */
export const getResourceById = async (id: string) => {
  return get<void, Resource>('/api/resources/detail', { params: { id } })
}

/**
 * 创建资源
 */
export const createResource = async (params: CreateResourceRequest) => {
  return post<CreateResourceRequest, ResourceResponse>('/api/resources/create', { data: params })
}

/**
 * 更新资源
 */
export const updateResource = async (data: UpdateResourceRequest) => {
  return post<Omit<UpdateResourceRequest, 'id'>, ResourceResponse>('/api/resources/update', { data })
}

/**
 * 删除资源
 */
export const deleteResource = async (id: string) => {
  return post<{ id: string }, any>('/api/resources/delete', { data: { id } })
}

// 获取资源枚举
export const getResourceEnums = () => get<void, any>('/api/resources/enums')
