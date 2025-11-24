# 开发文档模板 - 后端服务开发版（类型驱动开发）

> **AI 协作提示**: 此模板用于生成后端服务开发文档。请根据实际需求替换所有 `[AI_FILL]` 标记的内容。此模板专为 AI 辅助开发设计，采用类型驱动的 6 步模块化开发模式。
>
> **类型驱动原则**: 基于 Protobuf 自动生成的类型定义，确保前后端接口一致性和类型安全。
>
> **架构核心**: 基于 NestJS + TypeScript + Prisma + Vue 3 全栈 TypeScript monorepo 架构，使用 REST API + 类型安全开发模式。

## 📋 项目概述与配置

**项目概述**: TODO: [AI_FILL]

**技术架构**:

- 后端：基于 NestJS + TypeScript 的现代化企业级框架
- 数据库：PostgreSQL + Prisma ORM
- API 协议：基于 Protobuf 的 REST API
- 类型系统：前端共享的类型定义

**开发环境**:

- Node.js 22.17.1 LTS (Volta 管理)
- 包管理器：pnpm workspace (monorepo)
- 构建工具：Vite 6.1+ (前端) + NestJS Build (后端)
- 数据库：PostgreSQL 16+
- 缓存：Redis 7+

## 🎯 开发目标拆解

> 本项目采用类型驱动的 6 步开发模式，每个步骤相互独立且可验证完成度。

### 步骤 1：需求设计和架构规划

**架构决策**:

- 采用 BaseController + Service + Repository 三层架构
- 基于 Protobuf 类型定义确保接口一致性
- 统一的错误处理和响应格式
- 支持 RBAC 权限控制

**技术框架**:

- **架构**: NestJS 模块化架构
- **类型定义**: Protocol Buffers
- **权限控制**: RBAC (基于角色的访问控制)
- **API 文档**: Swagger + 自动化文档

### 步骤 2：模块配置

**架构决策**:

- 模块化设计支持独立部署和测试
- 统一的依赖注入和配置管理
- 基于装饰器的权限控制
- 自动化 API 文档生成

**技术框架**:

- **模块化**: NestJS Module
- **依赖注入**: NestJS DI Container
- **权限控制**: RBAC + 装饰器

### 步骤 3：Prisma 数据模型设计

**架构决策**:

- 统一的基类模型（BaseModel）包含审计字段
- 严格的外键约束保证数据一致性
- 合理的索引设计优化查询性能
- 支持软删除保持数据完整性

**技术框架**:

- **ORM**: Prisma 6.13+
- **数据库**: PostgreSQL 16+
- **迁移**: Prisma Migrate
- **类型生成**: prisma generate

### 步骤 4：接口 Proto 类型定义

**架构决策**:

- 前后端共享的 Protobuf 类型定义
- 统一的编码规范和命名约定
- 支持类型演进的向后兼容
- 自动生成 TypeScript 类型文件

**技术框架**:

- **类型定义**: Protocol Buffers 3
- **代码生成**: protoc + TypeScript 插件
- **类型共享**: 前端共享包

### 步骤 5：Service 层实现

**架构决策**:

- Service 层封装所有业务逻辑
- 使用 Repository 模式隔离数据访问
- 统一的事务管理和异常处理
- 基于 Redis 的多层缓存策略

**技术框架**:

- **数据访问**: Prisma Client
- **业务逻辑**: NestJS Service
- **缓存**: Redis + cache-manager
- **验证**: BaseController 内置验证方法

### 步骤 6：Controller 层实现

**架构决策**:

- 所有 Controller 必须继承 BaseController
- 使用统一的响应格式和错误处理
- 参数验证通过装饰器和管道实现
- 业务日志和安全审计

**技术框架**:

- **控制器**: NestJS Controller + BaseController
- **验证**: class-validator + ValidationPipe
- **日志**: 统一的业务日志记录
- **异常处理**: BaseController 内置方法

---

## 🔧 技术栈规范

### 核心技术栈

- **后端框架**: NestJS 11+ (TypeScript, 模块化架构)
- **数据库**: PostgreSQL 16+ + Prisma 6.13+ (ORM)
- **API 协议**: REST + Protocol Buffers (类型安全)
- **认证授权**: JWT + Passport + RBAC
- **缓存**: Redis 7+ + cache-manager
- **构建工具**: Turbo 2.2+ (monorepo 构建加速)
- **代码规范**: Oxlint 1.8+ + TypeScript 5.9.2 (严格模式)

### 类型驱动开发

- 前后端共享的 Protobuf 类型定义
- 自动生成 TypeScript 类型文件确保类型安全
- 支持类型演进的向后兼容策略

### 架构核心组件

#### BaseController 规范

- 所有 Controller 必须继承 BaseController
- 使用统一的响应方法：`success()`, `created()`, `paginated()`
- 使用断言方法：`assertNotEmpty()`, `assertDataExists()`
- 异常处理：`throwValidationError()`, `throwDataNotFound()`

### API 设计规范

#### RESTful 端点设计

- GET /api/resources/list # 获取资源列表（分页）
- GET /api/resources/detail # 获取单个资源
- POST /api/resources/create # 创建资源
- PUT /api/resources/update # 更新资源
- DELETE /api/resources/delete # 删除资源

#### 统一响应格式

- 成功响应：使用 BaseController 提供的 `success()` 方法 包含 success, data, message, timestamp
- 分页响应：使用 BaseController 提供的 `paginated()` 方法 包含 success, data, pagination, message, timestamp
- 错误响应：使用 BaseController 提供的 `throwXXX()/assertXXX()` 方法 包含 success, error, timestamp

### 数据库设计规范

- 基类模型包含审计字段：id, createdAt, updatedAt, deletedAt
- 支持软删除保持数据完整性
- 合理的索引设计优化查询性能
- 严格的外键约束保证数据一致性

### 开发规范要求

#### 类型安全要求

- 严格禁止使用 `any` 类型
- 所有 API 请求/响应必须有类型定义
- 优先使用 `interface` 而非 `type`
- 泛型变量语义化：T(Type), K(Key), V(Value), E(Element)

#### 错误处理规范

- 使用 BaseController 内置的断言方法
- 业务错误使用自定义异常类
- 日志记录包含错误堆栈和上下文

#### 性能优化要求

- 数据库查询使用适当的索引
- 热点数据使用 Redis 缓存
- 大数据量查询实现分页
- 批量操作使用事务处理

#### 安全要求

- 所有 Controller 继承 BaseController
- 使用装饰器进行权限控制
- 输入验证通过 class-validator
- SQL 注入防护通过 Prisma 参数化查询
