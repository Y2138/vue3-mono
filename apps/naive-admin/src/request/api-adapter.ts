import axios, { type AxiosResponse } from 'axios'

/**
 * API 适配器配置
 */
interface ApiAdapterConfig {
  /** 是否使用 gRPC 协议 */
  useGrpc: boolean
  /** gRPC 服务端点 */
  grpcEndpoint: string
  /** HTTP API 基础URL */
  httpBaseUrl: string
  /** 是否启用调试模式 */
  debug: boolean
}

/**
 * 统一的 API 响应格式
 */
type ApiResponse<T = any> = [T | null, Error | null]

/**
 * 支持的 API 端点映射
 */
const ENDPOINT_MAPPING = {
  // 用户相关
  'POST /auth/login': { grpc: 'UserService.Login', http: '/api/auth/login' },
  'POST /auth/logout': { grpc: 'UserService.Logout', http: '/api/auth/logout' },
  'GET /auth/me': { grpc: 'UserService.GetProfile', http: '/api/auth/me' },
  'POST /users': { grpc: 'UserService.CreateUser', http: '/api/users' },
  'GET /users/:id': { grpc: 'UserService.GetUser', http: '/api/users/' },
  
  // 权限相关
  'GET /permissions': { grpc: 'RbacService.GetPermissions', http: '/api/permissions' },
  'GET /roles': { grpc: 'RbacService.GetRoles', http: '/api/roles' },
  'POST /permissions/check': { grpc: 'RbacService.CheckPermissions', http: '/api/permissions/check' },
  
  // 业务相关
  'GET /api/column/column/index': { grpc: 'ColumnService.GetList', http: '/api/column/column/index' },
  'POST /column/column/create': { grpc: 'ColumnService.Create', http: '/api/column/column/create' },
  'POST /column/column/edit': { grpc: 'ColumnService.Update', http: '/api/column/column/edit' },
  'POST /column/column/delete': { grpc: 'ColumnService.Delete', http: '/api/column/column/delete' },
  'POST /column/column/online': { grpc: 'ColumnService.SetOnline', http: '/api/column/column/online' },
  'POST /column/column/offline': { grpc: 'ColumnService.SetOffline', http: '/api/column/column/offline' },
} as const

/**
 * 简单的 API 适配器
 * 
 * 设计原则：
 * - 配置驱动：通过环境变量控制协议选择
 * - 统一接口：无论 HTTP 还是 gRPC，调用方式完全一致
 * - 透明切换：业务代码无需感知底层协议
 * - 简单维护：最小化复杂度，易于调试
 */
class ApiAdapter {
  private config: ApiAdapterConfig

  constructor() {
    this.config = this.loadConfig()
    
    if (this.config.debug) {
      console.log(`[ApiAdapter] 初始化 - 协议: ${this.config.useGrpc ? 'gRPC' : 'HTTP'}`)
    }
  }

  /**
   * 加载配置
   */
  private loadConfig(): ApiAdapterConfig {
    // 从环境变量或运行时配置获取设置
    const env = (import.meta as any)?.env || {}
    const runtimeConfig = (window as any).__API_CONFIG__ || {}
    
    return {
      useGrpc: env.VITE_USE_GRPC === 'true' || runtimeConfig.useGrpc || false,
      grpcEndpoint: env.VITE_GRPC_ENDPOINT || runtimeConfig.grpcEndpoint || 'http://localhost:9090',
      httpBaseUrl: env.VITE_API_URL || runtimeConfig.httpBaseUrl || 'http://localhost:3000',
      debug: env.VITE_API_DEBUG === 'true' || runtimeConfig.debug || false
    }
  }

  /**
   * 运行时更新配置
   */
  updateConfig(updates: Partial<ApiAdapterConfig>): void {
    this.config = { ...this.config, ...updates }
    
    if (this.config.debug) {
      console.log(`[ApiAdapter] 配置更新:`, updates)
    }
  }

