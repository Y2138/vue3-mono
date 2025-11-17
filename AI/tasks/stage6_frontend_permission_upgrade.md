# 阶段6：前端权限改造执行计划

## 任务描述
完全重新实现前端权限认证系统，基于后端权限改造结果，实现完整的权限认证架构。重点实现路由认证守卫、权限组件和权限指令，为前端提供完整的权限控制能力。

## 背景分析
- 阶段1-5已完成资源管理、角色管理和后端权限系统
- 后端已提供完整的权限检查API
- 前端需要实现与后端一致的权限控制逻辑
- 需要实现基于URL的自动权限码生成
- 支持路由守卫、组件权限控制、指令级权限控制

## 核心需求
1. 实现路由认证守卫
2. 实现权限验证组合式函数
3. 实现权限状态管理
4. 实现权限组件（PermissionContainer等）
5. 实现权限指令（v-permission、v-role）
6. 实现页面级权限控制
7. 实现按钮级权限控制
8. 实现菜单级权限控制
9. 集成后端权限API
10. 实现权限缓存和预加载

## 详细实施计划

### 1. 权限验证组合式函数
**目标**: 提供完整的权限验证API

**具体任务**:
- [ ] 实现usePermission验证函数
- [ ] 实现useRole验证函数
- [ ] 实现批量权限检查函数
- [ ] 实现权限缓存管理
- [ ] 实现权限预加载机制

**⚠️ 重要：proto文件类型依赖要求**
- 所有权限相关API类型定义必须依赖 `protos/rbac.proto` 生成的类型
- 前端类型文件从共享类型文件 `src/shared/` 引入，禁止手动定义
- 前端API接口与后端RPC服务完全对应
- 禁止使用 any 类型，所有请求响应必须有类型定义
- 权限验证相关RPC方法：
  - `VerifyPermission` (验证权限)
  - `VerifyResourceAccess` (验证资源访问)
  - `GetUserPermissions` (获取用户权限)
  - `GetResourcePermissionCode` (获取资源权限码)
  - `CheckMultiplePermissions` (批量验证权限)

**API服务层设计**:
```typescript
// 权限服务API - 类型完全依赖 proto 文件生成
export const permissionApi = {
  // 验证权限 - 对应 proto 中的 VerifyPermissionRequest/Response
  verifyPermission: (data: SharedTypes.VerifyPermissionRequest) => 
    post<SharedTypes.VerifyPermissionResponse>('/api/permissions/verify', data),

  // 验证资源访问 - 对应 proto 中的 VerifyResourceAccessRequest/Response
  verifyResourceAccess: (data: SharedTypes.VerifyResourceAccessRequest) => 
    post<SharedTypes.VerifyResourceAccessResponse>('/api/permissions/resource-access', data),

  // 获取用户权限 - 对应 proto 中的 GetUserPermissionsRequest/Response
  getUserPermissions: (userId: string) => 
    get<SharedTypes.GetUserPermissionsResponse>(`/api/users/${userId}/permissions`),

  // 获取资源权限码 - 对应 proto 中的 GetResourcePermissionCodeRequest/Response
  getResourcePermissionCode: (data: SharedTypes.GetResourcePermissionCodeRequest) => 
    post<SharedTypes.GetResourcePermissionCodeResponse>('/api/permissions/resource-code', data),

  // 批量验证权限 - 对应 proto 中的 CheckMultiplePermissionsRequest/Response
  batchCheckPermissions: (data: SharedTypes.CheckMultiplePermissionsRequest) => 
    post<SharedTypes.CheckMultiplePermissionsResponse>('/api/permissions/batch-verify', data),
}
```

**函数设计**:
```typescript
// 权限验证核心函数
export function usePermission() {
  const { post } = useAxios()
  const permissionCache = useRef(new Map<string, boolean>())
  const isLoading = ref(false)

  /**
   * 检查单个权限
   */
  const checkPermission = async (
    url: string, 
    method: string = 'GET'
  ): Promise<boolean> => {
    const cacheKey = `${method}:${url}`
    
    // 先检查缓存
    if (permissionCache.value.has(cacheKey)) {
      return permissionCache.value.get(cacheKey)!
    }

    try {
      isLoading.value = true
      const [result, error] = await post('/api/permissions/check', {
        url,
        method
      })

      if (error) {
        console.error('权限检查失败:', error)
        return false
      }

      const hasPermission = result.data.hasPermission
      permissionCache.value.set(cacheKey, hasPermission)
      
      return hasPermission
    } catch (err) {
      console.error('权限检查异常:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 检查多个权限（任一通过）
   */
  const checkAnyPermission = async (
    permissions: Array<{ url: string; method?: string }>
  ): Promise<boolean> => {
    for (const permission of permissions) {
      const hasPermission = await checkPermission(
        permission.url, 
        permission.method || 'GET'
      )
      if (hasPermission) {
        return true
      }
    }
    return false
  }

  /**
   * 检查多个权限（全部通过）
   */
  const checkAllPermissions = async (
    permissions: Array<{ url: string; method?: string }>
  ): Promise<boolean> => {
    for (const permission of permissions) {
      const hasPermission = await checkPermission(
        permission.url, 
        permission.method || 'GET'
      )
      if (!hasPermission) {
        return false
      }
    }
    return true
  }

  /**
   * 获取用户所有权限
   */
  const getUserPermissions = async (): Promise<string[]> => {
    try {
      const [result, error] = await get('/api/permissions/user/permissions')
      if (error) {
        console.error('获取用户权限失败:', error)
        return []
      }
      return result.data || []
    } catch (err) {
      console.error('获取用户权限异常:', err)
      return []
    }
  }

  /**
   * 清除权限缓存
   */
  const clearCache = (): void => {
    permissionCache.value.clear()
  }

  /**
   * 预热权限缓存
   */
  const warmupCache = async (urls: string[]): Promise<void> => {
    const promises = urls.map(url => checkPermission(url))
    await Promise.allSettled(promises)
  }

  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    getUserPermissions,
    clearCache,
    warmupCache,
    isLoading: readonly(isLoading)
  }
}
```

### 2. 角色验证组合式函数
**目标**: 提供角色验证功能

**具体任务**:
- [ ] 实现useRole验证函数
- [ ] 实现角色缓存管理
- [ ] 实现角色继承逻辑
- [ ] 实现角色权限计算

