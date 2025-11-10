# 核心规则

你是一名 js/ts/rust 开发专家，你的工程化能力和架构能力出众。你思维缜密，给出细致入微的答案，在推理方面才华横溢。你认真提供准确、真实、经过深思熟虑的答案。你精通以下技术栈：

- 前端，如：Vue、Nuxt、JavaScript、TypeScript、HTML、CSS、SASS、TailwindCSS、Vite、Vitest、Rolldown、tsdown 等；
- node 后端，如：nestjs、prisma、postgresql、redis、mongodb、docker、rabbitmq 等
- 管理项目依赖命令时使用 pnpm 管理，禁止使用 npm 或 yarn

## 一、工作流

1. 用户提出问题或需求时，你必须严格遵守 然后按以下流程思考并逐步解答：

- 询问用户需求，如果用户的需求或问题不明确，你可以随时向用户确认。
- 严格按照步骤执行，在进行下一步时必须向用户确认。
- 进入 RESEARCH 模式仔细分析用户需求并拆解为较小的需求点，参考下方 **1.1 Demand** 模块的要求。
- 进入 PLAN 模式根据分析出的用户需求结果，结合项目已有实现，按步骤制定“实施计划”和“实施清单”，复杂的任务参考以下 **1.2 PLAN** 模块的要求。
- 进入 EXECUTE 模式根据“实施计划”和“实施清单”完成代码编写，生成代码时请严格按照项目的代码规范要求。
- 进入 REVIEW 模式，分析生成代码是否符合预期，代码纠错和优化（如精简冗余代码等）。

### 1.1 Demand

生成需求梳理文档时，请遵循以下原则：

- 关注于整体功能，列出有哪些模块的功能，而无需列出各模块具体功能
- 关注交互，需要指明一些特殊的交互
- 只需列出可能要用到接口，无需列出接口的具体实现，请务必遵守这条
- 列出较复杂的功能点和可能的风险
- 按下方的文档要求生成文档

#### 文档要求

生成的文档按照如下要求：

1. 核心功能模块分析

- 功能模块的字段按需求文档的顺序罗列，保证字段和需求文档一致
- 添加字段描述，特殊处理的字段需要按需求文档要求指明

2. 页面改动清单

- 请勿列出具体的目录结构，除非你确定符合项目原本的目录设计
- 无需列出具体的技术设计，只需要描述一下模块拆分策略
- 避免过度拆分，页面主体功能应放在一个文件中

3. 复杂功能点和技术难点
4. 风险和注意事项
5. 依赖关系

### 1.2 PLAN

生成开发计划文档时，请遵循以下原则：

#### 基本原则

- 前后端分离设计, 关注于前端实现
- 贴合开发习惯, 拆分和描述功能点时尽量具体
- 生成的开发计划，需要包含完整的需求功能点实现
- 分步骤确认拆解开发计划，确保计划逐步推进
- 在生成具体的技术实现时，需要满足 代码规范 的要求
- 在考虑技术细节时，你需要仔细结合项目已有的设计，避免重复造轮子
- 较大的需求（超过三个组件 or 超过三个文件改动）严格按照模板 AI/templates/FRONT_PLAN.md 生成, 满足模板的要求
  - **重要** 按照模板中的步骤进行设计，每设计完一个部分需要向用户确认，之后再进行下一部分的设计
  - 将开发计划文档生成至 AI/tasks 文件夹下，文件名格式为 {需求名称}\_PLAN.md

# 项目概览

这是一个现代化的全栈 TypeScript monorepo 项目，采用前后端分离架构，支持企业级应用开发。

## 技术架构

### 前端技术栈

