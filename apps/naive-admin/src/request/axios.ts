// index.ts
import axios from 'axios'
import type { AxiosRequestConfig, AxiosRequestHeaders, RawAxiosRequestHeaders } from 'axios'
import { PendingMap } from './cancelToken'
import { useUserStore } from '@/store/modules/user'
// Protobuf 数据类型判断和转换工具
interface ProtobufTransformConfig {
  /** 是否启用 Protobuf 处理 */
  useProtobuf?: boolean
  /** 请求消息类型名称（用于调试和日志） */
  requestMessageType?: string
  /** 响应消息类型名称（用于调试和日志） */
  responseMessageType?: string
  /** 是否强制使用二进制格式（gRPC-Web） */
  forceBinary?: boolean
}

interface ICustomAxiosConfig<T> extends AxiosRequestConfig<T> {
  /* 是否不需要错误信息提示，默认有 */
  disableErrorMsg?: boolean
  /* 是否需要全屏loading */
  fullLoading?: boolean
  /* 是否重试 */
  retry?: boolean
  /* 重试次数 */
  retryMaxCount?: number
  /* 重试间隔 */
  retryRelay?: number
  /* 已重试次数 */
  __retryCount?: number
  /* 是否不需要拼接时间戳，默认拼接 */
  noTimestamp?: boolean
  /* Protobuf 配置 */
  protobuf?: ProtobufTransformConfig
}

// Protobuf 数据转换工具类
class ProtobufTransformers {
  /**
   * 检查数据是否为 ts-proto 生成的 Protobuf 接口对象
   * ts-proto 生成的对象是普通的 JS 对象，我们通过一些启发式方法来判断
   */
  static isProtobufInterface(data: any): boolean {
    // 检查是否为普通对象且不是 FormData、Date 等特殊类型
    return data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof Date) && !(data instanceof File) && !(data instanceof Blob) && !Array.isArray(data)
  }

  /**
   * 将 Protobuf 接口对象序列化为 JSON
   * 对于 ts-proto 生成的接口，直接使用 JSON 序列化
   */
  static serializeToJson(data: any): string {
    return JSON.stringify(data)
  }

  /**
   * 将 Protobuf 接口对象序列化为二进制格式（用于 gRPC-Web）
   * 注意：这里需要实际的 protobuf 编码库支持
   */
  static serializeToBinary(data: any, messageType?: string): Uint8Array {
    // 暂时降级为 JSON 字符串的二进制表示
    // 实际应用中需要根据具体的 protobuf 库进行编码
    console.warn(`二进制序列化暂未完全实现，消息类型: ${messageType}，降级为 JSON`)
    const jsonString = ProtobufTransformers.serializeToJson(data)
    return new TextEncoder().encode(jsonString)
  }

  /**
   * 请求数据转换器
   */
  static requestTransformer(data: any, _headers: any): any {
    // 基础的 JSON 转换
    if (data && typeof data === 'object' && !(data instanceof FormData)) {
      return JSON.stringify(data)
    }
    return data
  }

  /**
   * 响应数据转换器
   */
  static responseTransformer(data: any): any {
    // JSON 数据处理
    try {
      return typeof data === 'string' ? JSON.parse(data) : data
    } catch {
      return data
    }
  }

  /**
   * Protobuf 请求数据处理（在拦截器中使用）
   */
  static processProtobufRequest(data: any, config: ICustomAxiosConfig<any>): any {
    const protobufConfig = config.protobuf

    if (!protobufConfig?.useProtobuf || !ProtobufTransformers.isProtobufInterface(data)) {
      return data
    }

    // 根据配置选择序列化方式
    if (protobufConfig.forceBinary) {
      return ProtobufTransformers.serializeToBinary(data, protobufConfig.requestMessageType)
    } else {
      // 默认使用 JSON 序列化（适用于 REST API）
      return ProtobufTransformers.serializeToJson(data)
    }
  }

  /**
   * Protobuf 响应数据处理（在拦截器中使用）
   */
  static processProtobufResponse(data: any, headers: any, config: ICustomAxiosConfig<any>): any {
    const protobufConfig = config.protobuf
    const contentType = headers['content-type'] || ''

    // 处理二进制 Protobuf 响应
    if (contentType.includes('application/x-protobuf') && protobufConfig?.responseMessageType) {
      try {
        if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
          // 暂时降级为文本解码
          const decoder = new TextDecoder()
          const jsonString = decoder.decode(data instanceof ArrayBuffer ? new Uint8Array(data) : data)
          return {
            data: JSON.parse(jsonString),
            messageType: protobufConfig.responseMessageType,
            encoding: 'protobuf-binary'
          }
        }
      } catch (error) {
        console.warn('Protobuf 二进制反序列化失败，降级为 JSON 处理:', error)
      }
    }

    // 处理 JSON 格式的 Protobuf 响应
    if (contentType.includes('application/json') && protobufConfig?.responseMessageType) {
      return {
        data: data,
        messageType: protobufConfig.responseMessageType,
        encoding: 'json'
      }
    }

    return data
  }

  /**
   * 创建 Protobuf 配置的辅助方法
   */
  static createConfig(options: { requestType?: string; responseType?: string; useBinary?: boolean }): ProtobufTransformConfig {
    return {
      useProtobuf: true,
      requestMessageType: options.requestType,
      responseMessageType: options.responseType,
      forceBinary: options.useBinary || false
    }
  }
}