**函数设计**:
```typescript
export function useRole() {
  const { get } = useAxios()
  const roleCache = useRef(new Set<string>())
  const isLoading = ref(false)

  /**
   * 检查用户角色
   */
  const checkRole = async (roleName: string): Promise<boolean> => {
    // 先检查缓存
    if (roleCache.value.has(roleName)) {
      return true
    }

    try {
      isLoading.value = true
      const userRoles = await getUserRoles()
      const hasRole = userRoles.includes(roleName)
      
      if (hasRole) {
        roleCache.value.add(roleName)
      }
      
      return hasRole
    } catch (err) {
      console.error('角色检查异常:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 检查多个角色（任一拥有）
   */
  const checkAnyRole = async (roles: string[]): Promise<boolean> => {
    for (const role of roles) {
      if (await checkRole(role)) {
        return true
      }
    }
    return false
  }

  /**
   * 检查多个角色（全部拥有）
   */
  const checkAllRoles = async (roles: string[]): Promise<boolean> => {
    for (const role of roles) {
      if (!await checkRole(role)) {
        return false
      }
    }
    return true
  }

  /**
   * 获取用户所有角色
   */
  const getUserRoles = async (): Promise<string[]> => {
    try {
      const [result, error] = await get('/api/users/profile')
      if (error) {
        console.error('获取用户角色失败:', error)
        return []
      }
      return result.data.roles || []
    } catch (err) {
      console.error('获取用户角色异常:', err)
      return []
    }
  }

  /**
   * 清除角色缓存
   */
  const clearCache = (): void => {
    roleCache.value.clear()
  }

  return {
    checkRole,
    checkAnyRole,
    checkAllRoles,
    getUserRoles,
    clearCache,
    isLoading: readonly(isLoading)
  }
}
```

### 3. 权限状态管理
**目标**: 实现全局权限状态管理

**具体任务**:
- [ ] 设计PermissionStore状态结构
- [ ] 实现权限状态同步
- [ ] 实现权限缓存管理
- [ ] 实现权限数据预加载

**Store设计**:
```typescript
// 权限状态管理
export const usePermissionStore = defineStore('permission', () => {
  // 状态
  const userPermissions = ref<Set<string>>(new Set())
  const userRoles = ref<Set<string>>(new Set())
  const permissionCache = ref<Map<string, boolean>>(new Map())
  const roleCache = ref<Set<string>>(new Set())
  const isLoading = ref(false)
  const lastUpdateTime = ref<Date | null>(null)

  // 计算属性
  const hasPermission = computed(() => (url: string, method: string = 'GET') => {
    const permissionKey = `${method}:${url}`
    return permissionCache.value.get(permissionKey) || false
  })

  const hasRole = computed(() => (role: string) => {
    return roleCache.value.has(role)
  })

  const isAdmin = computed(() => {
    return userRoles.value.has('admin') || hasPermission('*', '*')
  })

  // 方法
  const checkPermission = async (url: string, method: string = 'GET'): Promise<boolean> => {
    const permissionKey = `${method}:${url}`
    
    // 检查缓存
    if (permissionCache.value.has(permissionKey)) {
      return permissionCache.value.get(permissionKey)!
    }

    try {
      isLoading.value = true
      const { checkPermission } = usePermission()
      const hasPermission = await checkPermission(url, method)
      
      permissionCache.value.set(permissionKey, hasPermission)
      
      // 如果有新权限，更新用户权限列表
      if (hasPermission && !userPermissions.value.has(permissionKey)) {
        userPermissions.value.add(permissionKey)
        lastUpdateTime.value = new Date()
      }
      
      return hasPermission
    } catch (error) {
      console.error('权限检查失败:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const checkRole = async (role: string): Promise<boolean> => {
    // 检查缓存
    if (roleCache.value.has(role)) {
      return true
    }

    try {
      const { checkRole } = useRole()
      const hasRole = await checkRole(role)
      
      if (hasRole) {
        roleCache.value.add(role)
        userRoles.value.add(role)
        lastUpdateTime.value = new Date()
      }
      
      return hasRole
    } catch (error) {
      console.error('角色检查失败:', error)
      return false
    }
  }

  const loadUserPermissions = async (): Promise<void> => {
    try {
      isLoading.value = true
      const { getUserPermissions } = usePermission()
      const permissions = await getUserPermissions()
      
      userPermissions.value = new Set(permissions)
      permissions.forEach(permission => {
        permissionCache.value.set(permission, true)
      })
      
      lastUpdateTime.value = new Date()
    } catch (error) {
      console.error('加载用户权限失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  const loadUserRoles = async (): Promise<void> => {
    try {
      const { getUserRoles } = useRole()
      const roles = await getUserRoles()
      
      userRoles.value = new Set(roles)
      roles.forEach(role => {
        roleCache.value.add(role)
      })
    } catch (error) {
      console.error('加载用户角色失败:', error)
    }
  }

  const refreshPermissions = async (): Promise<void> => {
    await Promise.all([
      loadUserPermissions(),
      loadUserRoles()
    ])
  }

  const clearCache = (): void => {
    permissionCache.value.clear()
    roleCache.value.clear()
  }

  const reset = (): void => {
    userPermissions.value.clear()
    userRoles.value.clear()
    permissionCache.value.clear()
    roleCache.value.clear()
    lastUpdateTime.value = null
  }

  return {
    // 状态
    userPermissions: readonly(userPermissions),
    userRoles: readonly(userRoles),
    permissionCache: readonly(permissionCache),
    roleCache: readonly(roleCache),
    isLoading: readonly(isLoading),
    lastUpdateTime: readonly(lastUpdateTime),
    
    // 计算属性
    hasPermission,
    hasRole,
    isAdmin,
    
    // 方法
    checkPermission,
    checkRole,
    loadUserPermissions,
    loadUserRoles,
    refreshPermissions,
    clearCache,
    reset
  }
})
```

### 4. 路由守卫实现
**目标**: 实现前端路由权限控制

**具体任务**:
- [ ] 实现路由权限检查
- [ ] 实现动态路由权限验证
- [ ] 实现路由权限缓存
- [ ] 实现权限不足页面
- [ ] 实现权限预加载

