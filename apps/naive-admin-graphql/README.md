# Naive Admin

一个基于 Vue 3 + Naive UI 的现代化后台管理系统模板。

## 技术栈

### 核心技术
- **Vue 3**：使用最新的组合式 API
- **TypeScript**：完整的类型支持
- **Vite**：现代化构建工具，快速的开发体验
- **Naive UI**：高质量 Vue 3 组件库
- **Pinia**：Vue 的状态管理库
- **Vue Router**：Vue 的官方路由
- **UnoCSS**：原子化 CSS 引擎

### 工具库
- **Axios**：强大的 HTTP 客户端
- **@vueuse/core**：Vue 组合式 API 实用函数集合
- **@iconify/vue**：SVG 图标库
- **motion-v**：动画库
- **date-fns**：日期工具库

## 项目目录结构

```
apps/naive-admin/
├── src/
│   ├── assets/         # 静态资源（字体、图片、样式）
│   ├── components/     # 公共组件
│   ├── hooks/          # 自定义 Hooks
│   ├── layouts/        # 布局组件
│   ├── plugins/        # Vue 插件、第三方库
│   ├── request/        # 请求封装（Axios）
│   ├── router/         # 路由配置
│   ├── store/          # Pinia 状态管理
│   ├── types/          # 全局类型定义
│   ├── utils/          # 工具函数
│   ├── views/          # 页面组件
│   └── App.vue         # 根组件
├── public/             # 公共资源
└── vite.config.ts      # Vite 配置
```

## 功能特性

### 1. 完善的请求封装

- Axios 请求/响应拦截器
- 请求取消功能
- 请求重试机制
- 错误处理统一管理
- JWT Token 管理
- `get`/`post` 等方法封装

### 2. 表格页面封装 (useTablePage)

支持以下功能：
- 表格数据加载和展示
- 分页控制
- 自定义表头
- 加载状态管理
- 自定义响应处理

### 3. 表单组件 (dForm)

高度封装的表单组件，支持：
- 多种表单控件（选择器、输入框、日期选择器等）
- 表单验证
- 条件显示字段
- 自定义宽度和布局

### 4. 路由和菜单管理

- 自动路由注册
- 路由权限控制
- 菜单自动生成

### 5. 丰富的 UI 组件

- 表格
- 表单
- 搜索面板
- 溢出容器装饰

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 本地预览生产版本

```bash
pnpm preview
```

## API 开发指南

### REST API 请求

```typescript
// 定义 API 函数
import { get, post } from '@/request/axios'

export const api_getUserList = (params) => {
  return get('/api/users', { params })
}

export const api_createUser = (data) => {
  return post('/api/users', { data })
}
```

### GraphQL 请求

1. 在业务模块的 `graphql` 文件夹中定义查询结构
2. 使用 compositionAPI 中的方法实现具体业务请求

### 表格页面开发

使用 `useTablePage` hook 快速实现带分页的表格：

```typescript
const { tableData, tableColumns, pagination, loading, firstPageRequest } = useTablePage(
  api_getDataList,
  () => ({
    page: pagination.page,
    page_size: pagination.pageSize,
    // 其他查询参数
  }),
  {
    returnHeader: true,
    customHeaders: {
      // 自定义列配置
    }
  }
)
```

### 表单开发

使用 `dForm` 组件快速实现表单：

```vue
<template>
  <DForm
    :model="formModel"
    :config="formConfig"
    label-width="100px"
  />
</template>

<script setup>
const formModel = reactive({
  name: '',
  age: 0
})

const formConfig = [
  {
    comp: 'n-input',
    valueKey: 'name',
    label: '姓名',
    props: {},
    rule: { required: true, message: '请输入姓名' }
  },
  {
    comp: 'n-input-number',
    valueKey: 'age',
    label: '年龄',
    props: {}
  }
]
</script>
```

## 进度

- [x] 路由封装
- [x] Pinia 封装
- [x] 菜单管理
- [x] 布局 (Layout)
- [x] 请求封装
- [ ] 权限管理
- [ ] 组件管理

## 贡献

欢迎贡献代码或提出建议！
