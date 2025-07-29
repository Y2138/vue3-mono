/**
 * 通用 API 工具模块
 * 基于简化的 API 适配器实现
 */

import { apiCall, checkApiHealth, getApiConfig } from '../api-adapter'
import type { ApiResponse as AdapterResponse } from '../api-adapter'

// ========================================
// 🔄 通用响应类型（保持向后兼容）
// ========================================

// 传统 HTTP 响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  timestamp: number
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应
export interface PaginationResponse<T = any> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 统一的 API 响应格式（适配器格式）
export type UnifiedApiResponse<T = any> = AdapterResponse<T>

// ========================================
// 🛠️ 通用工具函数
// ========================================

/**
 * 通用 GET 请求
 * 保持向后兼容的接口
 */
export async function get<T = any>(
  url: string, 
  config?: { params?: any; headers?: Record<string, string> }
): Promise<UnifiedApiResponse<T>> {
  return apiCall<T>(`GET ${url}`, config?.params, {
    headers: config?.headers
  })
}

/**
 * 通用 POST 请求
 * 保持向后兼容的接口
 */
export async function post<T = any>(
  url: string, 
  data?: any,
  config?: { headers?: Record<string, string> }
): Promise<UnifiedApiResponse<T>> {
  return apiCall<T>(`POST ${url}`, data, {
    headers: config?.headers
  })
}

/**
 * 通用 PUT 请求
 */
export async function put<T = any>(
  url: string, 
  data?: any,
  config?: { headers?: Record<string, string> }
): Promise<UnifiedApiResponse<T>> {
  return apiCall<T>(`PUT ${url}`, data, {
    headers: config?.headers
  })
}

/**
 * 通用 DELETE 请求
 */
export async function del<T = any>(
  url: string, 
  config?: { params?: any; headers?: Record<string, string> }
): Promise<UnifiedApiResponse<T>> {
  return apiCall<T>(`DELETE ${url}`, config?.params, {
    headers: config?.headers
  })
}

// ========================================
// 🏥 健康检查和监控
// ========================================

/**
 * API 健康检查
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: { http: boolean; grpc: boolean }
  config: { protocol: string; endpoint: string }
}> {
  const health = await checkApiHealth()
  const config = getApiConfig()
  
  return {
    status: health.http ? 'healthy' : 'unhealthy',
    details: health,
    config: {
      protocol: config.useGrpc ? 'gRPC' : 'HTTP',
      endpoint: config.useGrpc ? config.grpcEndpoint : config.httpBaseUrl
    }
  }
}

/**
 * 获取当前 API 配置信息
 */
export function getApiInfo() {
  const config = getApiConfig()
  
  return {
    protocol: config.useGrpc ? 'gRPC' : 'HTTP',
    endpoint: config.useGrpc ? config.grpcEndpoint : config.httpBaseUrl,
    debug: config.debug
  }
}

// ========================================
// 📊 工具函数
// ========================================

/**
 * 检查响应是否成功
 */
export function isApiSuccess<T>(response: UnifiedApiResponse<T>): response is [T, null] {
  return response[0] !== null && response[1] === null
}

/**
 * 提取响应数据
 */
export function extractApiData<T>(response: UnifiedApiResponse<T>): T | null {
  return response[0]
}

/**
 * 提取响应错误
 */
export function extractApiError<T>(response: UnifiedApiResponse<T>): Error | null {
  return response[1]
}

/**
 * 创建分页参数
 */
export function createPaginationParams(page: number, pageSize: number = 20): PaginationParams {
  return { page, pageSize }
}

/**
 * 格式化错误消息
 */
export function formatApiError(error: Error | null): string {
  if (!error) return ''
  
  // 根据错误类型返回用户友好的消息
  if (error.name?.startsWith('HTTP_')) {
    const status = error.name.replace('HTTP_', '')
    switch (status) {
      case '401':
        return '登录已过期，请重新登录'
      case '403':
        return '权限不足，无法访问'
      case '404':
        return '请求的资源不存在'
      case '500':
        return '服务器内部错误，请稍后重试'
      default:
        return error.message || '请求失败'
    }
  }
  
  return error.message || '未知错误'
}

// ========================================
// 🔧 批量请求工具
// ========================================

/**
 * 批量并行请求
 */
export async function batchRequest<T = any>(
  requests: Array<() => Promise<UnifiedApiResponse<T>>>
): Promise<UnifiedApiResponse<T>[]> {
  try {
    const results = await Promise.allSettled(requests.map(req => req()))
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return [null, new Error(result.reason?.message || '批量请求失败')]
      }
    })
  } catch (error) {
    throw new Error(`批量请求执行失败: ${error}`)
  }
}

/**
 * 批量串行请求（有依赖关系时使用）
 */
export async function sequentialRequest<T = any>(
  requests: Array<() => Promise<UnifiedApiResponse<T>>>
): Promise<UnifiedApiResponse<T>[]> {
  const results: UnifiedApiResponse<T>[] = []
  
  for (const request of requests) {
    try {
      const result = await request()
      results.push(result)
      
      // 如果请求失败，可以选择继续或停止
      const [_data, error] = result
      if (error) {
        console.warn('串行请求中发现错误:', error.message)
        // 继续执行后续请求
      }
    } catch (error) {
      results.push([null, error as Error])
    }
  }
  
  return results
}

// ========================================
// 📤 导出所有工具
// ========================================

export {
  // 适配器相关
  apiCall,
  checkApiHealth,
  getApiConfig,
  // 类型
  type AdapterResponse
} 