const loginUrls = ['/auth/v3/login', '/auth/v3/sendSmsCode', '/auth/v3/logout', '/auth/v3/api/verify-token']

// 解构CancelToken 对象 以及 是否是取消错误方法
// const { CancelToken, isCancel } = axios
const pendingMap = new PendingMap()

/* 实例化请求配置 */
const instance = axios.create({
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
  // 请求时长
  // timeout: 1000 * 10,
  // 表示跨域请求时是否需要使用凭证
  withCredentials: false,
  // 设置基础URL
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // 添加数据转换器
  transformRequest: [ProtobufTransformers.requestTransformer, ...(Array.isArray(axios.defaults.transformRequest) ? axios.defaults.transformRequest : [])],
  transformResponse: [...(Array.isArray(axios.defaults.transformResponse) ? axios.defaults.transformResponse : []), ProtobufTransformers.responseTransformer]
})

/**
 * 请求拦截器
 * 每次请求前，如果存在token则在请求头中携带token
 */
instance.interceptors.request.use(
  (config) => {
    // TODO 若非同域名请求，需要前端获取cookie后塞入header头中
    // TODO 若是同域名请求，header头会带入该域名下所有cookie，无需再处理
    const headers: RawAxiosRequestHeaders = {}

    // 获取并添加JWT token到请求头
    const userStore = useUserStore()
    const token = userStore.authToken
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Protobuf 请求特殊处理
    const protobufConfig = (config as ICustomAxiosConfig<any>).protobuf
    if (protobufConfig?.useProtobuf && ProtobufTransformers.isProtobufInterface(config.data)) {
      if (protobufConfig.forceBinary) {
        headers['Content-Type'] = 'application/x-protobuf'
        headers['Accept'] = 'application/x-protobuf'
      } else {
        headers['Content-Type'] = 'application/json;charset=UTF-8'
        headers['Accept'] = 'application/json'
      }
      // 处理 Protobuf 数据
      config.data = ProtobufTransformers.processProtobufRequest(config.data, config as ICustomAxiosConfig<any>)
    } else if (config.data instanceof FormData && config.url) {
      headers['Content-Type'] = 'multipart/form-data'
    }

    config.headers = { ...config.headers, ...headers } as AxiosRequestHeaders

    // console.log("config.header---", config.headers, config.url);
    const configUrl = config.url?.replace(/\?.*/, '') // 过滤掉多余的/
    // 拼接时间戳
    if (!(config as ICustomAxiosConfig<unknown>).noTimestamp) {
      config.params = {
        ...config.params,
        timestamp: Date.now()
      }
    }
    if (configUrl && loginUrls.includes(configUrl)) {
      // 登录相关接口的特殊处理
    }

    pendingMap.cancelPending(config)
    pendingMap.addPending(config)

    return config
  },
  (error) => {
    console.error(error.data.error.message)
    return Promise.reject(error.data.error.message)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 2xx 请求成功
    const { config } = response
    pendingMap.removePending(config)

    // Protobuf 响应处理
    const protobufConfig = (config as ICustomAxiosConfig<any>).protobuf
    if (protobufConfig?.useProtobuf) {
      response.data = ProtobufTransformers.processProtobufResponse(response.data, response.headers, config as ICustomAxiosConfig<any>)
    }

    return response
  },
  (error) => {
    // 从请求队列中移除当前请求
    if (error.response?.config) {
      pendingMap.removePending(error.response.config)
    }

    // 保留重试逻辑
    if (error.response) {
      const _config = error.response.config as ICustomAxiosConfig<any>
      const status = error.response.status

      // 对于非认证/权限错误，尝试重试
      if (![401, 403, 404].includes(status) && _config?.retry && (_config.retryMaxCount || 0) > 0) {
        // 设置用于跟踪重试计数的变量
        _config.__retryCount = _config.__retryCount || 0
        // 检查是否已经把重试的总数用完
        if (_config.__retryCount >= (_config.retryMaxCount || 0)) {
          return Promise.reject(error)
        }
        // 增加重试计数
        _config.__retryCount++

        console.log(`请求重试 ${_config.__retryCount}/${_config.retryMaxCount}: ${error.config?.url}`)

        // 创造新的Promise来处理计数后退
        const backoff = new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve()
          }, _config.retryRelay || 1000)
        })

        // instance重试请求的Promise
        return backoff.then(() => {
          return instance(_config)
        })
      }
    }

    return Promise.reject(error)
  }
)