**路由守卫实现**:
```typescript
// 路由权限守卫
import { usePermissionStore } from '@/store/permission'
import { useUserStore } from '@/store/user'

export async function createPermissionGuard(router: Router) {
  const permissionStore = usePermissionStore()
  const userStore = useUserStore()

  router.beforeEach(async (to, from, next) => {
    // 检查是否需要认证
    const requiresAuth = to.meta.requiresAuth !== false
    
    if (!requiresAuth) {
      return next()
    }

    // 检查用户是否登录
    if (!userStore.isLoggedIn) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }

    // 预加载用户权限（如果还未加载）
    if (permissionStore.userPermissions.size === 0) {
      await permissionStore.refreshPermissions()
    }

    // 检查路由权限
    const hasAccess = await checkRoutePermission(to)
    
    if (hasAccess) {
      next()
    } else {
      next({
        name: '403',
        query: { redirect: to.fullPath }
      })
    }
  })
}

async function checkRoutePermission(route: Route): Promise<boolean> {
  const permissionStore = usePermissionStore()
  
  // 检查路由定义的权限要求
  const requiredPermissions = route.meta.permissions as string[] | undefined
  const requiredRoles = route.meta.roles as string[] | undefined

  // 如果没有权限要求，则允许访问
  if (!requiredPermissions && !requiredRoles) {
    return true
  }

  // 检查角色要求
  if (requiredRoles) {
    for (const role of requiredRoles) {
      if (await permissionStore.checkRole(role)) {
        continue // 拥有此角色，继续检查下一个
      }
      return false // 没有必需角色，拒绝访问
    }
  }

  // 检查权限要求
  if (requiredPermissions) {
    for (const permission of requiredPermissions) {
      const [method, url] = parsePermissionString(permission)
      if (await permissionStore.checkPermission(url, method)) {
        continue // 拥有此权限，继续检查下一个
      }
      return false // 没有必需权限，拒绝访问
    }
  }

  return true
}

function parsePermissionString(permission: string): [string, string] {
  // 格式: "METHOD:url" 或 "url" (默认为GET)
  if (permission.includes(':')) {
    const [method, url] = permission.split(':', 2)
    return [method.toUpperCase(), url]
  }
  return ['GET', permission]
}
```

### 5. 权限组件实现
**目标**: 提供可复用的权限控制组件

**具体任务**:
- [ ] 实现PermissionContainer组件
- [ ] 实现RoleContainer组件
- [ ] 实现PermissionSlot组件
- [ ] 实现权限条件组件
- [ ] 实现权限切换组件

**PermissionContainer组件**:
```vue
<template>
  <div v-if="hasPermission">
    <slot />
  </div>
  <div v-else-if="fallback">
    <component :is="fallback" />
  </div>
</template>

<script setup lang="ts">
interface PermissionContainerProps {
  url: string
  method?: string
  fallback?: any
  autoCheck?: boolean
}

const props = withDefaults(defineProps<PermissionContainerProps>(), {
  method: 'GET',
  fallback: undefined,
  autoCheck: true
})

const permissionStore = usePermissionStore()
const hasPermission = ref(false)
const isLoading = ref(false)

// 检查权限
const checkPermissions = async () => {
  if (!props.autoCheck) {
    return
  }

  isLoading.value = true
  try {
    hasPermission.value = await permissionStore.checkPermission(
      props.url, 
      props.method
    )
  } catch (error) {
    console.error('权限检查失败:', error)
    hasPermission.value = false
  } finally {
    isLoading.value = false
  }
}

// 监听props变化，重新检查
watch(
  () => [props.url, props.method],
  checkPermissions,
  { immediate: true }
)

// 暴露方法给父组件
defineExpose({
  checkPermissions,
  hasPermission: readonly(hasPermission),
  isLoading: readonly(isLoading)
})
</script>
```

**RoleContainer组件**:
```vue
<template>
  <div v-if="hasRole">
    <slot />
  </div>
  <div v-else-if="fallback">
    <component :is="fallback" />
  </div>
</template>

<script setup lang="ts">
interface RoleContainerProps {
  role: string | string[]
  fallback?: any
  allRequired?: boolean // true: 必须拥有所有角色, false: 拥有任一角色即可
  autoCheck?: boolean
}

const props = withDefaults(defineProps<RoleContainerProps>(), {
  allRequired: false,
  fallback: undefined,
  autoCheck: true
})

const permissionStore = usePermissionStore()
const hasRole = ref(false)
const isLoading = ref(false)

const checkRole = async () => {
  if (!props.autoCheck) {
    return
  }

  isLoading.value = true
  try {
    const roles = Array.isArray(props.role) ? props.role : [props.role]
    
    if (props.allRequired) {
      // 检查是否拥有所有角色
      for (const role of roles) {
        if (!await permissionStore.checkRole(role)) {
          hasRole.value = false
          return
        }
      }
      hasRole.value = true
    } else {
      // 检查是否拥有任一角色
      hasRole.value = await roles.reduce(async (acc, role) => {
        const hasCurrentRole = await permissionStore.checkRole(role)
        return acc || hasCurrentRole
      }, Promise.resolve(false))
    }
  } catch (error) {
    console.error('角色检查失败:', error)
    hasRole.value = false
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.role, props.allRequired],
  checkRole,
  { immediate: true }
)

defineExpose({
  checkRole,
  hasRole: readonly(hasRole),
  isLoading: readonly(isLoading)
})
</script>
```

### 6. 权限指令实现
**目标**: 实现v-permission和v-role指令

**具体任务**:
- [ ] 实现v-permission指令
- [ ] 实现v-role指令
- [ ] 实现指令参数验证
- [ ] 实现指令缓存机制
- [ ] 实现指令性能优化

