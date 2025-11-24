# Project Context

## Purpose
一个现代化的全栈管理后台系统，采用前后端分离架构，提供用户管理、资源管理、权限控制等核心功能。目标是为企业提供高效、可扩展的管理解决方案。

## Tech Stack

### Frontend
- **Vue 3.5.22+** - 主流前端框架 (Composition API)
- **Vite 6.1.0+** - 构建工具和开发服务器
- **Naive UI 2.41.0+** - 企业级 UI 组件库
- **Pinia 2.3.0+** - 状态管理
- **Vue Router 4.6.3+** - 前端路由
- **UnoCSS 66.5.6+** - 原子化 CSS 框架
- **Axios 1.7.7+** - HTTP 客户端
- **@vueuse/core 13.0.0+** - Vue 组合式工具库

### Backend
- **NestJS 11.0.1+** - Node.js 企业级后端框架
- **Prisma 6.13.0+** - 数据库 ORM
- **PostgreSQL** - 主要数据库
- **Redis** - 缓存和会话存储
- **JWT/Passport** - 身份认证

### Development Tools
- **TypeScript 5.9.2+** - 类型安全
- **pnpm** - 包管理器 (工作区模式)
- **Turbo 2.2.3+** - Monorepo 构建工具
- **Oxlint 1.8.0+** - 代码规范检查
- **Vitest 4.0.0+** - 测试框架

### Communication & Types
- **Protocol Buffers** - API 接口定义和类型生成
- **gRPC/WebSocket** - 实时通信

## Project Conventions

### Code Style
- **缩进**: 2 空格缩进
- **命名规范**:
  - 目录: kebab-case (如 `user-management`)
  - 变量/函数: camelCase (如 `userName`, `getUserInfo`)
  - 常量: UPPER_SNAKE_CASE (如 `API_BASE_URL`)
  - 组件: PascalCase (如 `UserForm`, `DataTable`)
  - 函数式组件: 使用 `function` 关键字
- **TypeScript**: 优先使用 `interface`，避免 `enum`，严格模式
- **导入顺序**: Vue → 第三方 → 项目内部 → 组件 → 类型

### Architecture Patterns

#### 前端架构
- **组件分层**:
  - 公共组件 → `packages/components/ui`
  - 业务组件 → `src/components`
  - 业务内组件 → 同目录 `components`
- **状态管理**: Pinia + 自定义 Hooks
- **API 请求**: 封装 axios，返回 `[data, error]` 格式
- **类型驱动**: Proto 生成类型 → API 扩展 → 本地类型

#### 后端架构
- **模块化设计**: 单一职责原则
- **分层结构**: Controller → Service → Repository
- **数据模型**: Prisma Schema 定义
- **API 设计**: RESTful + GraphQL

### Development Workflow
1. **类型定义**: Proto → 生成共享类型
2. **数据模型**: Prisma Schema → 关联关系、索引
3. **后端实现**: Service (业务逻辑) → Controller (接口组装)
4. **前端实现**: API 函数 → Composables 封装
5. **测试验证**: 接口联调、功能测试

### Git Workflow
- **分支策略**: Git Flow 或 GitHub Flow
- **提交规范**: 使用 conventional commits 格式
- **代码质量**: 提交前自动运行 lint 和测试

## Domain Context

### 核心功能模块
- **用户管理**: 用户注册、登录、信息管理、状态控制
- **权限系统**: 角色管理、权限分配、访问控制
- **资源管理**: 菜单、资源配置、功能权限
- **系统监控**: 健康检查、性能监控、日志管理

### 数据模型
- **用户实体**: 手机号作为主键，用户名、状态、角色关联
- **角色权限**: 角色定义、权限配置、用户-角色关联
- **系统资源**: 菜单项、功能点、权限标识

## Important Constraints

### 技术约束
- **Node.js**: 版本 22.17.1 LTS
- **数据库**: PostgreSQL (生产环境)
- **缓存**: Redis (会话和性能优化)
- **构建**: 禁止使用 npm/yarn，必须使用 pnpm

### 架构约束
- **前后端分离**: 独立的部署和扩展
- **类型安全**: 严格 TypeScript 类型检查
- **API 优先**: 基于 Proto 定义的一致接口
- **响应式**: 支持 PWA 和移动端适配

### 安全约束
- **身份认证**: JWT Token 机制
- **权限控制**: 基于角色的访问控制 (RBAC)
- **数据验证**: 前后端双重数据校验
- **会话管理**: Redis 分布式会话

## External Dependencies

### 数据库
- **PostgreSQL 15+** - 主数据库
- **Redis 7+** - 缓存和会话存储

### 第三方服务
- **支付集成**: 支付宝、微信支付、Stripe
- **企业微信**: 身份认证和消息推送
- **云服务**: 支持 Kubernetes 部署

### 开发依赖
- **代码质量**: OxLint、Prettier、TypeScript
- **测试工具**: Vitest、Jest、Testing Library
- **文档工具**: Swagger/OpenAPI、Storybook

### 部署和运维
- **容器化**: Docker、Docker Compose
- **编排**: Kubernetes
- **监控**: 集成监控和日志系统
- **CDN**: 静态资源加速