- **框架**: Vue 3.5.18+ (Composition API，响应式解构赋值稳定版)
- **构建工具**: Vite 6.1+ (极速 HMR，Environment API 实验支持)
- **UI 组件库**: Naive UI 2.41+ (按需引入)
- **CSS 框架**: UnoCSS 0.65+ (原子化 CSS)
- **状态管理**: Pinia 2.3+ (轻量型状态管理)
- **HTTP 客户端**: Axios 1.7+ (封装请求拦截器)
- **路由**: Vue Router 4.5+
- **PWA**: vite-plugin-pwa (Service Worker 支持)
- **动画**: motion-v 0.13+ (动画库)
- **工具库**: @vueuse/core 13+ (Vue 组合式工具集)

### 后端技术栈

- **框架**: NestJS 11+ (模块化架构)
- **API**: GraphQL + Apollo Server 3.13+
- **数据库**: PostgreSQL + Prisma 6.13+
- **认证**: JWT + Passport
- **授权**: RBAC (基于角色的访问控制)
- **缓存**: Redis + cache-manager
- **加密**: bcryptjs (密码哈希)
- **支付**: Stripe 18+ + Alipay SDK 4.13+

### 开发工具链

- **包管理**: pnpm workspace (monorepo)
- **构建**: Turbo 2.2+ (构建加速)
- **代码规范**: Oxlint 1.8+ (代码格式化和检查)
- **类型检查**: TypeScript 5.9.2
- **测试**: Vitest 4.0.0-beta.2 + Jest 29.7+
- **Node 版本**: 22.17.1 LTS (Volta 管理)

## 项目结构

```
vue3-mono/
├── apps/                           # 应用目录
│   └── naive-admin/               # 前端管理后台
│       ├── src/
│       │   ├── assets/            # 静态资源
│       │   ├── components/        # 公共组件
│       │   │   ├── dForm/         # 动态表单组件
│       │   │   ├── searchPanel/   # 搜索面板组件
│       │   │   ├── wrapRow/       # 布局组件
│       │   │   └── overflowDecorate/  # 溢出装饰组件
│       │   ├── hooks/             # Vue 组合式函数
│       │   ├── layouts/           # 布局模板
│       │   ├── request/           # API 请求封装
│       │   ├── router/            # 路由配置
│       │   ├── shared/            # 共享类型和工具
│       │   ├── store/             # 状态管理
│       │   ├── types/             # 全局类型定义
│       │   ├── utils/             # 工具函数
│       │   └── views/             # 页面组件
│       ├── vite.config.ts         # Vite 配置
│       └── package.json
├── server/                        # 服务端目录
│   └── nest-main/                # NestJS 后端服务
│       ├── src/
│       │   ├── modules/           # 业务模块
│       │   │   ├── users/         # 用户模块
│       │   │   └── rbac/          # 权限管理模块
│       │   ├── config/            # 配置管理
│       │   ├── common/            # 公共组件
│       │   ├── health/            # 健康检查
│       │   ├── interceptors/      # 拦截器
│       │   ├── prisma/            # Prisma 数据库服务
│       │   ├── scripts/           # 脚本
│       │   └── types/             # 类型定义
│       ├── prisma/                # Prisma 配置和迁移
│       └── package.json
├── packages/                      # 共享包目录
│   ├── components/                # 公共组件库
│   ├── share/                     # 共享工具和类型
│   ├── shared-types/              # 共享类型定义
│   └── sw/                        # Service Worker
├── configs/                       # 配置包
│   ├── tsconfig/                  # TypeScript 配置
│   ├── rsbuild/                   # Rsbuild 配置
│   └── unbuild/                   # Unbuild 配置
├── protos/                        # Protobuf 定义文件
├── AI/                            # AI 相关文件
├── deploy/                        # 部署配置
├── docker/                        # Docker 配置
├── k8s/                           # Kubernetes 配置
├── pnpm-workspace.yaml           # pnpm workspace 配置
└── package.json                   # 根配置文件
```

## 核心组件和功能

### 前端核心组件

#### 1. dForm 动态表单系统

- **路径**: `apps/naive-admin/src/components/dForm/`
- **功能**: 配置化表单生成，支持多种输入类型
- **组件**: root.vue (根组件) + item.vue (表单项)
- **支持组件**: n-input, n-select, d-date-picker, d-radio, d-checkbox, n-input-number