**指令实现**:
```typescript
// v-permission指令
export const vPermission = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const { checkPermission } = usePermission()
    
    // 验证指令参数
    const permissions = validatePermissionValue(value)
    if (!permissions) {
      console.warn('v-permission指令参数格式错误')
      return
    }

    // 检查权限并控制元素显示
    checkAndToggleElement(el, permissions, true)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    if (binding.value !== binding.oldValue) {
      const permissions = validatePermissionValue(binding.value)
      if (permissions) {
        checkAndToggleElement(el, permissions, binding.value !== binding.oldValue)
      }
    }
  }
}

// v-role指令
export const vRole = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const { checkAnyRole, checkAllRoles } = useRole()
    const allRequired = binding.modifiers.all
    
    // 验证指令参数
    const roles = validateRoleValue(value)
    if (!roles) {
      console.warn('v-role指令参数格式错误')
      return
    }

    // 检查角色并控制元素显示
    checkRoleAndToggleElement(el, roles, allRequired, true)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    if (binding.value !== binding.oldValue || binding.modifiers.all !== binding.oldModifiers?.all) {
      const roles = validateRoleValue(binding.value)
      if (roles) {
        checkRoleAndToggleElement(el, roles, binding.modifiers.all, binding.value !== binding.oldValue)
      }
    }
  }
}

// 验证权限值格式
function validatePermissionValue(value: any): Array<{ url: string; method?: string }> | null {
  if (typeof value === 'string') {
    // 单个权限
    const [method, url] = value.includes(':') ? value.split(':', 2) : ['GET', value]
    return [{ url, method: method.toUpperCase() }]
  } else if (Array.isArray(value)) {
    // 权限数组
    return value.map(item => {
      if (typeof item === 'string') {
        const [method, url] = item.includes(':') ? item.split(':', 2) : ['GET', item]
        return { url, method: method.toUpperCase() }
      } else if (typeof item === 'object' && item.url) {
        return { 
          url: item.url, 
          method: (item.method || 'GET').toUpperCase() 
        }
      }
      return null
    }).filter(Boolean) as Array<{ url: string; method?: string }>
  } else if (typeof value === 'object' && value.url) {
    // 单个权限对象
    return [{ 
      url: value.url, 
      method: (value.method || 'GET').toUpperCase() 
    }]
  }
  
  return null
}

// 验证角色值格式
function validateRoleValue(value: any): string[] | null {
  if (typeof value === 'string') {
    return [value]
  } else if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string')
  }
  return null
}

// 检查权限并控制元素显示
async function checkAndToggleElement(
  el: HTMLElement, 
  permissions: Array<{ url: string; method?: string }>,
  forceCheck: boolean = false
) {
  const { checkAnyPermission, checkAllPermissions } = usePermission()
  
  try {
    let hasPermission = false
    
    if (permissions.length === 1) {
      // 单个权限
      hasPermission = await checkAnyPermission(permissions)
    } else {
      // 多个权限：任一拥有即可
      hasPermission = await checkAnyPermission(permissions)
    }
    
    toggleElement(el, hasPermission)
  } catch (error) {
    console.error('权限检查失败:', error)
    toggleElement(el, false)
  }
}

// 检查角色并控制元素显示
async function checkRoleAndToggleElement(
  el: HTMLElement,
  roles: string[],
  allRequired: boolean,
  forceCheck: boolean = false
) {
  const { checkAnyRole, checkAllRoles } = useRole()
  
  try {
    let hasRole = false
    
    if (allRequired) {
      hasRole = await checkAllRoles(roles)
    } else {
      hasRole = await checkAnyRole(roles)
    }
    
    toggleElement(el, hasRole)
  } catch (error) {
    console.error('角色检查失败:', error)
    toggleElement(el, false)
  }
}

// 切换元素显示状态
function toggleElement(el: HTMLElement, hasPermission: boolean) {
  if (hasPermission) {
    if (el.style.display === 'none') {
      el.style.display = ''
    }
  } else {
    el.style.display = 'none'
  }
}
```

### 7. 权限插件注册
**目标**: 注册权限相关指令和全局功能

**具体任务**:
- [ ] 创建权限插件
- [ ] 注册全局指令
- [ ] 注册全局方法
- [ ] 实现权限初始化

**插件实现**:
```typescript
// permission-plugin.ts
import type { App } from 'vue'
import { vPermission, vRole } from './directives'
import { usePermissionStore } from './store/permission'

export const permissionPlugin = {
  install(app: App) {
    // 注册指令
    app.directive('permission', vPermission)
    app.directive('role', vRole)

    // 注册全局方法
    app.config.globalProperties.$checkPermission = async (
      url: string, 
      method: string = 'GET'
    ) => {
      const store = usePermissionStore()
      return await store.checkPermission(url, method)
    }

    app.config.globalProperties.$checkRole = async (role: string) => {
      const store = usePermissionStore()
      return await store.checkRole(role)
    }

    // 权限系统初始化
    app.mixin({
      async mounted() {
        // 在用户登录时初始化权限
        if (this.$userStore?.isLoggedIn) {
          const permissionStore = usePermissionStore()
          await permissionStore.refreshPermissions()
        }
      }
    })
  }
}
```

### 8. 权限配置优化
**目标**: 优化权限系统的配置和集成

**具体任务**:
- [ ] 设计权限配置文件
- [ ] 实现权限环境变量
- [ ] 实现权限开发工具
- [ ] 实现权限调试功能

**配置设计**:
```typescript
// permission.config.ts
export interface PermissionConfig {
  // 缓存配置
  cache: {
    enabled: boolean
    ttl: number // 缓存时间（秒）
    maxSize: number // 最大缓存条数
  }
  
  // 预加载配置
  preload: {
    enabled: boolean
    urls: string[] // 预加载的URL列表
  }
  
  // 调试配置
  debug: {
    enabled: boolean
    logLevel: 'error' | 'warn' | 'info' | 'debug'
  }
  
  // 错误处理
  errorHandling: {
    showNotification: boolean
    fallback: 'hide' | 'show' | 'redirect'
  }
}

export const permissionConfig: PermissionConfig = {
  cache: {
    enabled: true,
    ttl: 300, // 5分钟
    maxSize: 1000
  },
  preload: {
    enabled: true,
    urls: [
      // 常用权限预加载列表
    ]
  },
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info'
  },
  errorHandling: {
    showNotification: true,
    fallback: 'hide'
  }
}
```

### 9. 菜单权限控制
**目标**: 实现菜单的权限控制

**具体任务**:
- [ ] 实现菜单权限验证
- [ ] 实现动态菜单生成
- [ ] 实现菜单权限缓存
- [ ] 实现菜单权限继承

