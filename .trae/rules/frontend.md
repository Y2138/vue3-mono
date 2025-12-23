---
alwaysApply: false
description: 前端代码开发规范
---

# 前端开发规范

## 1. 组件结构与组织

### 1.1 目录结构

```
src/views/system/
└── person/          # 人员管理模块
    ├── list.vue     # 列表页面组件
    ├── CreateUserModal.vue  # 创建用户弹窗组件
    └── detail.vue   # 详情页面组件
```

### 1.2 组件拆分原则

- 页面级组件：负责完整功能模块
- 功能组件：负责单一功能
- 通用组件：通过 props 和 events 实现复用
- 路由组件：与路由配置一一对应

### 1.3 文件命名规范

- 页面组件：大驼峰（如 PersonList.vue）或小写连字符（如 person-list.vue）
- 功能组件：大驼峰（如 CreateUserModal.vue）
- API 模块：小写连字符（如 users.ts）
- Hook：use 前缀 + 驼峰命名（如 useTablePage.ts）

## 2. TypeScript 类型使用

### 2.1 类型定义

- 接口定义使用 `interface`（如 `IFormModel`）
- 类型别名使用 `type`（如 `UserInfo`）
- 枚举使用 `enum` 或后端返回的枚举类型

### 2.2 类型来源

1. **Proto 生成类型**：用于接口请求和响应
2. **扩展类型**：在 API 模块中扩展和转换
3. **本地类型**：组件内部使用的类型

### 2.3 类型转换

- 使用 `as` 进行类型断言
- 使用 `Omit`, `Partial`, `Pick` 等工具类型
- 避免使用 `any` 类型，优先使用 `unknown`

## 3. API 请求与响应处理

### 3.1 API 模块结构

```typescript
// API 函数
export const api_login = async (params: LoginParams) => {
  return post<LoginParams, LoginResponse>('/api/auth/login', { data: params })
}
```

### 3.2 请求封装

- 使用 axios 封装请求（get, post, patch 等）
- 统一处理请求拦截和响应拦截
- 自动携带 token 等认证信息

### 3.3 响应与错误处理

```typescript
const [res, error] = await getUserList(requestParams)
if (error) {
  return [null, error]
}
```

- 使用 `try-catch` 包裹异步请求
- 统一错误提示
- 详细日志记录

## 4. 状态管理

### 4.1 响应式数据

- 使用 `ref` 和 `reactive` 创建响应式数据
- 使用 `computed` 定义计算属性
- 使用 `watch` 和 `watchEffect` 监听数据变化

### 4.2 Hook 应用

```typescript
import useTablePage from '@/hooks/useTablePage'
import { useEnums } from '@/hooks/useEnums'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useMessage } from 'naive-ui'

const message = useMessage()
const { data: userEnums } = useEnums<Record<string, EnumItem[]>>({...})
const { pagination, tableData, loading, refresh } = useTablePage<IUserListRequest, UserInfo>(...)
```

### 4.3 路由使用

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()
router.push({ path: '/system-manage/person/detail', query: { phone: row.phone } })
router.back()
```

## 5. 代码风格与命名规范

### 5.1 命名规则

- 组件名称：大驼峰（如 CreateUserModal）
- 变量名称：驼峰命名（如 userInfo, loading）
- 常量名称：大写蛇形（如 API_URL）
- 接口名称：I 前缀 + 大驼峰（如 IFormModel）
- 函数名称：驼峰命名（如 handleCreate）

### 5.2 代码风格

```typescript
// 正确示例
const message = useMessage()
const router = useRouter()

function handleCreate() {
  showCreateModal.value = true
}
```

### 5.3 注释规范

```typescript
/**
 * 用户状态操作请求类型
 */
export interface UserStatusActionRequest {
  /** 操作类型：activate-激活，deactivate-下线，lock-锁定，unlock-解锁 */
  action: 'activate' | 'deactivate' | 'lock' | 'unlock'
}
```

## 6. UI 组件库使用

### 6.1 组件库选择

- 使用 Naive UI 组件库
- 自定义组件：如 dForm 表单组件

### 6.2 组件使用规范

```vue
<n-button type="primary" @click="handleSubmit" :loading="loading"> 确定 </n-button>
<n-data-table :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />
```

### 6.3 图标库使用

- 使用 @iconify/vue 作为图标库
- 引入方式：`import { Icon } from '@iconify/vue'`
- 使用方式：`<Icon icon="ion:menu" width="24" height="24" />`
- 统一图标大小（推荐 16px/20px/24px）

### 6.4 样式规范

- 优先使用 unocss 类名
- 使用 Scoped CSS
- 使用 CSS 变量和深度选择器 `:deep()`
- 保持样式简洁

## 7. 工具函数与 Hook

### 7.1 Hook 定义

```typescript
// useTablePage.ts
export default function useTablePage<TParams, TData>(
  requestFn: (params: TParams) => Promise<[ResResult<IPaginationResData<TData[]>> | null, any]>;
  dealParams: () => TParams;
  options?: IUseTablePageOptions
): {
  // 返回响应式数据和方法
}
```

### 7.2 Hook 使用场景

- 表格分页逻辑（useTablePage）
- 枚举值获取（useEnums）
- 页面加载状态（usePageLoading）

## 8. 表单处理

### 8.1 表单组件

- 使用封装的 dForm 组件
- 配置式表单定义

### 8.2 表单验证与提交

```typescript
// 表单配置
const formConfigs: IFormConfig[] = [
  {
    valueKey: 'phone',
    comp: 'n-input',
    label: '手机号',
    required: true,
    rules: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ]
  }
]

// 表单提交
const handleSubmit = async () => {
  try {
    const validateResult = await formRef.value?.validate()
    if (validateResult?.warnings) return

    loading.value = true
    // 表单提交逻辑
  } catch (error) {
    message.error('表单验证失败，请检查输入信息')
  } finally {
    loading.value = false
  }
}
```

## 9. 性能优化

- 组件和路由懒加载
- 使用 `computed` 缓存计算结果
- 避免模板中复杂表达式
- 使用 `shallowRef` 和 `shallowReactive` 优化响应式

## 10. 测试与调试

- 类型检查：`npx tsc --noEmit`
- 调试工具：Vue DevTools、Browser DevTools
- 日志记录：清晰记录错误信息

## 11. 安全规范

- 前后端双重输入验证
- 敏感数据加密传输
- 路由守卫和接口权限验证

---

**版本**：1.0.0 **生效日期**：2023-12-20 **维护人**：前端开发团队