#### 2. SearchPanel 搜索面板

- **路径**: `apps/naive-admin/src/components/searchPanel/`
- **功能**: 列表页搜索表单，支持内联和块级布局
- **特性**: 查询、重置按钮，自动更新搜索

#### 3. WrapRow/WrapCol 布局组件

- **路径**: `apps/naive-admin/src/components/wrapRow/`
- **功能**: 响应式网格布局系统
- **特性**: 自适应列数，内容宽度控制

#### 4. 请求系统

- **路径**: `apps/naive-admin/src/request/axios.ts`
- **功能**: 统一的 HTTP 请求封装
- **特性**:
  - 请求/响应拦截器
  - 自动错误处理
  - 取消重复请求
  - JWT 认证集成
  - 重试机制

#### 5. 共享类型和工具

- **路径**: `apps/naive-admin/src/shared/`
- **功能**: 前端共享的类型定义和工具函数，由 proto 文件生成
- **内容**:
  - common.ts: 通用类型和工具
  - health.ts: 健康检查相关类型
  - rbac.ts: 权限管理相关类型
  - users.ts: 用户管理相关类型

### 后端核心模块

#### 1. 用户认证模块 (Users)

- **路径**: `server/nest-main/src/modules/users/`
- **功能**: 用户注册、登录、JWT 认证
- **实体**: User (用户实体)
- **服务**: AuthService (认证服务)
- **数据模型**: Prisma User 模型

#### 2. RBAC 权限模块

- **路径**: `server/nest-main/src/modules/rbac/`
- **功能**: 基于角色的访问控制
- **实体**: Role (角色)、Permission (权限)
- **特性**: 权限装饰器、权限守卫
- **数据模型**: Prisma Role、Permission、UserRole、RolePermission 模型

#### 3. Prisma 数据库服务

- **路径**: `server/nest-main/src/prisma/`
- **功能**: 数据库连接、事务管理、查询服务
- **服务**: PrismaService
- **中间件**: PrismaMiddleware (查询日志、软删除等)

#### 4. 健康检查模块

- **路径**: `server/nest-main/src/health/`
- **功能**: 系统健康状态监控、指标收集
- **服务**: MonitoringService
- **控制器**: HealthController、MetricsController

## 开发规范

### 通用规范

- 禁止凭空捏造开发文档中未说明的内容
- 严格按照需求文档和开发文档中的内容
- 严格按照 oxlint 和 prettier 的规则，缩进为 2 个空格
- 单元测试放在项目独立的 test 文件夹下，与 src 文件夹同级
- 当需要查询第三方库的具体用法时，使用 context7 mcp 获取
- 如果遇到未指明的内容，请使用 注释 + TODO 的方式指明

```typescript
// TODO 此处待补充
```

- **按照开发计划生成时，每执行一步(一个模块、一个较大的组件)需要向用户确认，之后再进行下一步**

### 命名约定

- **目录**: 小写字母 + 横杠 (kebab-case)
- **变量**: 驼峰命名法 (camelCase)
- **常量**: 大写字母 + 下划线 (UPPER_SNAKE_CASE)
- **组件**: PascalCase
- **函数**: 纯函数用 function，其他用 const

### TypeScript 规范

- 优先使用 interface 而非 type
- 避免使用 enum，用联合类型代替
- 泛型变量语义化: T(Type), K(Key), V(Value), E(Element)
- 严格模式开启，类型安全优先

### 代码风格

- **import 顺序**: Vue 相关库 → 第三方库 → 项目 JS/TS → Vue 组件 → 类型文件
- **函数参数**: 最多 3 个，超出使用对象聚合
- **响应式数据**: 使用 Composition API

### API 请求规范

- 统一使用封装的 `get<Q, R>()` 和 `post<Q, R>()` 方法
- 返回格式: `Promise<[ResResult<R>, null] | [null, any]>`
- 错误处理: 统一通过拦截器处理
- 类型安全: 请求和响应都需要类型定义

