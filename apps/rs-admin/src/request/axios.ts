// index.ts
import axios, { isCancel } from 'axios'
import type { RawAxiosRequestHeaders, AxiosRequestHeaders, AxiosResponse, AxiosRequestConfig } from 'axios'
import { PendingMap } from './cancelToken'

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

// 解构CancelToken 对象 以及 是否是取消错误方法
// const { CancelToken, isCancel } = axios
const pendingMap = new PendingMap()

/**
 * 请求失败后的错误统一处理
 * @param {Number} status 请求失败的状态码
 */
const errorHandle = (status: number, other?: string, errorCode?: string) => {
	// 状态码判断
	switch (status) {
		case 302:
			console.error('接口重定向了！')
			break
		case 400:
			console.error('发出的请求有错误，服务器没有进行新建或修改数据的操作:' + status)
			break
		// 401: 未登录
		// 未登录则跳转登录页面，并携带当前页面的路径
		// 在登录成功后返回当前页面，这一步需要在登录页操作。
		case 401: //重定向
			console.error('token:登录失效:' + errorCode)
			// createLogin()
			break
		// 403 token过期
		// 清除token并跳转登录页
		case 403:
			console.error(`${other}:` + status)
			if (!isCancel(other)) {
				// Emitter.emit(MITT_GLOBAL_MSG, {
				// 	msg: `${errorCode || status}，${other || '鉴权失败，无权限访问该接口'}`,
				// 	type: 'alert',
				// })
			}
			break
		case 404:
			console.error('网络请求不存在:' + status)
			break
		case 406:
			console.error('请求的格式不可得:' + status)
			break
		case 408:
			console.error(' 请求超时！')
			if (!isCancel(other)) {
				// Emitter.emit(MITT_GLOBAL_MSG, {
				// 	msg: '请求超时！' + other,
				// 	type: 'alert',
				// })
			}

			break
		case 410:
			console.error('请求的资源被永久删除，且不会再得到的:' + status)
			break
		case 422:
			console.error('当创建一个对象时，发生一个验证错误:' + status)
			break
		case 500:
			console.error('服务器发生错误，请检查服务器:' + status)
			break
		case 502:
			console.error('网关错误:' + status)
			break
		case 503:
			console.error('服务不可用，服务器暂时过载或维护:' + status)
			break
		case 504:
			console.error('网关超时:' + status)
			break
		default:
			console.error('其他错误错误:' + status)
	}
}

/* 实例化请求配置 */
const instance = axios.create({
	// headers: {
	// 	'Content-Type': 'application/json;charset=UTF-8',
	// 	// "Access-Control-Allow-Origin-Type": "*",
	// },
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', // 简单请求header标识
  },

	// 请求时长
	timeout: 1000 * 10,
	// TODO 请求的base地址 根据不同的模块调不同的api
	// baseURL: `${location.protocol}//ngw.${getEnv()}enmonster.com`,
	// 表示跨域请求时是否需要使用凭证
	withCredentials: true,
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

		// headers.Auth = cookie.get(`${initConfig().tokenName}`) || ''
		// headers['agentNo'] = cookie.get('agentNo') || ''
		// headers['userView'] = cookie.get('usingView') || ''
		// headers['resCode'] = getResCode(config.headers) || ''
		if (config.data instanceof FormData && config.url) {
			headers['Content-Type'] = 'multipart/form-data'
		}

		config.headers = { ...config.headers, ...headers } as AxiosRequestHeaders

		// console.log("config.header---", config.headers, config.url);
		const configUrl = config.url?.replace(/\?.*/, '') // 过滤掉多余的/
    // TODO 拼接时间戳
    if (!(config as ICustomAxiosConfig<unknown>).noTimestamp) {
      config.params = {
        ...config.params,
        timestamp: Date.now(),
      }
    }
		if (configUrl && loginUrls.includes(configUrl)) {

		}
    // test
    config.url = `https://guanli-platform.qimao.com${config.url}`;

    pendingMap.cancelPending(config)
    pendingMap.addPending(config)

		return config
	},
	error => {
		console.error(error.data.error.message)
		return Promise.reject(error.data.error.message)
	},
)

// 响应拦截器
instance.interceptors.response.use(
	(response) => {
		// 2xx 请求成功
		const { config } = response
    pendingMap.removePending(config);

    return response
	},
	(error) => {
		const { response }: {response: AxiosResponse} = error

		if (response) {
      const { config, status, data = {} } = response
			/**
       * 接口抛出异常时，从错误信息中解析出请求唯一标志，并从请求队列中将其删除
      */
      pendingMap.removePending(config)
			const { errorMessage = '', errorCode = '' } = data
			errorHandle(status, errorMessage, errorCode)

			const _config = response.config as ICustomAxiosConfig<any>
			if (![401, 403, 404].includes(status)) {
				// 超时重新请求
				// 全局的请求次数,请求的间隙
				if (_config && _config.retry && (_config.retryMaxCount || 0) > 0) {
					// 设置用于跟踪重试计数的变量
					_config.__retryCount = _config.__retryCount || 0
					// 检查是否已经把重试的总数用完
					if (_config.__retryCount >= (_config.retryMaxCount || 0)) {
						return Promise.reject(response || { message: error.message || '网络异常' })
					}
					// 增加重试计数
					_config.__retryCount++

					// 创造新的Promise来处理计数后退
					const backoff = new Promise<void>(resolve => {
						setTimeout(() => {
							resolve()
						}, _config.retryRelay || 1)
					})

					// instance重试请求的Promise
					return backoff.then(() => {
						return instance(config)
					})
				}
			}
			return Promise.reject(response)
		} else {
			// 处理断网的情况 || 超时 || 接口跨域
			// eg:请求超时或断网时，更新state的network状态
			// network状态在app.vue中控制着一个全局的断网提示组件的显示隐藏
			// 后续增加断网情况下做的一些操作
			// store.commit('networkState', false);
			errorHandle(408, error)
			return Promise.reject(error)
		}
	},
)

// Q是请求data类型，R是响应data类型
const request = async <Q = any, R = any>(config: string | AxiosRequestConfig<Q>, options?: ICustomAxiosConfig<Q>) => {
	if (typeof config === 'string') {
		if (!options) {
			return instance.request<ResResult<R>>({
				url: config,
			})
			// throw new Error('请配置正确的请求参数');
		}
		return instance.request<ResResult<R>>({
			url: config,
			...options,
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
      data.msg && window.$message.error(data.msg)
    }
    return false
  }
  return true
}

export async function get<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>): Promise<[ResResult<R>, null] | [null, any]> {
    try {
        const response = await request<Q, R>(url, { method: 'GET', ...(options || {}) })
        // console.log('2501 response===>', response)
        const { data, config } = response
        handleResponseResult<Q, R>(data, config)

        return [data, null]
      } catch (error) {
        return [null, error]
    }
}

export async function post<Q = any, R = any>(url: string, options: ICustomAxiosConfig<Q>):  Promise<[ResResult<R>, null] | [null, any]> {
    try {
        const response = await request<Q, R>(url, { method: 'POST', ...(options || {}) })
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

// 只需要考虑单一职责，这块只封装axios
export default instance
