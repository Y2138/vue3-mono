import { ref, Ref, onMounted, onUnmounted } from 'vue'
import { useGlobalStore } from '@/store/modules/global'
import { merge } from 'lodash-es'

/**
 * 枚举数据 hooks 选项
 */
export interface useEnumsOptions<T> {
  /**
   * 用于获取枚举数据的API函数
   */
  api: () => Promise<{ data: T }>

  /**
   * 缓存键名，用于在不同组件间共享数据
   * 如果不提供，则不进行缓存
   */
  key?: string

  /**
   * 是否在初始化时自动刷新数据
   * @default true
   */
  autoRefresh?: boolean

  /**
   * 默认值，在数据加载前使用
   * 如果API返回数据，将与默认值进行合并
   */
  defaultValue?: Partial<T>

  /**
   * 是否在组件卸载时清除缓存
   * @default false
   */
  clearOnUnmounted?: boolean
}

/**
 * 枚举数据 hooks 返回值
 */
export interface useEnumsReturn<T> {
  /**
   * 枚举数据
   */
  data: Ref<T>

  /**
   * 加载状态
   */
  loading: Ref<boolean>

  /**
   * 错误信息
   */
  error: Ref<Error | null>

  /**
   * 刷新数据方法
   */
  refresh: () => Promise<void>

  /**
   * 清除缓存方法
   */
  clearCache: () => void
}

/**
 * 通用枚举数据 hooks，用于获取和缓存枚举数据
 *
 * 🚀 新特性：自动并发控制
 * - 防止同一个 key 的多个实例同时发起请求
 * - 多个组件同时使用相同 key 时，只会发起一次网络请求
 * - 自动处理请求状态同步和错误处理
 *
 * @example
 * ```ts
 * // 基本用法
 * const { data, loading, error, refresh } = useEnums({
 *   api: () => defHttp2.copyright.getSelectOption(),
 *   key: 'copyright-enum',
 * });
 *
 * // 带默认值
 * const { data } = useEnums({
 *   api: () => defHttp2.copyright.getSelectOption(),
 *   key: 'copyright-enum',
 *   defaultValue: { status: [] },
 * });
 *
 * // 不默认刷新，使用缓存数据
 * const { data, refresh } = useEnums({
 *   api: () => defHttp2.copyright.getSelectOption(),
 *   key: 'copyright-enum',
 *   refresh: false,
 * });
 *
 * // 关闭组件卸载时清除缓存
 * const { data } = useEnums({
 *   api: () => defHttp2.copyright.getSelectOption(),
 *   key: 'copyright-enum',
 *   clearOnUnmounted: true,
 * });
 *
 * // 手动清空缓存
 * const { clearCache } = useEnums({
 *   api: () => defHttp2.copyright.getSelectOption(),
 *   key: 'copyright-enum',
 * });
 *
 * clearCache();
 * ```
 */
export function useEnums<T>(options: useEnumsOptions<T>): useEnumsReturn<T> {
  const { getEnums, setEnums, clearEnums, setEnumsRequest, getEnumsRequest, clearEnumsRequest } = useGlobalStore()

  const { api, key, autoRefresh = false, defaultValue, clearOnUnmounted = false } = options
  const data = ref<T>((defaultValue || {}) as T) as Ref<T>
  const loading = ref<boolean>(false)
  const error = ref<Error | null>(null)

  /**
   * 刷新数据
   */
  const refresh = async (): Promise<void> => {
    // 如果有缓存且缓存中有数据，直接使用缓存数据
    if (key && getEnums(key)) {
      data.value = getEnums(key)
      return
    }

    // 如果有正在进行的请求，等待请求完成并使用结果
    if (key && getEnumsRequest(key)) {
      try {
        loading.value = true
        await getEnumsRequest(key)
        // 请求完成后，从缓存中获取数据
        if (getEnums(key)) {
          data.value = getEnums(key)
        }
      } catch (err) {
        error.value = err as Error
        console.error('等待并发请求失败:', err)
      } finally {
        loading.value = false
      }
      return
    }

    // 执行新的请求
    const performRequest = async (): Promise<void> => {
      loading.value = true
      error.value = null

      try {
        const result = await api()
        console.log('1022 enums===>', result)
        // 如果有默认值，则合并数据
        if (defaultValue) {
          data.value = merge((defaultValue || {}) as T, result?.data || {})
        } else {
          data.value = result?.data || ({} as T)
        }
        console.log('1022 data.value===>', data.value)
        // 如果提供了缓存键，则缓存结果
        if (key) {
          setEnums(key, data.value)
        }
      } catch (err) {
        error.value = err as Error
        console.error('获取枚举数据失败:', err)
        throw err // 重新抛出错误，确保Promise状态正确
      } finally {
        loading.value = false
        // 清除请求状态
        if (key) {
          clearEnumsRequest(key)
        }
      }
    }

    // 创建并缓存请求Promise
    if (key) {
      const requestPromise = performRequest()
      setEnumsRequest(key, requestPromise)
      await requestPromise
    } else {
      // 没有缓存键的情况，直接执行请求
      await performRequest()
    }
  }

  // 如果设置了自动刷新，则在组件挂载时获取数据
  onMounted(() => {
    const cacheData = getEnums(key || '')
    data.value = cacheData || ({} as T)
    // console.log('0926 data.value ===> ', data.value);
    // console.log('0926 key ===> ', key);
    // console.log('0926 autoRefresh ===> ', autoRefresh);
    // console.log('0926 cacheData ===> ', cacheData);
    if (autoRefresh) {
      refresh()
    }
  })

  // 如果设置了组件卸载时清除缓存，则在组件卸载时清除缓存
  if (clearOnUnmounted && key) {
    onUnmounted(() => {
      clearCache()
    })
  }

  /**
   * 清除当前缓存
   */
  const clearCache = () => {
    if (key) {
      clearEnums(key)
      clearEnumsRequest(key)
    }
  }

  return {
    data,
    loading,
    error,
    refresh,
    clearCache
  }
}
