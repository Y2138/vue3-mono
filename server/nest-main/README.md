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

项目采用响应拦截器 + BaseController + 异常过滤器的模式进行响应处理：

- **ResponseInterceptor**：负责日志记录和性能监控
- **BaseController**：提供统一的响应方法，如 `success`、`paginated`、`notFound` 等
- **异常过滤器**：专门处理异常，转换为统一的错误响应格式
- **响应构建器**：支持链式调用，用于特殊场景
- **统一格式**：HTTP API 使用统一的响应格式

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

### 新需求开发步骤

#### 1. 定义数据模型

```bash
# 在 prisma/schema.prisma 中添加模型
model YourFeature {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 2. 定义 DTO 类型

```typescript
// src/modules/your-feature/dto/create-your-feature.dto.ts
export class CreateYourFeatureDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string
}
```

#### 3. 创建 Service 层

```typescript
// src/modules/your-feature/services/your-feature.service.ts
@Injectable()
export class YourFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateYourFeatureDto) {
    return this.prisma.yourFeature.create({
      data
    })
  }

  async findById(id: string) {
    return this.prisma.yourFeature.findUnique({
      where: { id }
    })
  }
}
```

#### 4. 实现 Controller 层

```typescript
// HTTP Controller
@Controller('your-features')
export class YourFeatureController extends BaseController {
  constructor(private readonly service: YourFeatureService) {
    super(YourFeatureController.name)
  }

  @Post()
  async create(@Body() data: CreateYourFeatureDto): Promise<ApiResponse<YourFeature>> {
    return this.safeExecute(() => this.service.create(data), '创建成功')
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<YourFeature>> {
    try {
      const feature = await this.service.findById(id)
      if (!feature) {
        return this.notFound('资源')
      }
      return this.success(feature, '获取成功')
    } catch (error) {
      // 异常会被 HttpExceptionFilter 捕获并格式化
      throw error
    }
  }
}
```

#### 5. 配置模块

```typescript
// src/modules/your-feature/your-feature.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [YourFeatureController],
  providers: [YourFeatureService],
  exports: [YourFeatureService]
})
export class YourFeatureModule {}
```

#### 6. 数据库迁移

```bash
# 生成迁移文件
npx prisma migrate dev --name add_your_feature

# 应用迁移
npx prisma migrate deploy
```

#### 7. 测试验证

```bash
# 单元测试
pnpm run test your-feature

# 集成测试
pnpm run test:e2e

# 手动测试 HTTP API
curl -X POST http://localhost:3000/your-features \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'
```

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