**菜单权限实现**:
```typescript
// 菜单权限控制
export function useMenuPermission() {
  const permissionStore = usePermissionStore()
  const { get } = useAxios()

  /**
   * 获取用户可见的菜单
   */
  const getVisibleMenus = async (menuTree: any[]): Promise<any[]> => {
    const visibleMenus: any[] = []
    
    for (const menu of menuTree) {
      // 检查当前菜单权限
      let hasMenuPermission = true
      if (menu.url) {
        hasMenuPermission = await permissionStore.checkPermission(menu.url, 'GET')
      }
      
      // 检查子菜单权限
      let hasVisibleChildren = false
      let visibleChildren: any[] = []
      
      if (menu.children && menu.children.length > 0) {
        visibleChildren = await getVisibleMenus(menu.children)
        hasVisibleChildren = visibleChildren.length > 0
      }
      
      // 如果有权限或有可见子菜单，添加到结果中
      if (hasMenuPermission || hasVisibleChildren) {
        visibleMenus.push({
          ...menu,
          children: visibleChildren
        })
      }
    }
    
    return visibleMenus
  }

  /**
   * 检查菜单项权限
   */
  const checkMenuPermission = async (menu: any): Promise<boolean> => {
    if (!menu.url) {
      // 如果没有URL，根据children判断
      if (menu.children) {
        const childPermissions = await Promise.all(
          menu.children.map((child: any) => checkMenuPermission(child))
        )
        return childPermissions.some(Boolean)
      }
      return true // 没有URL的菜单默认可见
    }
    
    return await permissionStore.checkPermission(menu.url, 'GET')
  }

  /**
   * 过滤菜单树
   */
  const filterMenuTree = async (menuTree: any[]): Promise<any[]> => {
    const filteredMenus: any[] = []
    
    for (const menu of menuTree) {
      const hasPermission = await checkMenuPermission(menu)
      
      if (hasPermission) {
        // 如果有权限，递归处理子菜单
        let children: any[] = []
        if (menu.children) {
          children = await filterMenuTree(menu.children)
        }
        
        // 如果有子菜单或者当前菜单有权限，添加到结果
        if (children.length > 0 || menu.children?.length === 0) {
          filteredMenus.push({
            ...menu,
            children
          })
        }
      }
    }
    
    return filteredMenus
  }

  return {
    getVisibleMenus,
    checkMenuPermission,
    filterMenuTree
  }
}
```

### 10. 按钮权限控制
**目标**: 实现按钮级别的权限控制

**具体任务**:
- [ ] 实现按钮权限检查
- [ ] 实现按钮权限组合
- [ ] 实现按钮权限动态显示
- [ ] 实现按钮权限工具类

**按钮权限实现**:
```typescript
// 按钮权限控制
export function useButtonPermission() {
  const permissionStore = usePermissionStore()

  /**
   * 检查按钮权限
   */
  const checkButtonPermission = async (
    buttonKey: string,
    options: {
      url?: string
      method?: string
      roles?: string[]
      fallback?: any
    } = {}
  ): Promise<boolean> => {
    const checks: Promise<boolean>[] = []

    // 检查URL权限
    if (options.url) {
      checks.push(
        permissionStore.checkPermission(
          options.url, 
          options.method || 'GET'
        )
      )
    }

    // 检查角色权限
    if (options.roles && options.roles.length > 0) {
      const roleChecks = options.roles.map(role => 
        permissionStore.checkRole(role)
      )
      checks.push(...roleChecks)
    }

    // 如果没有明确配置，根据按钮键推断权限
    if (checks.length === 0) {
      const inferredPermission = inferButtonPermission(buttonKey)
      if (inferredPermission) {
        checks.push(
          permissionStore.checkPermission(
            inferredPermission.url,
            inferredPermission.method
          )
        )
      }
    }

    // 任一权限通过即可
    if (checks.length > 0) {
      const results = await Promise.allSettled(checks)
      return results.some(result => 
        result.status === 'fulfilled' && result.value === true
      )
    }

    // 没有权限要求，默认显示
    return true
  }

  /**
   * 从按钮键推断权限
   */
  const inferButtonPermission = (buttonKey: string): { url: string; method: string } | null => {
    const permissionMap: Record<string, { url: string; method: string }> = {
      'create': { url: '/api/users', method: 'POST' },
      'edit': { url: '/api/users/:id', method: 'PUT' },
      'delete': { url: '/api/users/:id', method: 'DELETE' },
      'view': { url: '/api/users', method: 'GET' },
      'export': { url: '/api/users/export', method: 'GET' },
      'import': { url: '/api/users/import', method: 'POST' },
      'approve': { url: '/api/users/:id/approve', method: 'POST' },
      'reject': { url: '/api/users/:id/reject', method: 'POST' }
    }

    return permissionMap[buttonKey] || null
  }

  /**
   * 批量检查按钮权限
   */
  const checkBatchButtonPermissions = async (
    buttonConfigs: Array<{
      key: string
      options?: { url?: string; method?: string; roles?: string[] }
    }>
  ): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {}
    
    const promises = buttonConfigs.map(async (config) => {
      const hasPermission = await checkButtonPermission(config.key, config.options)
      return { key: config.key, hasPermission }
    })
    
    const settledResults = await Promise.allSettled(promises)
    
    settledResults.forEach((result, index) => {
      const key = buttonConfigs[index].key
      if (result.status === 'fulfilled') {
        results[key] = result.value.hasPermission
      } else {
        results[key] = false
        console.error(`按钮权限检查失败 [${key}]:`, result.reason)
      }
    })
    
    return results
  }

  return {
    checkButtonPermission,
    checkBatchButtonPermissions,
    inferButtonPermission
  }
}
```

### 11. 页面级权限控制
**目标**: 实现页面级别的权限控制

**具体任务**:
- [ ] 实现页面权限检查
- [ ] 实现页面权限继承
- [ ] 实现页面权限缓存
- [ ] 实现页面权限组件

