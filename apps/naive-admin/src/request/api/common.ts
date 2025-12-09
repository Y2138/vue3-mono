/**
 * 通用 API 工具模块
 * 使用标准 HTTP/REST API，但保持 proto 类型定义
 */

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
