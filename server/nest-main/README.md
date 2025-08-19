# NestJS 双协议微服务架构

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![gRPC](https://img.shields.io/badge/gRPC-Enabled-green.svg)](https://grpc.io/)

> 企业级双协议（HTTP + gRPC）微服务架构，支持用户认证、权限管理、监控系统。

## 📁 项目结构

```
server/nest-main/
├── src/
│   ├── common/                 # 公共模块
│   │   ├── decorators/        # 装饰器（@Public等）
│   │   ├── filters/           # 异常过滤器
│   │   ├── guards/            # 守卫（认证、权限）
│   │   ├── interceptors/      # 拦截器（日志、监控）
│   │   ├── middleware/        # 中间件（协议检测、安全）
│   │   ├── transformers/      # 数据转换器（Entity ↔ Proto）
│   │   └── grpc/             # gRPC 基础设施
│   ├── modules/               # 业务模块
│   │   ├── users/            # 用户管理
│   │   │   ├── services/     # 业务服务层
│   │   │   ├── guards/       # 权限守卫
│   │   │   ├── seeds/        # 数据种子
│   │   │   ├── *.http.controller.ts   # HTTP 控制器
│   │   │   ├── *.grpc.controller.ts   # gRPC 控制器
│   │   │   └── *.module.ts   # 模块定义
│   │   └── rbac/             # 权限管理
│   ├── health/               # 健康检查和监控
│   ├── prisma/               # Prisma ORM
│   └── shared/               # 共享类型定义
├── protos/                   # Protocol Buffer 定义
├── prisma/                   # 数据库 schema 和迁移
└── docker/                   # Docker 配置
```

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │    │  gRPC Client    │    │   Monitoring    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Application                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ HTTP Module │  │ gRPC Module │  │ Health Module│            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                   │
│  ┌──────▼────────────────▼────────────────▼──────┐            │
│  │              Controller Layer                 │            │
│  │  ┌─────────────┐  ┌─────────────┐            │            │
│  │  │HTTP Controllers│ │gRPC Controllers│        │            │
│  │  └──────┬──────┘  └──────┬──────┘            │            │
│  └─────────┼────────────────┼───────────────────┘            │
│            │                │                               │
│  ┌─────────▼────────────────▼───────────────────────────────┐ │
│  │              Service Layer                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│  │  │User Service │  │RBAC Service │  │Auth Service │      │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │ │
│  └─────────┼────────────────┼────────────────┼──────────────┘ │
│            │                │                │               │
│  ┌─────────▼────────────────▼────────────────▼───────────────┐ │
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

1. **请求入口**：HTTP/gRPC 请求进入对应的控制器
2. **认证授权**：通过 Guards 进行身份验证和权限检查
3. **业务处理**：Service 层处理业务逻辑
4. **数据转换**：Transformers 将 Prisma Entity 转换为 Proto 消息
5. **数据存储**：通过 Prisma ORM 操作 PostgreSQL 数据库
6. **响应返回**：经过拦截器处理后返回给客户端

### 各层职责

| 层级 | 职责 | 主要组件 |
|------|------|----------|
| **Controller** | 请求路由、参数验证、响应格式化 | HTTP/gRPC Controllers, BaseController |
| **Service** | 业务逻辑、数据处理、事务管理 | Business Services |
| **Transformer** | 数据格式转换、类型映射 | Entity ↔ Proto |
| **Guard** | 认证授权、权限验证 | Auth/Permission Guards |
| **Interceptor** | 日志记录、性能监控 | ResponseInterceptor |
| **Middleware** | 协议检测、安全防护 | Protocol Detection |

### 响应处理架构

项目采用响应拦截器 + BaseController + 异常过滤器的模式进行响应处理：

- **ResponseInterceptor**：负责日志记录和性能监控
- **BaseController**：提供统一的响应方法，如 `success`、`paginated`、`notFound` 等
- **异常过滤器**：专门处理异常，转换为统一的错误响应格式
- **响应构建器**：支持链式调用，用于特殊场景
- **协议分离**：HTTP 和 gRPC 各自保持其最适合的响应格式

详细设计请参考 [响应处理架构](./docs/response-architecture.md)。

## 🔄 HTTP + gRPC 混合模式

### 双协议支持

- **HTTP RESTful API**：适用于 Web 前端、移动应用
- **gRPC 服务**：适用于微服务间通信、高性能场景

### 协议检测机制

```typescript
// 自动检测请求协议类型
if (contextType === 'http') {
  // HTTP 请求处理
} else if (contextType === 'rpc') {
  // gRPC 请求处理
}
```

### 统一认证

- JWT Token 在 HTTP Header 或 gRPC Metadata 中传递
- 相同的认证守卫和权限检查逻辑
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

#### 2. 生成 Proto 定义（如需 gRPC）
```protobuf
// protos/your-feature.proto
service YourFeatureService {
  rpc CreateYourFeature(CreateRequest) returns (YourFeature);
  rpc GetYourFeature(GetRequest) returns (YourFeature);
}
```

#### 3. 创建 Service 层
```typescript
// src/modules/your-feature/services/your-feature.service.ts
@Injectable()
export class YourFeatureService {
  async create(data: CreateYourFeatureDto) {
    // 业务逻辑实现
  }
  
  async findById(id: string) {
    // 数据查询
  }
}
```

#### 4. 实现 Controller 层
```typescript
// HTTP Controller
@Controller('your-features')
export class YourFeatureHttpController extends BaseController {
  constructor(private readonly service: YourFeatureService) {
    super(YourFeatureHttpController.name);
  }
  
  @Post()
  async create(@Body() data: CreateYourFeatureDto): Promise<ApiResponse<YourFeature>> {
    return this.safeExecute(
      () => this.service.create(data),
      '创建成功'
    );
  }
  
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<YourFeature>> {
    try {
      const feature = await this.service.findById(id);
      if (!feature) {
        return this.notFound('资源');
      }
      return this.success(feature, '获取成功');
    } catch (error) {
      // 异常会被 HttpExceptionFilter 捕获并格式化
      throw error;
    }
  }
}

// gRPC Controller
@Controller()
export class YourFeatureGrpcController {
  constructor(private readonly service: YourFeatureService) {}
  
  @GrpcMethod('YourFeatureService', 'CreateYourFeature')
  async createYourFeature(data: CreateRequest) {
    try {
      // gRPC 控制器保持原始格式
      return this.service.create(data);
    } catch (error) {
      // 异常会被 GrpcExceptionFilter 捕获并格式化
      throw error;
    }
  }
}
```

#### 5. 配置模块
```typescript
// src/modules/your-feature/your-feature.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [YourFeatureHttpController, YourFeatureGrpcController],
  providers: [YourFeatureService],
  exports: [YourFeatureService],
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

# 手动测试
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

# 生成 Proto 类型
pnpm run proto:gen

# 启动应用
pnpm run start:dev
```

### 验证服务
```bash
# HTTP 健康检查
curl http://localhost:3000/health

# gRPC 健康检查
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
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

# Proto
pnpm run proto:gen          # 生成 Proto 类型文件

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

*最后更新: 2024-08-15*