  /**
   * 统一的 API 调用方法
   * 
   * @param endpoint - API 端点，如 'POST /auth/login'
   * @param data - 请求数据
   * @param options - 额外选项
   * @returns Promise<[data, error]> 格式的响应
   */
  async call<T = any>(
    endpoint: string,
    data?: any,
    options?: { timeout?: number; headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    try {
      if (this.config.debug) {
        console.log(`[ApiAdapter] 调用 ${endpoint}`, { 
          protocol: this.config.useGrpc ? 'gRPC' : 'HTTP',
          data 
        })
      }

      const startTime = Date.now()
      let result: T

      if (this.config.useGrpc) {
        result = await this.callGrpc<T>(endpoint, data, options)
      } else {
        result = await this.callHttp<T>(endpoint, data, options)
      }

      if (this.config.debug) {
        const duration = Date.now() - startTime
        console.log(`[ApiAdapter] ${endpoint} 完成 (${duration}ms)`, result)
      }

      return [result, null]
    } catch (error) {
      const apiError = this.handleError(error, endpoint)
      
      if (this.config.debug) {
        console.error(`[ApiAdapter] ${endpoint} 失败:`, apiError)
      }

      return [null, apiError]
    }
  }

  /**
   * gRPC 调用实现
   */
  private async callGrpc<T>(
    endpoint: string,
    data?: any,
    options?: { timeout?: number; headers?: Record<string, string> }
  ): Promise<T> {
    // TODO: 实现真正的 gRPC 调用
    // 当前先降级到 HTTP 调用，后续可以替换为真正的 gRPC 实现
    
    if (this.config.debug) {
      console.warn(`[ApiAdapter] gRPC 暂未实现，降级到 HTTP 调用`)
    }
    
    return this.callHttp<T>(endpoint, data, options)
  }

  /**
   * HTTP 调用实现
   */
  private async callHttp<T>(
    endpoint: string,
    data?: any,
    options?: { timeout?: number; headers?: Record<string, string> }
  ): Promise<T> {
    const [method, path] = endpoint.split(' ')
    const url = this.resolveHttpUrl(path)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers
    }

    // 添加认证头
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config = {
      method: method.toLowerCase(),
      url,
      timeout: options?.timeout || 10000,
      headers
    }

    // 根据请求方法添加数据
    if (['post', 'put', 'patch'].includes(config.method) && data) {
      ;(config as any).data = data
    } else if (data) {
      ;(config as any).params = data
    }

    const response: AxiosResponse<T> = await axios(config as any)
    
    // 统一返回格式转换
    return this.transformResponse<T>(response.data)
  }

  /**
   * 解析 HTTP URL
   */
  private resolveHttpUrl(path: string): string {
    // 如果已经是完整的路径，直接使用
    if (path.startsWith('/api/')) {
      return `${this.config.httpBaseUrl}${path}`
    }
    
    // 查找端点映射
    const mapping = Object.entries(ENDPOINT_MAPPING).find(([key]) => 
      key.includes(path)
    )
    
    if (mapping) {
      return `${this.config.httpBaseUrl}${mapping[1].http}`
    }
    
    // 默认拼接
    return `${this.config.httpBaseUrl}${path}`
  }

  /**
   * 获取认证 Token
   */
  private getAuthToken(): string | null {
    // 从多个来源尝试获取 token
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      null
    )
  }

  /**
   * 响应数据转换
   * 确保 gRPC 和 HTTP 返回的数据格式统一
   */
  private transformResponse<T>(data: any): T {
    // 如果是 Protobuf 格式的响应，转换为标准格式
    if (data && typeof data === 'object') {
      // 保持数据结构不变，只确保类型正确
      return data as T
    }
    
    return data
  }

  /**
   * 错误处理
   */
  private handleError(error: any, endpoint: string): Error {
    let message = '请求失败'
    let code = 'UNKNOWN_ERROR'

    if (axios.isAxiosError(error)) {
      // HTTP 错误
      code = `HTTP_${error.response?.status || 'NETWORK'}`
      message = error.response?.data?.message || error.message || '网络请求失败'
    } else if (error instanceof Error) {
      // 其他错误
      message = error.message
      code = error.name || 'ERROR'
    }

    const apiError = new Error(message)
    apiError.name = code
    ;(apiError as any).endpoint = endpoint
    ;(apiError as any).originalError = error

    return apiError
  }

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<ApiAdapterConfig> {
    return { ...this.config }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ http: boolean; grpc: boolean }> {
    const results = { http: false, grpc: false }

    // HTTP 健康检查
    try {
      await this.callHttp('/health')
      results.http = true
    } catch {
      results.http = false
    }

    // gRPC 健康检查 (暂时跳过)
    results.grpc = this.config.useGrpc ? results.http : true

    return results
  }
}

// 创建全局实例
export const apiAdapter = new ApiAdapter()

// 便捷方法
export const apiCall = apiAdapter.call.bind(apiAdapter)

// 配置方法
export const updateApiConfig = apiAdapter.updateConfig.bind(apiAdapter)
export const getApiConfig = apiAdapter.getConfig.bind(apiAdapter)

// 健康检查
export const checkApiHealth = apiAdapter.healthCheck.bind(apiAdapter)

// 类型导出
export type { ApiAdapterConfig, ApiResponse } 