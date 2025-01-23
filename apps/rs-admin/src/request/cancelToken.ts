import type { InternalAxiosRequestConfig, Canceler } from 'axios'
import axios from 'axios'

export class PendingMap {
    pendingMap: Map<string, Canceler>
    constructor() {
        this.pendingMap = new Map()
    }
    // 获取每个请求的key
    getPendingKey(config: InternalAxiosRequestConfig) {
        let { url, method, params, data, } = config;
        if (typeof data === 'string') data = JSON.parse(data); // response里面返回的config.data是个字符串对象
        if (method?.toUpperCase() === 'GET') {
            return ['cancelAxios', url, method].join('&');
        } else {
            return ['cancelAxios', url, method, JSON.stringify(params), JSON.stringify(data)].join('&');
        }
    }
    // 添加pending标识
    addPending(config: InternalAxiosRequestConfig) {
        const pendingKey = this.getPendingKey(config);
        config.cancelToken = config.cancelToken || new axios.CancelToken(
            (cancel) => {
                // 为每个请求添加取消方法
                if (!this.pendingMap.has(pendingKey)) {
                    this.pendingMap.set(pendingKey, cancel);
                }
            }
        );
    }
    // 若有重复请求，则取消重复的请求并删除
    cancelPending(config: InternalAxiosRequestConfig) {
        const pendingKey = this.getPendingKey(config);
        if (this.pendingMap.has(pendingKey)) {
            const cancelToken = this.pendingMap.get(pendingKey);
            cancelToken && cancelToken(pendingKey);
            this.pendingMap.delete(pendingKey);
        }
    }
    // 删除重复的请求
    removePending(config: InternalAxiosRequestConfig) {
        const pendingKey = this.getPendingKey(config);
        if (this.pendingMap.has(pendingKey)) {
            this.pendingMap.delete(pendingKey);
        }
    }
    // 清除所有pending请求
    clearAllPending() {
        if (this.pendingMap.size > 0) {
            for (const [key, cancelToken] of this.pendingMap) {
                cancelToken && cancelToken(key);
                this.pendingMap.delete(key);
            }
        }
    }
}
