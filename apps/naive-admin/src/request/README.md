# Request 模块文档

> 简洁高效的 API 请求处理模块，支持 HTTP/gRPC 协议透明切换

## 📁 目录结构

```
src/request/
├── 📖 README.md                 # 本文档
│
├── 🎯 核心模块
├── api-adapter.ts               # ⭐ API 适配器 (核心)
├── axios.ts                     # HTTP 客户端基础
│
└── 📚 业务 API
    ├── api/
    │   ├── common.ts            # 通用工具和类型
    │   ├── column.ts            # 专栏管理 API
    │   ├── users.ts             # 用户管理 API
    │   └── rbac.ts              # 权限管理 API
```

## 🚀 快速开始

### 基本使用 (推荐)

```typescript
// 1. 导入 API 调用函数
import { apiCall } from '@/request/api-adapter'

// 2. 使用统一的调用方式
async function loginExample() {
  const [data, error] = await apiCall('POST /auth/login', {
    phone: '13800138000',
    password: 'password123'
  })

  if (error) {
    console.error('登录失败:', error.message)
    return
  }

  console.log('登录成功:', data)
}
```

### 业务 API 使用

```typescript
// 导入具体业务 API
import { userLogin, getCurrentUser } from '@/request/api/users'
import { getPermissions, getRoles } from '@/request/api/rbac'
import { api_getColumnList } from '@/request/api/column'

// 用户登录
const [loginResult, error] = await userLogin('13800138000', 'password123')

// 获取当前用户信息
const [userInfo, error] = await getCurrentUser()

// 获取权限列表
const [permissions, error] = await getPermissions({ page: 1, pageSize: 20 })

// 获取专栏列表
const [columns, error] = await api_getColumnList({ page: 1, pageSize: 10 })
```

### 协议配置

```typescript
import { updateApiConfig, getApiConfig } from '@/request/api-adapter'

// 运行时切换到 gRPC 协议
updateApiConfig({ useGrpc: true })

// 切换回 HTTP 协议
updateApiConfig({ useGrpc: false })

// 启用调试模式
updateApiConfig({ debug: true })

// 查看当前配置
const config = getApiConfig()
console.log(`当前协议: ${config.useGrpc ? 'gRPC' : 'HTTP'}`)
```

## 📖 核心设计理念

### 🎯 简洁优先

- **一个适配器解决所有问题** - 不需要学习复杂的客户端架构
- **统一的调用方式** - `apiCall(endpoint, data)` 适用于所有场景
- **最小化配置** - 环境变量驱动，开箱即用

### 🔄 协议透明

- **业务代码无感知** - HTTP/gRPC 切换对业务代码完全透明
- **渐进式启用** - 默认 HTTP，可选择启用 gRPC
- **自动降级** - gRPC 不可用时自动使用 HTTP

### 🛡️ 类型安全

- **完整的 TypeScript 支持** - 所有 API 都有精确的类型定义
- **统一的错误处理** - `[data, error]` 格式，类型安全的错误处理
- **智能类型推导** - 根据 endpoint 自动推导返回类型

## 🔧 API 适配器详解

### 核心方法

```typescript
import { apiCall, type ApiResponse } from '@/request/api-adapter'

/**
 * 统一的 API 调用方法
 * @param endpoint - API 端点，格式：'METHOD /path'
 * @param data - 请求数据
 * @param options - 额外选项
 * @returns Promise<[data, error]> 格式的响应
 */
async function apiCall<T = any>(endpoint: string, data?: any, options?: { timeout?: number; headers?: Record<string, string> }): Promise<ApiResponse<T>>
```

### 使用示例

```typescript
// GET 请求
const [users, error] = await apiCall('GET /users', { page: 1, pageSize: 20 })

// POST 请求
const [result, error] = await apiCall('POST /users', {
  username: 'newuser',
  phone: '13800138000',
  password: 'password123'
})

// PUT 请求
const [updated, error] = await apiCall('PUT /users/123', {
  username: 'updatedname'
})

// DELETE 请求
const [deleted, error] = await apiCall('DELETE /users/123', {})

// 自定义选项
const [data, error] = await apiCall('POST /upload', formData, {
  timeout: 30000,
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

## 🛠️ 配置说明

### 环境变量配置

```bash
# .env.development
VITE_API_URL=http://localhost:3000       # HTTP API 基础URL
VITE_API_DEBUG=true                      # 是否启用调试模式
```

### 运行时配置

```typescript
import { updateApiConfig, getApiConfig, checkApiHealth } from '@/request/api-adapter'