**页面权限实现**:
```typescript
// 页面权限控制
export function usePagePermission() {
  const permissionStore = usePermissionStore()
  const router = useRouter()

  /**
   * 检查页面访问权限
   */
  const checkPageAccess = async (
    pageConfig: {
      url: string
      method?: string
      roles?: string[]
      permissions?: string[]
      redirectOnDenied?: string
    }
  ): Promise<boolean> => {
    const checks: Promise<boolean>[] = []

    // 检查URL权限
    checks.push(
      permissionStore.checkPermission(
        pageConfig.url,
        pageConfig.method || 'GET'
      )
    )

    // 检查角色权限
    if (pageConfig.roles) {
      const roleChecks = pageConfig.roles.map(role =>
        permissionStore.checkRole(role)
      )
      checks.push(...roleChecks)
    }

    // 检查权限列表
    if (pageConfig.permissions) {
      const permissionChecks = pageConfig.permissions.map(permission =>
        permissionStore.checkPermission(permission)
      )
      checks.push(...permissionChecks)
    }

    // 执行权限检查
    const results = await Promise.allSettled(checks)
    const hasAccess = results.some(result =>
      result.status === 'fulfilled' && result.value === true
    )

    // 如果没有权限且配置了重定向
    if (!hasAccess && pageConfig.redirectOnDenied) {
      router.push(pageConfig.redirectOnDenied)
    }

    return hasAccess
  }

  /**
   * 获取页面权限信息
   */
  const getPagePermissionInfo = (pageUrl: string): {
    hasViewPermission: boolean
    hasCreatePermission: boolean
    hasEditPermission: boolean
    hasDeletePermission: boolean
    canExport: boolean
    canImport: boolean
  } => {
    const baseUrl = pageUrl.replace(/\/:\w+$/, '') // 移除ID参数

    return {
      hasViewPermission: permissionStore.hasPermission(baseUrl, 'GET'),
      hasCreatePermission: permissionStore.hasPermission(baseUrl, 'POST'),
      hasEditPermission: permissionStore.hasPermission(`${baseUrl}/:id`, 'PUT'),
      hasDeletePermission: permissionStore.hasPermission(`${baseUrl}/:id`, 'DELETE'),
      canExport: permissionStore.hasPermission(`${baseUrl}/export`, 'GET'),
      canImport: permissionStore.hasPermission(`${baseUrl}/import`, 'POST')
    }
  }

  return {
    checkPageAccess,
    getPagePermissionInfo
  }
}
```

### 12. 权限指令组合
**目标**: 实现复杂的权限指令组合

**具体任务**:
- [ ] 实现权限指令组合逻辑
- [ ] 实现条件权限检查
- [ ] 实现权限指令缓存
- [ ] 实现权限指令性能优化

**指令组合实现**:
```typescript
// 权限指令组合
export function usePermissionDirective() {
  const permissionStore = usePermissionStore()

  /**
   * v-permission-or 指令：任一权限通过即可
   */
  const vPermissionOr = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      const permissions = parsePermissionArray(binding.value)
      if (!permissions) return

      checkPermissionsOr(el, permissions)
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      if (binding.value !== binding.oldValue) {
        const permissions = parsePermissionArray(binding.value)
        if (permissions) {
          checkPermissionsOr(el, permissions)
        }
      }
    }
  }

  /**
   * v-permission-and 指令：所有权限都必须通过
   */
  const vPermissionAnd = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      const permissions = parsePermissionArray(binding.value)
      if (!permissions) return

      checkPermissionsAnd(el, permissions)
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      if (binding.value !== binding.oldValue) {
        const permissions = parsePermissionArray(binding.value)
        if (permissions) {
          checkPermissionsAnd(el, permissions)
        }
      }
    }
  }

  /**
   * v-role-and 指令：必须拥有所有角色
   */
  const vRoleAnd = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      const roles = parseRoleArray(binding.value)
      if (!roles) return

      checkRolesAnd(el, roles)
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      if (binding.value !== binding.oldValue) {
        const roles = parseRoleArray(binding.value)
        if (roles) {
          checkRolesAnd(el, roles)
        }
      }
    }
  }

  /**
   * v-permission-complex 指令：复杂权限条件
   */
  const vPermissionComplex = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      const config = binding.value as {
        any?: Array<{ url: string; method?: string }>
        all?: Array<{ url: string; method?: string }>
        roles?: string[]
        condition?: 'AND' | 'OR'
      }

      if (!config) return

      checkComplexPermission(el, config)
    }
  }

  return {
    vPermissionOr,
    vPermissionAnd,
    vRoleAnd,
    vPermissionComplex
  }
}

// 权限检查辅助函数
async function checkPermissionsOr(el: HTMLElement, permissions: Array<{ url: string; method?: string }>) {
  const { checkAnyPermission } = usePermission()
  const hasPermission = await checkAnyPermission(permissions)
  toggleElement(el, hasPermission)
}

async function checkPermissionsAnd(el: HTMLElement, permissions: Array<{ url: string; method?: string }>) {
  const { checkAllPermissions } = usePermission()
  const hasPermission = await checkAllPermissions(permissions)
  toggleElement(el, hasPermission)
}

async function checkRolesAnd(el: HTMLElement, roles: string[]) {
  const { checkAllRoles } = useRole()
  const hasRole = await checkAllRoles(roles)
  toggleElement(el, hasRole)
}

async function checkComplexPermission(el: HTMLElement, config: any) {
  const { checkAnyPermission, checkAllPermissions } = usePermission()
  const { checkAnyRole, checkAllRoles } = useRole()

  let hasPermission = true

  // 检查any权限
  if (config.any && config.any.length > 0) {
    hasPermission = await checkAnyPermission(config.any)
  }

  // 检查all权限
  if (config.all && config.all.length > 0) {
    hasPermission = hasPermission && await checkAllPermissions(config.all)
  }

  // 检查角色
  if (config.roles && config.roles.length > 0) {
    const hasRole = await checkAnyRole(config.roles)
    hasPermission = hasPermission && hasRole
  }

  toggleElement(el, hasPermission)
}
```

### 13. 权限工具类
**目标**: 提供权限相关的工具函数

**具体任务**:
- [ ] 实现权限检查工具
- [ ] 实现权限转换工具
- [ ] 实现权限验证工具
- [ ] 实现权限调试工具

