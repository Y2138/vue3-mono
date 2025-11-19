/**
 * 统一响应类型定义
 *
 * 提供标准化的 API 响应格式，支持成功响应、分页响应和错误响应
 * 采用简化的设计，移除复杂的元数据，专注于核心响应字段
 */

// ==================== 核心响应类型 ====================

/**
 * 基础 API 响应接口
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean
  /** HTTP 状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data?: T
  /** 错误信息（仅在错误时存在） */
  error?: ErrorInfo
}

/**
 * 分页响应接口
 */
export interface ApiPaginatedResponse<T = any> extends ApiResponse<T[]> {
  /** 分页信息 */
  pagination: PaginationInfo
}

/**
 * 错误响应接口
 */
export interface ApiErrorResponse extends ApiResponse<null> {
  success: false
  error: ErrorInfo
}

// ==================== 辅助类型 ====================

/**
 * 分页信息
 */
export interface PaginationInfo {
  /** 当前页码（从1开始） */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 总记录数 */
  total: number
  /** 总页数 */
  totalPages?: number
  /** 是否有下一页 */
  hasNext?: boolean
  /** 是否有上一页 */
  hasPrev?: boolean
}

/**
 * 错误信息
 */
export interface ErrorInfo {
  /** 错误类型 */
  type: string
  /** 错误详情 */
  details?: any
  /** 错误代码 */
  code?: string
  /** 错误堆栈（仅在开发环境） */
  stack?: string
}

// ==================== 响应状态码常量 ====================

/**
 * 常用响应状态码
 */
export const RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

/**
 * 错误类型常量
 */
export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  BUSINESS: 'BUSINESS_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  DATA_ERROR: 'DATA_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
  EXTERNAL: 'EXTERNAL_ERROR'
} as const

// ==================== 类型工具 ====================

/**
 * 提取响应数据类型
 */
export type ResponseData<T> = T extends ApiResponse<infer U> ? U : never

/**
 * 提取分页响应数据类型
 */
export type PaginatedResponseData<T> = T extends ApiPaginatedResponse<infer U> ? U : never

/**
 * 响应类型联合
 */
export type AnyApiResponse<T = any> = ApiResponse<T> | ApiPaginatedResponse<T> | ApiErrorResponse