// 更新配置
updateApiConfig({
  useGrpc: true,
  grpcEndpoint: 'http://production-grpc.example.com',
  httpBaseUrl: 'http://production-api.example.com',
  debug: false
})

// 获取当前配置
const config = getApiConfig()

// 健康检查
const health = await checkApiHealth()
console.log('API健康状态:', health)
```

## 📚 业务 API 模块

### 用户管理 API (`users.ts`)

```typescript
import { userLogin, userLogout, getCurrentUser, getUserList, createUser, updateUser, deleteUser, hasPermission, hasRole, isAdmin } from '@/request/api/users'

// 用户认证
const [loginResult, error] = await userLogin('phone', 'password')
const [success, error] = await userLogout()

// 用户管理
const [users, error] = await getUserList({ page: 1, pageSize: 20 })
const [newUser, error] = await createUser({ username: 'test', phone: '13800138000' })

// 权限检查工具
const canEdit = hasPermission('column:edit')
const isUserAdmin = isAdmin()
```

### 权限管理 API (`rbac.ts`)

```typescript
import { getPermissions, getRoles, createPermission, createRole, checkPermission, assignRole } from '@/request/api/rbac'

// 获取权限和角色
const [permissions, error] = await getPermissions({ page: 1 })
const [roles, error] = await getRoles({ page: 1 })

// 权限检查
const [result, error] = await checkPermission('user123', 'column:edit')

// 角色分配
const [success, error] = await assignRole('user123', 'role456')
```

### 专栏管理 API (`column.ts`)

```typescript
import { api_getColumnList, api_createColumn, api_editColumn, api_deleteColumn, api_onlineColumn, api_offlineColumn } from '@/request/api/column'

// 专栏操作
const [columns, error] = await api_getColumnList({ page: 1, pageSize: 10 })
const [newColumn, error] = await api_createColumn({ columnName: '新专栏' })
const [updated, error] = await api_editColumn({ xid: '123', columnName: '更新专栏' })
```

### 通用工具 API (`common.ts`)

```typescript
import { get, post, put, del, healthCheck, getApiInfo, isApiSuccess, extractApiData, formatApiError, batchRequest } from '@/request/api/common'

// 通用 HTTP 方法（向后兼容）
const [data, error] = await get('/api/users')
const [result, error] = await post('/api/users', { name: 'test' })

// 系统状态
const health = await healthCheck()
const apiInfo = getApiInfo()

// 响应处理工具
if (isApiSuccess(response)) {
  const data = extractApiData(response)
}

// 批量请求
const results = await batchRequest([() => get('/api/users'), () => get('/api/roles'), () => get('/api/permissions')])
```

## 🎯 最佳实践

### 1. 统一错误处理

```typescript
const [data, error] = await apiCall('GET /users', {})

if (error) {
  // 统一的错误处理
  switch (error.name) {
    case 'HTTP_401':
      // 登录过期，跳转登录页
      router.push('/login')
      break
    case 'HTTP_403':
      // 权限不足
      message.error('权限不足，无法访问')
      break
    case 'HTTP_500':
      // 服务器错误
      message.error('服务器内部错误，请稍后重试')
      break
    default:
      message.error(error.message || '请求失败')
  }
  return
}

// 处理成功数据
console.log('获取数据成功:', data)
```

### 2. 类型安全的 API 调用

```typescript
import type { UserInfo, LoginResponse } from '@/request/api/users'
import type { Permission, Role } from '@/request/api/rbac'

// 带类型的 API 调用
const [loginResult, error] = await apiCall<LoginResponse>('POST /auth/login', {
  phone: '13800138000',
  password: 'password123'
})

if (loginResult) {
  // loginResult 是 LoginResponse 类型，有完整的类型提示
  console.log(loginResult.user.username)
  console.log(loginResult.token)
  console.log(loginResult.expiresIn)
}
```

### 3. 组件中的使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUserList, type UserInfo } from '@/request/api/users'
import { formatApiError } from '@/request/api/common'

const users = ref<UserInfo[]>([])
const loading = ref(false)
const error = ref('')

const loadUsers = async () => {
  loading.value = true
  error.value = ''

  const [data, err] = await getUserList({ page: 1, pageSize: 20 })

  if (err) {
    error.value = formatApiError(err)
  } else if (data) {
    users.value = data.items
  }

  loading.value = false
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-for="user in users" :key="user.id">
        {{ user.username }}
      </div>
    </div>
  </div>
</template>
```

