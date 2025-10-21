import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// 从环境变量中获取存储前缀，如果不存在则使用默认值
const storagePrefix = import.meta.env.VITE_STORAGE_PREFIX || 'naive_admin'

const Pinia = createPinia()

Pinia.use(
  createPersistedState({
    storage: localStorage,
    key: (id) => `${storagePrefix}_${id}`
  })
)

export default Pinia
