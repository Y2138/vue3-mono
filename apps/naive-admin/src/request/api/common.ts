/**
 * 通用 API 工具模块
 * 使用标准 HTTP/REST API，但保持 proto 类型定义
 */

import { get, post } from '../axios'
import type { PaginationResponse, EnumItem } from '@/shared/common'

// ========================================
// 🔄 通用响应类型（基于 proto 定义）
// ========================================

// 传统 HTTP 响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  timestamp: number
  error?: any
}

// 使用 proto 生成的分页类型
export type PaginationData<T = any> = Omit<PaginationResponse, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial' | 'items'> & {
  items: T[]
}

// 错误详情
export interface ErrorDetail {
  field?: string
  message: string
  code?: string
}

// 响应状态
export interface ResponseStatus {
  success: boolean
  code: number
  message: string
  errors?: ErrorDetail[]
}

export { type EnumItem } from '@/shared/common'
export interface EnumResponse {
  enums: Record<string, EnumItem[]>
  version?: string
}

// ========================================
// 🔧 通用工具函数
// ========================================

/**
 * 构建查询参数
 */
export const buildQueryParams = (params: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value
    }
  })

  return result
}

// ========================================
// 🔍 搜索相关 API
// ========================================

/**
 * 全局搜索
 */
export const globalSearch = async (keyword: string, types?: string[]) => {
  return get<void, { users: any[]; roles: any[]; permissions: any[]; total: number }>('/api/search', {
    params: {
      keyword,
      types: types?.join(',')
    }
  })
}

// ========================================
// 📁 文件上传 API
// ========================================

/**
 * 上传文件
 */
export const uploadFile = async (file: File, category?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  if (category) {
    formData.append('category', category)
  }

  return post<FormData, { url: string; filename: string; size: number; mimeType: string; uploadTime: string }>('/api/upload', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除文件
 */
export const deleteFile = (url: string) => {
  return post('/api/upload', {
    data: { url }
  })
}