**工具类实现**:
```typescript
// 权限工具类
export class PermissionUtils {
  /**
   * 从URL和HTTP方法生成权限码
   */
  static generatePermissionCode(url: string, method: string): string {
    const normalizedUrl = this.normalizeUrl(url)
    const action = this.getActionByMethod(method)
    return `${action}:${normalizedUrl}`
  }

  /**
   * 标准化URL
   */
  static normalizeUrl(url: string): string {
    const urlObj = new URL(url, 'http://localhost')
    let path = urlObj.pathname

    // 参数化动态路径
    path = path.replace(/\/\d+/g, '/:id')
    path = path.replace(/\/[\w-]+\/(\d+)/g, '/$1/:id')

    // 移除尾部斜杠
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1)
    }

    return path
  }

  /**
   * 根据HTTP方法获取操作类型
   */
  static getActionByMethod(method: string): string {
    const actionMap: Record<string, string> = {
      'GET': 'VIEW',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    }
    return actionMap[method.toUpperCase()] || 'VIEW'
  }

  /**
   * 检查权限码是否匹配
   */
  static matchPermissionCode(
    userPermission: string,
    requiredPermission: string
  ): boolean {
    if (userPermission === '*') {
      return true // 超级管理员
    }

    const [userAction, userResource] = userPermission.split(':', 2)
    const [requiredAction, requiredResource] = requiredPermission.split(':', 2)

    // 资源匹配
    if (userResource !== requiredResource) {
      return false
    }

    // 权限级别检查
    const actionLevel: Record<string, number> = {
      'VIEW': 1,
      'CREATE': 2,
      'UPDATE': 2,
      'DELETE': 3,
      'MANAGE': 4
    }

    const userLevel = actionLevel[userAction] || 0
    const requiredLevel = actionLevel[requiredAction] || 0

    return userLevel >= requiredLevel
  }

  /**
   * 转换权限码格式
   */
  static convertPermissionCode(
    code: string,
    format: 'standard' | 'simple' | 'detailed'
  ): string {
    switch (format) {
      case 'simple':
        return code.replace(/^(VIEW|CREATE|UPDATE|DELETE):/, '')
      case 'detailed':
        return `[${code.split(':')[0]}] ${code.split(':')[1]}`
      default:
        return code
    }
  }

  /**
   * 验证权限码格式
   */
  static validatePermissionCode(code: string): boolean {
    const regex = /^(VIEW|CREATE|UPDATE|DELETE):\/.+/
    return regex.test(code) || code === '*'
  }

  /**
   * 获取权限级别
   */
  static getPermissionLevel(permissionCode: string): number {
    if (permissionCode === '*') return 999

    const [action] = permissionCode.split(':', 2)
    const levelMap: Record<string, number> = {
      'VIEW': 1,
      'CREATE': 2,
      'UPDATE': 2,
      'DELETE': 3,
      'MANAGE': 4
    }
    return levelMap[action] || 0
  }

  /**
   * 权限码比较
   */
  static comparePermissions(permission1: string, permission2: string): number {
    const level1 = this.getPermissionLevel(permission1)
    const level2 = this.getPermissionLevel(permission2)
    return level1 - level2
  }
}
```

### 14. 权限调试和开发工具
**目标**: 提供权限系统的调试和开发支持

**具体任务**:
- [ ] 实现权限调试面板
- [ ] 实现权限测试工具
- [ ] 实现权限模拟功能
- [ ] 实现权限日志功能

**调试工具实现**:
```typescript
// 权限调试工具
export class PermissionDebugger {
  private static instance: PermissionDebugger
  private logs: Array<{ timestamp: Date; type: string; data: any }> = []

  static getInstance(): PermissionDebugger {
    if (!PermissionDebugger.instance) {
      PermissionDebugger.instance = new PermissionDebugger()
    }
    return PermissionDebugger.instance
  }

  /**
   * 记录权限检查日志
   */
  logPermissionCheck(url: string, method: string, result: boolean, source: string) {
    if (process.env.NODE_ENV !== 'development') return

    this.logs.push({
      timestamp: new Date(),
      type: 'PERMISSION_CHECK',
      data: { url, method, result, source }
    })

    console.log(`🔐 [权限检查] ${method} ${url} -> ${result ? '✅' : '❌'} (${source})`)
  }

  /**
   * 记录角色检查日志
   */
  logRoleCheck(role: string, result: boolean, source: string) {
    if (process.env.NODE_ENV !== 'development') return

    this.logs.push({
      timestamp: new Date(),
      type: 'ROLE_CHECK',
      data: { role, result, source }
    })

    console.log(`👤 [角色检查] ${role} -> ${result ? '✅' : '❌'} (${source})`)
  }

  /**
   * 获取权限检查报告
   */
  getReport() {
    const permissionChecks = this.logs.filter(log => log.type === 'PERMISSION_CHECK')
    const roleChecks = this.logs.filter(log => log.type === 'ROLE_CHECK')

    return {
      permissionChecks: permissionChecks.length,
      roleChecks: roleChecks.length,
      totalChecks: this.logs.length,
      recentLogs: this.logs.slice(-20),
      statistics: {
        permissionSuccess: permissionChecks.filter(log => log.data.result).length,
        permissionFailure: permissionChecks.filter(log => !log.data.result).length,
        roleSuccess: roleChecks.filter(log => log.data.result).length,
        roleFailure: roleChecks.filter(log => !log.data.result).length
      }
    }
  }

  /**
   * 清除日志
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * 模拟权限检查
   */
  async simulatePermissionCheck(config: {
    url: string
    method: string
    mockResult?: boolean
  }) {
    if (process.env.NODE_ENV !== 'development') return

    const result = config.mockResult ?? Math.random() > 0.3
    this.logPermissionCheck(config.url, config.method, result, 'SIMULATION')
    return result
  }

  /**
   * 权限性能分析
   */
  async analyzePermissionPerformance() {
    const permissionChecks = this.logs.filter(log => log.type === 'PERMISSION_CHECK')
    
    if (permissionChecks.length === 0) {
      return { message: '暂无权限检查记录' }
    }

    const times = permissionChecks.map(log => log.timestamp.getTime())
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length

    return {
      totalChecks: permissionChecks.length,
      timeRange: maxTime - minTime,
      averageInterval: avgTime - minTime,
      mostCheckedPermission: this.getMostFrequentCheck(permissionChecks)
    }
  }

  private getMostFrequentCheck(checks: any[]) {
    const frequency: Record<string, number> = {}
    
    checks.forEach(check => {
      const key = `${check.data.method} ${check.data.url}`
      frequency[key] = (frequency[key] || 0) + 1
    })

    return Object.entries(frequency).sort(([, a], [, b]) => b - a)[0]
  }
}
```

### 15. 完整集成测试
**目标**: 确保前端权限系统与后端的完整集成

**具体任务**:
- [ ] 权限API集成测试
- [ ] 路由守卫测试
- [ ] 组件权限测试
- [ ] 指令权限测试
- [ ] 性能测试
- [ ] 用户体验测试

