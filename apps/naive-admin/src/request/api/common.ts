/**
 * 通用 API 工具模块
 * 使用标准 HTTP/REST API，但保持 proto 类型定义
 */

import { get, post } from '../axios'
import type { PaginationRequest, PaginationResponse, Timestamp } from '@/shared/common'

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
export type PaginationParams = Omit<PaginationRequest, 'toJSON' | 'fromJSON' | 'create' | 'decode' | 'encode' | 'fromPartial'>
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

// ========================================
// 🔧 通用工具函数
// ========================================

/**
 * 格式化 proto Timestamp 为日期字符串
 */
export const formatTimestamp = (timestamp: Timestamp | string | number | Date): string => {
  if (!timestamp) return ''

  let date: Date

  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    // Protobuf Timestamp 格式
    date = new Date(Number(timestamp.seconds) * 1000)
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'number') {
    // 如果是毫秒时间戳
    date = new Date(timestamp)
  } else {
    date = timestamp
  }

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 格式化时间戳为相对时间
 */
export const formatRelativeTime = (timestamp: Timestamp | string | number | Date): string => {
  if (!timestamp) return ''

  let date: Date

  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    date = new Date(Number(timestamp.seconds) * 1000)
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else {
    date = timestamp
  }

  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

/**
 * 创建 proto Timestamp 对象
 */
export const createTimestamp = (date: Date = new Date()): Timestamp => {
  return {
    seconds: Math.floor(date.getTime() / 1000).toString(),
    nanos: (date.getTime() % 1000) * 1000000
  }
}

/**
 * 验证分页参数
 */
export const validatePaginationParams = (params: PaginationParams): PaginationParams => {
  const { page = 1, pageSize = 20, keyword } = params

  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), 100), // 限制最大页面大小
    keyword: keyword?.trim() || undefined
  }
}

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
// 🏥 健康检查 API
// ========================================

/**
 * 检查 API 健康状态
 */
export const checkApiHealth = async () => {
  return get<void, { status: 'healthy' | 'unhealthy'; timestamp: string; version?: string; uptime?: number }>('/api/health')
}

/**
 * 获取 API 配置信息
 */
export const getApiConfig = async () => {
  return get<void, { version: string; environment: string; features: string[]; limits: { maxPageSize: number; defaultPageSize: number; maxRequestSize: number } }>('/api/config')
}

/**
 * 获取系统信息
 */
export const getSystemInfo = async () => {
  return get<void, { name: string; version: string; description: string; author: string; license: string; repository: string; buildTime: string; nodeVersion: string; environment: string }>('/api/system/info')
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