// Q是请求data类型，R是响应data类型
const request = async <Q = any, R = any>(config: string | AxiosRequestConfig<Q>, options?: ICustomAxiosConfig<Q>) => {
  if (typeof config === 'string') {
    if (!options) {
      return instance.request<ResResult<R>>({
        url: config
      })
      // throw new Error('请配置正确的请求参数');
    }
    return instance.request<ResResult<R>>({
      url: config,
      ...options
    })
  }
  return instance.request<ResResult<R>>({ ...config, ...options })
}

// 统一处理响应
function handleResponseResult<Q = any, R = any>(data: ResResult<R>, config: ICustomAxiosConfig<Q>): boolean {
  // 错误处理
  if (data.code !== 200) {
    // 不需要显示提示文案
    const { disableErrorMsg } = config
    if (!disableErrorMsg) {
      // 此处默认展示提示信息
      if (data.msg) {
        window.$message.error(data.msg)
      }
    }
    return false
  }
  return true
}

export async function get<Q = any, R = any>(url: string, options?: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'GET', ...options })
    // console.log('2501 response===>', response)
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error) {
    return [null, error]
  }
}

export async function post<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'POST', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error) {
    return [null, error]
  }
}

export async function put<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'PUT', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error) {
    return [null, error]
  }
}

export async function del<Q = any, R = any>(url: string, options?: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'DELETE', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error) {
    return [null, error]
  }
}

export async function patch<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'PATCH', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error) {
    return [null, error]
  }
}
// const api_example2 = (data: string) => post('/api/example2', { data: 'aaa' })
// const api_example = (req: 'name') => post<'string'>('api/example', { data: 'name' })
// const [res, err] = await api_example('name')

// 导出 Protobuf 工具类和错误处理器供外部使用
export { ProtobufTransformers }

// 只需要考虑单一职责，这块只封装axios
export default instance
