// index.ts
import axios from 'axios'
import type { AxiosRequestConfig, AxiosRequestHeaders, RawAxiosRequestHeaders } from 'axios'
import { PendingMap } from './cancelToken'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

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
}

const loginUrls = ['/auth/v3/login', '/auth/v3/sendSmsCode', '/auth/v3/logout', '/auth/v3/api/verify-token']

// 401 退登防抖处理 - 防止多个并发请求同时触发退登
let isLoggingOut = false

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
  withCredentials: false
  // 设置基础URL
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
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

    if (config.data instanceof FormData && config.url) {
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

    // 如果响应错误则抛出错误
    if (response.data.code !== 200 || response.data.success !== true) {
      return Promise.reject(response)
    }
    return response
  },
  async (error) => {
    // 从请求队列中移除当前请求
    if (error.response?.config) {
      pendingMap.removePending(error.response.config)
    }

    // 处理 401 未授权错误 - 自动退登
    if (error.response?.status === 401) {
      const userStore = useUserStore()

      // 防抖处理：避免多个 401 请求同时触发退登
      if (isLoggingOut) {
        console.log('退登操作正在进行中，跳过重复处理')
        return Promise.reject(error)
      }

      // 检查当前是否已登录，避免重复处理
      if (userStore.isLoggedIn) {
        isLoggingOut = true
        console.log('检测到 401 错误，执行自动退登')

        try {
          // 执行退登操作
          await userStore.logout()

          // 显示提示信息
          window.$message?.warning('登录已过期，请重新登录')

          // 跳转到登录页面，保存当前路径用于登录后跳转
          const currentPath = router.currentRoute.value.fullPath
          if (currentPath !== '/login') {
            await router.push({
              path: '/login',
              query: { redirect: currentPath }
            })
          }
        } catch (logoutError) {
          console.error('自动退登失败:', logoutError)
          // 即使退登失败，也要跳转到登录页
          try {
            await router.push('/login')
          } catch (routerError) {
            console.error('路由跳转失败:', routerError)
            // 强制刷新页面作为最后的兜底方案
            window.location.href = '/login'
          }
        } finally {
          // 重置防抖标志，延迟一段时间防止快速重复
          setTimeout(() => {
            isLoggingOut = false
          }, 1000)
        }
      }

      return Promise.reject(error)
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
      if (data.message) {
        window.$message.error(data.message)
      }
    }
    return false
  }
  return true
}

export async function get<Q = any, R = any>(url: string, options?: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'GET', ...options })
    console.log('2501 response===>', response)
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error: any) {
    console.error('2501 error===>', error)
    if (error) {
      const { data, config } = error
      if (data && config) {
        handleResponseResult<Q, R>(data, config)
      }
    }
    return [null, error]
  }
}

export async function post<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'POST', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error: any) {
    if (error.response) {
      const { data, config } = error.response
      handleResponseResult<Q, R>(data, config)
    }
    return [null, error]
  }
}

export async function put<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'PUT', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error: any) {
    if (error.response) {
      const { data, config } = error.response
      handleResponseResult<Q, R>(data, config)
    }
    return [null, error]
  }
}

export async function del<Q = any, R = any>(url: string, options?: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'DELETE', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error: any) {
    if (error.response) {
      const { data, config } = error.response
      handleResponseResult<Q, R>(data, config)
    }
    return [null, error]
  }
}

export async function patch<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
  try {
    const response = await request<Q, R>(url, { method: 'PATCH', ...options })
    const { data, config } = response
    handleResponseResult<Q, R>(data, config)

    return [data, null]
  } catch (error: any) {
    if (error.response) {
      const { data, config } = error.response
      handleResponseResult<Q, R>(data, config)
    }
    return [null, error]
  }
}
// const api_example2 = (data: string) => post('/api/example2', { data: 'aaa' })
// const api_example = (req: 'name') => post<'string'>('api/example', { data: 'name' })
// const [res, err] = await api_example('name')

/**
 * 重置退登状态 - 用于测试或特殊情况下的手动重置
 * @internal 仅供内部使用
 */
export const resetLogoutState = () => {
  isLoggingOut = false
}

/**
 * 获取当前退登状态 - 用于调试
 * @internal 仅供内部使用
 */
export const getLogoutState = () => {
  return isLoggingOut
}

// 只需要考虑单一职责，这块只封装axios
export default instance