### 4. 协议切换策略

```typescript
// 开发环境使用 gRPC（如果可用）
if (import.meta.env.DEV) {
  updateApiConfig({
    useGrpc: true,
    debug: true
  })
}

// 生产环境默认使用 HTTP（稳定）
if (import.meta.env.PROD) {
  updateApiConfig({
    useGrpc: false,
    debug: false
  })
}

// 根据用户设置动态切换
const userPreference = localStorage.getItem('api_protocol')
if (userPreference === 'grpc') {
  updateApiConfig({ useGrpc: true })
}
```

## 🧪 测试和验证

### 完整测试套件

Request 模块配备了完整的测试体系，位于 `src/request/tests/` 目录：

```
src/request/tests/
├── unit/              # 单元测试
├── integration/       # 集成测试
├── manual/           # 手动验证
└── README.md         # 测试文档
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm test -- unit

# 运行集成测试
npm test -- integration

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 手动验证

```typescript
// 导入手动测试工具
import { runManualTests } from '@/request/tests/manual/manual-test'

// 运行完整验证
await runManualTests()

// 或在浏览器控制台中
window.apiAdapterTest.runManualTests()
```

### 协议切换测试

```typescript
// 测试 HTTP 模式
updateApiConfig({ useGrpc: false })
const [httpResult, httpError] = await getUserList({ page: 1 })
console.log('HTTP 结果:', { httpResult, httpError })

// 测试 gRPC 模式
updateApiConfig({ useGrpc: true })
const [grpcResult, grpcError] = await getUserList({ page: 1 })
console.log('gRPC 结果:', { grpcResult, grpcError })
```

### 测试覆盖情况

| 测试类型 | 文件数 | 测试用例 | 覆盖范围           |
| -------- | ------ | -------- | ------------------ |
| 单元测试 | 1 个   | 16 个    | API 适配器核心功能 |
| 集成测试 | 1 个   | 20+个    | 业务 API 完整流程  |
| 手动验证 | 1 个   | 7 步骤   | 浏览器真实环境     |

详细的测试文档和使用指南请查看：[tests/README.md](./tests/README.md)

## 🚨 注意事项

### 1. 响应格式统一

所有 API 调用都返回 `[data, error]` 格式：

- **成功时**: `[data, null]`
- **失败时**: `[null, Error对象]`

### 2. 类型安全

```typescript
// ✅ 正确：使用类型参数
const [data, error] = await apiCall<UserInfo>('GET /users/123', {})

// ❌ 错误：不指定类型
const [data, error] = await apiCall('GET /users/123', {})
```

### 3. 错误处理

```typescript
// ✅ 正确：总是检查错误
const [data, error] = await apiCall('GET /users', {})
if (error) {
  console.error('请求失败:', error.message)
  return
}

// ❌ 错误：忽略错误检查
const [data] = await apiCall('GET /users', {})
// data 可能为 null
```

### 4. 协议切换

- gRPC 模式目前会降级到 HTTP 调用
- 协议切换对业务代码完全透明
- 建议生产环境使用 HTTP 模式确保稳定性

## 🔄 迁移指南

### 从旧版本迁移

```typescript
// 旧方式 ❌
import { get, post } from '@/request/axios'
const data = await get('/api/users')

// 新方式 ✅
import { apiCall } from '@/request/api-adapter'
const [data, error] = await apiCall('GET /users', {})

// 或使用业务 API ✅
import { getUserList } from '@/request/api/users'
const [data, error] = await getUserList({ page: 1 })
```

## 📈 性能考虑

1. **协议选择**：HTTP 模式稳定性更好，gRPC 模式性能更优（待完善）
2. **错误处理**：统一的错误处理避免重复代码
3. **类型安全**：TypeScript 类型检查减少运行时错误
4. **调试支持**：debug 模式提供详细的请求日志

---

## 📞 技术支持

如有问题或建议，请：

1. 查看本文档的示例代码
2. 检查浏览器控制台的错误日志
3. 联系开发团队

💡 **提示**：新的 API 适配器大幅简化了原有的复杂架构，维护和使用都更加简单。
