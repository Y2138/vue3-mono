# NestJS 企业级后端服务

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/) [![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/) [![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

> 企业级 HTTP RESTful API 微服务架构，支持用户认证、权限管理、监控系统。

## 📁 项目结构

```
server/nest-main/
├── src/
│   ├── common/                 # 公共模块
│   │   ├── decorators/        # 装饰器（@Public等）
│   │   ├── filters/           # 异常过滤器
│   │   ├── guards/            # 守卫（认证、权限）
│   │   ├── interceptors/      # 拦截器（日志、监控）
│   │   ├── middleware/        # 中间件（安全防护）
│   │   └── transformers/      # 数据转换器
│   ├── modules/               # 业务模块
│   │   ├── users/            # 用户管理
│   │   │   ├── services/     # 业务服务层
│   │   │   ├── guards/       # 权限守卫
│   │   │   ├── seeds/        # 数据种子
│   │   │   ├── *.controller.ts   # HTTP 控制器
│   │   │   └── *.module.ts   # 模块定义
│   │   └── rbac/             # 权限管理
│   ├── health/               # 健康检查和监控
│   ├── prisma/               # Prisma ORM
│   └── shared/               # 共享类型定义
├── prisma/                   # 数据库 schema 和迁移
└── docker/                   # Docker 配置
```

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │    │   Monitoring    │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Application                          │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │ HTTP Module │  │ Health Module│                             │
│  └──────┬──────┘  └──────┬──────┘                             │
│         │                │                                    │
│  ┌──────▼────────────────▼──────┐                             │
│  │        Controller Layer      │                             │
│  │  ┌─────────────┐             │                             │
│  │  │HTTP Controllers│           │                             │
│  │  └──────┬──────┘             │                             │
│  └─────────┼────────────────────┘                             │
│            │                                                  │
│  ┌─────────▼───────────────────────────────┐                  │
│  │              Service Layer              │                  │
│  │  ┌─────────────┐  ┌─────────────┐      │                  │
│  │  │User Service │  │RBAC Service │      │                  │
│  │  └──────┬──────┘  └──────┬──────┘      │                  │
│  └─────────┼────────────────┼─────────────┘                  │
│            │                │                                │
│  ┌─────────▼────────────────▼─────────────────────────────────┐ │
│  │              Data Layer                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │  Prisma     │  │   Redis     │  │  Transformers│      │ │
│  │  │   ORM       │  │   Cache     │  │             │      │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │                │                │
            ▼                ▼                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │    Redis    │    │  Prometheus │
│   Database  │    │    Cache    │    │   Metrics   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 数据流向

1. **请求入口**：HTTP 请求进入对应的控制器
2. **认证授权**：通过 Guards 进行身份验证和权限检查
3. **业务处理**：Service 层处理业务逻辑
4. **数据转换**：Transformers 进行数据格式转换
5. **数据存储**：通过 Prisma ORM 操作 PostgreSQL 数据库
6. **响应返回**：经过拦截器处理后返回给客户端

### 各层职责

| 层级            | 职责                           | 主要组件                         |
| --------------- | ------------------------------ | -------------------------------- |
| **Controller**  | 请求路由、参数验证、响应格式化 | HTTP Controllers, BaseController |
| **Service**     | 业务逻辑、数据处理、事务管理   | Business Services                |
| **Transformer** | 数据格式转换、类型映射         | Data Transformers                |
| **Guard**       | 认证授权、权限验证             | Auth/Permission Guards           |
| **Interceptor** | 日志记录、性能监控             | ResponseInterceptor              |
| **Middleware**  | 请求处理、安全防护             | Security Middleware              |

### 响应处理架构

项目采用统一异常处理 + BaseController + 响应拦截器的模式进行响应处理：

- **HttpExceptionFilter**：全局异常过滤器，统一处理所有异常并转换为标准响应格式
- **自定义异常类**：业务异常、验证异常、数据不存在异常等，提供语义化的错误处理
- **BaseController**：提供统一的成功响应方法和异常抛出辅助方法
- **ResponseInterceptor**：负责日志记录和性能监控
- **统一响应格式**：所有 API 返回一致的 JSON 结构

#### 错误处理策略

1. **HTTP 状态码策略**：

   - `401` - 身份认证失败
   - `403` - 权限不足
   - `404` - API 端点不存在
   - `200` - 其他所有错误（业务错误、验证错误等）

2. **响应体格式**：
   ```json
   {
     "success": false,
     "code": 400,
     "message": "用户友好的错误信息",
     "error": {
       "type": "BUSINESS_ERROR",
       "details": { "field": "value" }
     }
   }
   ```

详细设计请参考 [响应处理架构](./docs/response-architecture.md)。

## 🔄 HTTP RESTful API

### API 特性

- **HTTP RESTful API**：适用于 Web 前端、移动应用
- **标准化响应**：统一的 API 响应格式
- **完整的 CRUD 操作**：支持所有标准 HTTP 方法

### 认证机制

- JWT Token 在 HTTP Header 中传递
- 统一的认证守卫和权限检查逻辑
- 支持 `@Public()` 装饰器跳过认证

## 🚀 开发流程规范

### 标准开发流程

本项目采用类型驱动的模块化开发模式，遵循以下六个步骤：

#### 1. 充分的需求设计和架构规划

- 分析业务需求，设计数据模型和接口规范
- 确定模块边界和依赖关系
- 规划异常处理策略和响应格式
- 评估性能需求和安全要求

#### 2. 定义 Prisma 数据模型

```bash
# 在 prisma/schema.prisma 中添加模型
model YourFeature {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  # 定义关联关系
  userId      String
  user        User     @relation(fields: [userId], references: [phone], onDelete: Cascade)

  # 添加索引优化查询性能
  @@index([name])
  @@index([createdAt])
}
```

#### 3. 定义 Proto 类型（自动生成前后端共享类型）

```protobuf
// protos/your-feature.proto
syntax = "proto3";
package yourfeature;

message YourFeature {
  string id = 1;
  string name = 2;
  string description = 3;
  string createdAt = 4;
  string updatedAt = 5;
  string userId = 6;
}

message CreateYourFeatureRequest {
  string name = 1;
  string description = 2;
  string userId = 3;
}

message GetYourFeatureResponse {
  YourFeature data = 1;
}
```

运行 `pnpm run generate:types` 自动生成 `src/shared/your-feature.ts` 类型定义

#### 4. 创建 Service 层（业务逻辑）

```typescript
// src/modules/your-feature/services/your-feature.service.ts
@Injectable()
export class YourFeatureService {
  private readonly logger = new Logger(YourFeatureService.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.YourFeatureCreateInput) {
    this.logger.log(`创建功能: ${data.name}`)

    // 业务验证
    this.validateBusinessRules(data)

    // 数据创建
    return this.prisma.client.yourFeature.create({
      data
    })
  }

  async findById(id: string) {
    this.logger.log(`查询功能: ${id}`)

    const feature = await this.prisma.client.yourFeature.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!feature) {
      throw new DataNotFoundException('功能', id)
    }

    return feature
  }

  private validateBusinessRules(data: Prisma.YourFeatureCreateInput) {
    // 业务规则验证
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationException('功能名称不能为空')
    }
  }
}
```

#### 5. 创建 Controller 层（接口组装和参数校验）

```typescript
// src/modules/your-feature/your-feature.controller.ts
import { Controller, Post, Get, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiProduces, ApiParam } from '@nestjs/swagger'
import { BaseController } from '../../common/controllers/base.controller'
import { CreateYourFeatureRequest } from '../../shared/your-feature'

@Controller('your-feature')
@ApiTags('功能管理')
export class YourFeatureController extends BaseController {
  constructor(private readonly yourFeatureService: YourFeatureService) {
    super(YourFeatureController.name)
  }

  @Post()
  @ApiOperation({ summary: '创建功能', description: '创建新的功能项' })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: Object
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误：功能名称不能为空'
  })
  async createFeature(@Body() request: CreateYourFeatureRequest) {
    // 参数验证
    this.assertNotEmpty(request.name, '功能名称')
    this.assertNotEmpty(request.userId, '用户ID')

    // 参数验证和转换
    const data: Prisma.YourFeatureCreateInput = {
      name: request.name,
      description: request.description,
      user: { connect: { phone: request.userId } }
    }

    // 调用业务服务
    const result = await this.yourFeatureService.create(data)

    // 组装响应数据
    return this.created({
      data: {
        id: result.id,
        name: result.name,
        description: result.description,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        userId: result.userId
      }
    })
  }

  @Get(':id')
  @ApiOperation({ summary: '获取功能详情', description: '根据ID获取功能详细信息' })
  @ApiParam({ name: 'id', description: '功能ID', required: true })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: Object
  })
  @ApiResponse({
    status: 404,
    description: '功能不存在'
  })
  async getFeature(@Param('id') id: string) {
    // 参数验证
    this.assertNotEmpty(id, '功能ID')

    const result = await this.yourFeatureService.findById(id)

    // 使用 BaseController 的断言方法，数据不存在时自动抛出 DataNotFoundException
    this.assertDataExists(result, '功能', id)

    return this.success({
      data: {
        id: result.id,
        name: result.name,
        description: result.description,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        userId: result.userId,
        user: {
          phone: result.user.phone,
          username: result.user.username
        }
      }
    })
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除功能', description: '根据ID删除功能' })
  @ApiParam({ name: 'id', description: '功能ID', required: true })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: Object
  })
  @ApiResponse({
    status: 404,
    description: '功能不存在'
  })
  async deleteFeature(@Param('id') id: string) {
    // 参数验证
    this.assertNotEmpty(id, '功能ID')

    // 检查功能是否存在
    const existing = await this.yourFeatureService.findById(id)
    this.assertDataExists(existing, '功能', id)

    // 调用业务服务删除
    await this.yourFeatureService.remove(id)

    return this.success(null, '删除成功')
  }
}
```

#### 6. 配置模块

```typescript
// src/modules/your-feature/your-feature.module.ts
@Module({
  controllers: [YourFeatureController],
  providers: [YourFeatureService],
  exports: [YourFeatureService],
  imports: [PrismaModule]
})
export class YourFeatureModule {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 模块初始化逻辑
    await this.seedInitialData()
  }

  private async seedInitialData() {
    // 种子数据初始化
  }
}
```

### 开发规范和要求

#### 类型安全

- 优先使用自动生成的类型定义（`src/shared/*.ts`）
- 避免使用 `any` 类型，确保编译时类型检查
- 接口请求和响应都要有完整的类型定义

#### 错误处理

- 使用统一的异常类（`DataNotFoundException`、`ValidationException` 等）
- 遵循 HTTP 状态码策略
- 提供用户友好的错误信息

#### API 文档

- 所有接口必须添加 `@ApiOperation` 装饰器
- 使用 `@ApiResponse` 定义完整的响应格式
- 包含成功和错误状态的详细描述

#### 性能优化

- 为频繁查询的字段添加数据库索引
- 使用分页查询避免大量数据加载
- 合理使用 Prisma 的 `include` 和 `select`

#### 安全考虑

- 输入参数严格验证
- 敏感数据加密存储
- 实现基于 RBAC 的权限控制（如适用）

## 🛠️ 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### 启动项目

```bash
# 安装依赖
pnpm install

# 启动开发环境
./deploy.sh dev

# 生成 Prisma 客户端
pnpm run prisma:generate

# 启动应用
pnpm run start:dev
```

### 验证服务

```bash
# HTTP 健康检查
curl http://localhost:3000/health

# API 端点测试
curl http://localhost:3000/api/users
```

## 📊 监控端点

- `/health` - 基础健康检查
- `/metrics` - Prometheus 指标
- `/health/detailed` - 详细健康状态

## 🔧 常用命令

```bash
# 开发
pnpm run start:dev          # 启动开发服务器
pnpm run build              # 构建项目
pnpm run test               # 运行测试

# 数据库
npx prisma migrate dev      # 生成并应用迁移
npx prisma studio           # 打开数据库管理界面

# Prisma
pnpm run prisma:generate    # 生成 Prisma 客户端

# 部署
./deploy.sh basic           # 基础部署
./deploy.sh monitoring      # 完整监控部署
```

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [Prisma 指南](./docs/prisma-guide.md)
- [响应处理架构](./docs/response-architecture.md)
- [API 文档](./docs/api.md)

---

_最后更新: 2024-08-15_