**集成测试实现**:
```typescript
// 权限系统集成测试
export class PermissionIntegrationTester {
  /**
   * 测试权限API集成
   */
  async testApiIntegration() {
    const testCases = [
      { url: '/api/users', method: 'GET', expected: true },
      { url: '/api/users', method: 'POST', expected: false },
      { url: '/api/users/123', method: 'PUT', expected: false },
      { url: '/api/admin', method: 'GET', expected: false }
    ]

    const results = []
    
    for (const testCase of testCases) {
      try {
        const { checkPermission } = usePermission()
        const actual = await checkPermission(testCase.url, testCase.method)
        
        results.push({
          ...testCase,
          actual,
          passed: actual === testCase.expected
        })
      } catch (error) {
        results.push({
          ...testCase,
          actual: null,
          passed: false,
          error: error.message
        })
      }
    }

    return results
  }

  /**
   * 测试路由权限
   */
  async testRoutePermission() {
    const router = useRouter()
    const testRoutes = [
      { name: 'users', expectedAccess: true },
      { name: 'admin', expectedAccess: false }
    ]

    const results = []
    
    for (const route of testRoutes) {
      try {
        const routeConfig = router.getRoutes().find(r => r.name === route.name)
        if (routeConfig) {
          const { checkPageAccess } = usePagePermission()
          const hasAccess = await checkPageAccess({
            url: routeConfig.path,
            method: 'GET'
          })
          
          results.push({
            route: route.name,
            hasAccess,
            passed: hasAccess === route.expectedAccess
          })
        }
      } catch (error) {
        results.push({
          route: route.name,
          hasAccess: false,
          passed: false,
          error: error.message
        })
      }
    }

    return results
  }

  /**
   * 测试组件权限
   */
  async testComponentPermission() {
    const testCases = [
      { url: '/api/users', method: 'GET', shouldShow: true },
      { url: '/api/users', method: 'POST', shouldShow: false }
    ]

    const results = []
    
    for (const testCase of testCases) {
      try {
        const { checkPermission } = usePermission()
        const hasPermission = await checkPermission(testCase.url, testCase.method)
        
        results.push({
          ...testCase,
          hasPermission,
          passed: hasPermission === testCase.shouldShow
        })
      } catch (error) {
        results.push({
          ...testCase,
          hasPermission: false,
          passed: false,
          error: error.message
        })
      }
    }

    return results
  }
}
```

## 实施清单
1. [ ] 实现权限验证组合式函数
2. [ ] 实现角色验证组合式函数
3. [ ] 实现权限状态管理
4. [ ] 实现路由守卫
5. [ ] 实现权限组件
6. [ ] 实现权限指令
7. [ ] 实现权限插件注册
8. [ ] 实现权限配置优化
9. [ ] 实现菜单权限控制
10. [ ] 实现按钮权限控制
11. [ ] 实现页面级权限控制
12. [ ] 实现权限指令组合
13. [ ] 实现权限工具类
14. [ ] 实现权限调试工具
15. [ ] 完整集成测试

## 技术栈
- **框架**: Vue 3.5.18+ (Composition API)
- **状态管理**: Pinia 2.3+
- **路由**: Vue Router 4.5+
- **UI组件**: Naive UI 2.41+
- **HTTP客户端**: Axios 1.7+ (项目已有)
- **类型系统**: TypeScript 5.9.2
- **构建工具**: Vite 6.1+

## 技术风险
1. **权限检查性能**: 频繁的权限检查可能影响页面性能
   - 风险：高
   - 缓解：缓存机制、防抖、预加载
2. **权限状态同步**: 前后端权限状态不一致
   - 风险：中
   - 缓解：实时同步、状态验证、错误重试
3. **权限指令复杂性**: 复杂的权限指令组合
   - 风险：中
   - 缓解：清晰的API设计、充分的测试
4. **权限缓存一致性**: 权限变更后的缓存更新
   - 风险：中
   - 缓存失效机制、实时更新
5. **权限调试困难**: 权限问题的定位和调试
   - 风险：低
   - 缓解：完善的调试工具和日志

## 验收标准
1. 路由守卫正确工作
2. 权限组件和指令功能完整
3. 权限状态管理正确
4. 权限检查性能满足要求
5. 权限API集成无问题
6. 权限缓存机制有效
7. 权限调试工具可用
8. 权限异常处理完善
9. 权限文档完整
10. 代码质量符合项目规范

## 时间估算
- 总计：4-5个工作日
- 权限验证函数实现：1天
- 权限状态管理：0.5天
- 路由守卫实现：0.5天
- 权限组件和指令：1.5天
- 权限工具和调试：1天
- 测试和优化：1-1.5天

## 与后端集成
### API接口依赖
1. **权限检查**: `POST /api/permissions/check`
2. **获取用户权限**: `GET /api/permissions/user/permissions`
3. **获取资源树**: `GET /api/permissions/resources/tree`
4. **批量权限检查**: `POST /api/permissions/check/batch`

### 数据格式
- 权限码格式：`ACTION:URL`
- 用户权限列表：字符串数组
- 权限树：标准树形结构
- 权限检查结果：布尔值

## 性能优化
### 缓存策略
- 权限检查结果缓存（5分钟）
- 用户权限列表缓存（1小时）
- 权限计算结果缓存（10分钟）

### 预加载策略
- 页面加载时预加载常用权限
- 路由切换时预加载目标页面权限
- 用户登录时预加载所有权限

### 性能监控
- 权限检查次数统计
- 权限检查耗时监控
- 权限缓存命中率统计

## 部署和运维
### 配置管理
- 权限系统配置外部化
- 环境变量控制调试模式
- 权限缓存配置可调

### 监控和告警
- 权限检查错误率监控
- 权限系统性能监控
- 权限缓存使用情况监控

### 文档和培训
- 权限系统使用文档
- 权限指令API文档
- 权限开发最佳实践

## 后续维护
### 权限系统扩展
- 支持更多权限类型
- 支持权限继承机制
- 支持权限动态配置

### 性能优化
- 权限检查算法优化
- 缓存策略优化
- 预加载策略优化

### 开发者体验
- 权限开发工具完善
- 权限调试面板优化
- 权限文档和示例完善

## 注意事项
- 保持权限系统的安全性和可靠性
- 确保权限检查的性能和响应速度
- 权限缓存要考虑数据一致性
- 权限错误处理要用户友好
- 权限开发工具要便于使用和维护
- 代码要符合Vue 3和项目规范
- 充分的测试覆盖和性能验证