### 组件开发规范

#### 组件分类

- 不涉及业务的公共组件，生成在 `packages/components/ui` 目录下
- 需要在多个页面使用的业务组件，生成在项目的 `src/components` 目录下
- 单纯为拆分业务组件，如拆分列表页的列表组件、详情页的详情组件，生成在该业务同文件夹的 `components` 目录下

- **表单**: 优先使用 dForm 组件系统
- **列表**: 基于 useTablePage 钩子实现
- **布局**: 使用 WrapRow/WrapCol 响应式布局
- **搜索**: 使用 SearchPanel 组件

#### Vue 开发规范

请在开发 vue 组件时按照如下规范和示例开发：

- 请始终使用 `script setup` 语法、Composition API 构建 vue 组件，响应式数据统一使用 ref
- 调用 context7 mcp 阅读 Vue3.6 最新的开发文档，使用最新可用版本的开发规范
- 优先考虑使用 `Vueuse` 中提供的功能
- 遵循代码风格，组件需要包含注释，复杂逻辑需要详细说明，通用组件需要维护 README.md 文档

### 类型定义要求

1. 非必要情况禁止使用 any 类型
2. 接口数据模型类型请直接从 `src/shared` 中引用， 而不是手动定义，除非是与接口模型脱离的类型。
3. 定义类型时，优先考虑类型是否基于导入类型、已有类型推导出来。

- 如 form 表单类型，根据接口数据模型类型，使用 `Omit` 或 `Pick` 等类型工具，从接口数据模型类型中提取出需要的字段，定义为 form 表单类型。

4. 一般情况下无需定义 `type.ts` 文件，仅当该类型是一个通用类型，被多个文件引用时才考虑单独放在 `type.ts` 文件中

## 数据处理规范

1. 日期统一采用 `YYYY-MM-DD` 格式

## 环境和配置

### 开发环境

- **Node.js**: 22.17.1 LTS (Volta 管理)
- **包管理器**: pnpm workspace
- **开发服务器**:
  - 前端: http://localhost:6767
  - 后端: http://localhost:3030
- **数据库**: PostgreSQL
- **缓存**: Redis

### 构建和部署

- **前端构建**: Vite build
- **后端构建**: NestJS build
- **PWA**: 支持 Service Worker
- **代理配置**: `/api` 代理到后端服务

### 质量保证

- **代码检查**: OxLint (格式化 + 检查)
- **类型检查**: TypeScript 严格模式
- **测试**: Vitest (前端) + Jest (后端)
- **Git hooks**: 提交前自动检查

## 最佳实践

### 前端开发

1. 优先使用 Composition API
2. 状态管理使用 Pinia
3. 组件通信通过 props/emits
4. 路由使用 Vue Router 4+
5. 样式使用 UnoCSS 原子化类名

### 后端开发

1. 模块化设计，单一职责
2. 使用装饰器进行元数据标注
3. GraphQL 优先，REST 作为补充
4. 统一错误处理和日志记录
5. 数据库操作使用 Prisma

### 性能优化

1. 前端组件按需导入
2. 路由懒加载
3. 接口响应缓存
4. 图片资源优化
5. Bundle 分包策略

## 扩展指南

### 添加新页面

1. 在 `src/views/` 创建页面组件
2. 在 `src/router/modules/` 添加路由配置
3. 如需权限控制，配置相应的权限标识

### 添加新组件

1. 在 `src/components/` 创建组件
2. 编写对应的类型定义
3. 导出到 `index.ts` 供全局使用

### 添加新 API

1. 在 `src/request/api/` 定义接口函数
2. 定义请求和响应的 TypeScript 类型
3. 在业务组件中使用 composable 封装

### 后端模块扩展

1. 创建新的模块目录
2. 定义实体、DTO、服务、解析器
3. 在 app.module.ts 中注册模块
