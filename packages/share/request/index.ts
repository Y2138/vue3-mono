// index.ts
import axios from "axios";
import type {
  AxiosInstance,
  RawAxiosRequestHeaders,
  AxiosRequestHeaders,
  AxiosResponse,
} from "axios";

// 解构CancelToken 对象 以及 是否是取消错误方法
const { CancelToken, isCancel } = axios;

/**
 * 请求失败后的错误统一处理
 * @param {Number} status 请求失败的状态码
 */
const errorHandle = (status: number, other: string, errorCode?: string) => {
  // 状态码判断
  switch (status) {
    case 302:
      console.error("接口重定向了！");
      break;
    case 400:
      console.error(
        "发出的请求有错误，服务器没有进行新建或修改数据的操作:" + status
      );
      break;
    // 401: 未登陆
    case 401: //重定向
      console.error("token:登录失效:" + errorCode);
      // 未登录则跳转登录页面，并携带当前页面的路径

      break;
    // 403 无权限
    // 清除token并跳转登录页
    case 403:
      console.error(`${other}:` + status);
      // store.commit('token', null);
      // createLogin();
      break;
    case 404:
      console.error("网络请求不存在:" + status);
      break;
    case 406:
      console.error("请求的格式不可得:" + status);
      break;
    case 408:
      console.error(" 请求超时！");
      if (!isCancel(other)) {
      }

      break;
    case 410:
      console.error("请求的资源被永久删除，且不会再得到的:" + status);
      break;
    case 422:
      console.error("当创建一个对象时，发生一个验证错误:" + status);
      break;
    case 500:
      console.error("服务器发生错误，请检查服务器:" + status);
      break;
    case 502:
      console.error("网关错误:" + status);
      break;
    case 503:
      console.error("服务不可用，服务器暂时过载或维护:" + status);
      break;
    case 504:
      console.error("网关超时:" + status);
      break;
    default:
      console.error("其他错误错误:" + status);
  }
};

// 定义接口
interface PendingType {
  url?: string;
  method?: any;
  params: any;
  data: any;
  cancel: any;
}
// 取消重复请求
const pending: Array<PendingType> = [];
// CancelToken = axios.CancelToken,
// 移除重复请求
const removePending = (config: any) => {
  for (const key in pending) {
    const item = Number(key),
      list: PendingType = pending[key];
    // 当前请求在数组中存在时执行函数体
    if (
      list.url === config.url &&
      list.method === config.method &&
      JSON.stringify(list.params) === JSON.stringify(config.params) &&
      JSON.stringify(list.data) === JSON.stringify(config.data)
    ) {
      // 执行取消操作
      list.cancel("操作太频繁，请稍后再试");
      // 从数组中移除记录
      pending.splice(item, 1);
    }
  }
};
/** 自定义 header 头内容 */
const headers: RawAxiosRequestHeaders = {};
/* 实例化请求配置 */
const instance = axios.create({
  headers: {
    // post 传输请求头一定要这个 不然报错 接收不到值
    "Content-Type": "application/json;charset=UTF-8",
    // "Access-Control-Allow-Origin-Type": "*",
    ...headers,
  },

  // 请求时长
  timeout: 1000 * 10,
  // 请求的base地址 TODO:这块以后根据不同的模块调不同的api
  baseURL: "",
  // 表示跨域请求时是否需要使用凭证
  withCredentials: true,
});

/**
 * 请求拦截器
 * 每次请求前，如果存在token则在请求头中携带token
 */
instance.interceptors.request.use(
  (config) => {
    removePending(config);
    config.cancelToken = new CancelToken((c) => {
      pending.push({
        url: config.url,
        method: config.method,
        params: config.params,
        data: config.data,
        cancel: c,
      });
    });

    if (config.data instanceof FormData && config.url) {
      headers["Content-Type"] = "multipart/form-data";
    }

    config.headers = {
      ...config.headers,
      ...headers,
    } as AxiosRequestHeaders;
    // console.log("config.header---", config.headers, config.url);

    return config;
  },
  (error) => {
    console.error(error.data.error.message);
    return Promise.reject(error.data.error.message);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: any) => {
    // 防重移除pending中的请求
    removePending(response.config);
    // 请求成功
    const { config = {}, data = {}, status } = response;

    if (status === 200) {
      if (data.success) {
        return Promise.resolve(data);
      }
      // 不需要显示提示文案
      const { noFalseMsg }: any = config;
      if (!noFalseMsg) {
        // 提示错误信息
      }

      return Promise.reject(data);
    } else {
      return Promise.reject(data);
    }
    // 请求失败
  },
  (error: any) => {
    const { response } = error;

    if (response) {
      /**
       * 接口抛出异常时，从错误信息中解析出请求唯一标志，并从请求队列中将其删除
       */
      const { config = {}, status, data = {} } = response;
      const { cancelToken } = config;
      const { errorMessage = "", errorCode = "" } = data;

      errorHandle(status, errorMessage, errorCode);
      if (![401, 403, 404].includes(status)) {
        // 超时重新请求
        const config = error.config,
          // 全局的请求次数,请求的间隙 配置可更改
          [RETRY_COUNT, RETRY_DELAY] = [1, 1000];

        if (config && RETRY_COUNT) {
          // 设置用于跟踪重试计数的变量
          config.__retryCount = config.__retryCount || 0;
          // 检查是否已经把重试的总数用完
          if (config.__retryCount >= RETRY_COUNT) {
            return Promise.reject(
              response || {
                message: error.message || "网络异常",
              }
            );
          }
          // 增加重试计数
          config.__retryCount++;
          // 创造新的Promise来处理指数后退
          const backoff = new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, RETRY_DELAY || 1);
          });
          // instance重试请求的Promise
          return backoff.then(() => {
            return instance(config);
          });
        }
      }
      return Promise.reject(response);
    } else {
      // 处理断网的情况 || 超时 || 接口跨域
      // eg:请求超时或断网时，更新state的network状态
      // network状态在app.vue中控制着一个全局的断网提示组件的显示隐藏
      // 后续增加断网情况下做的一些操作
      // store.commit('networkState', false);
      errorHandle(408, error);
      return Promise.reject(error);
    }
  }
);
// 单例 只需要考虑单一职责，这块只封装axios
export default instance;
const request = <T = any>(config: any, options?: any): Promise<T> => {
  if (typeof config === "string") {
    if (!options) {
      return instance.request({
        url: config,
      });
      // throw new Error('请配置正确的请求参数');
    }
    return instance.request({
      url: config,
      ...options,
    });
  }
  return instance.request({ ...config, ...options });
};

// 利用函数重载
function toAwait<T>(
  promise: Promise<ResResult<T>>
): Promise<[ResResult<T>, null]>;
function toAwait<T>(
  promise: Promise<ResResult<T>>
): Promise<[ResResult<undefined>, any]>;
async function toAwait<T>(promise: Promise<ResResult<T>>) {
  try {
    const data = await promise;
    const result: [ResResult<T>, null] = [data, null];
    return result;
  } catch (error) {
    const result_1: [ResResult<undefined>, any] = [{ data: undefined }, error];
    return result_1;
  }
}

export function get<T = any>(config: any, options?: any) {
  const get = request({ ...config, method: "GET" }, options);
  return toAwait<T>(get);
}

export function post<T = any>(config: any, options?: any) {
  const post = request({ ...config, method: "POST" }, options);
  return toAwait<T>(post);
}

// axios请求返回类型
type axiosResType<T> = Promise<
  [ResResult<undefined>, any] | [ResResult<T>, null]
>;

export type { AxiosInstance, AxiosResponse, axiosResType };
