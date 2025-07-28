# NestJS 双协议微服务架构

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![gRPC](https://img.shields.io/badge/gRPC-Enabled-green.svg)](https://grpc.io/)

> 企业级双协议（HTTP + gRPC）微服务架构，支持用户认证、权限管理、监控系统和容器化部署。

## 📋 项目概述

这是一个现代化的 NestJS 应用，采用双协议架构设计，同时支持 HTTP RESTful API 和 gRPC 服务。项目集成了完整的用户认证、基于角色的权限管理（RBAC）、性能监控、日志系统和容器化部署方案。

### 🚀 核心特性

- **🔄 双协议支持**：HTTP RESTful API 和 gRPC 服务并存
- **🔐 完整认证系统**：JWT 认证 + 双协议支持
- **👥 权限管理**：基于角色的访问控制（RBAC）+ 缓存优化
- **📊 监控系统**：Prometheus + Grafana + 健康检查
- **📝 结构化日志**：多环境日志格式 + 请求追踪
- **🐳 容器化部署**：Docker + 多种部署模式
- **🧪 完整测试**：单元测试 + 性能测试 + 集成测试
- **🛡️ 安全防护**：安全中间件 + 速率限制 + 数据验证

### 🏗️ 技术栈

**核心框架**
- [NestJS](https://nestjs.com/) - Node.js 服务端框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [gRPC](https://grpc.io/) - 高性能 RPC 框架

**数据层**
- [PostgreSQL](https://www.postgresql.org/) - 关系型数据库
- [TypeORM](https://typeorm.io/) - ORM 框架
- [Redis](https://redis.io/) - 缓存和会话存储

**监控和部署**
- [Prometheus](https://prometheus.io/) - 监控数据收集
- [Grafana](https://grafana.com/) - 监控可视化
- [Docker](https://www.docker.com/) - 容器化平台
- [Nginx](https://nginx.org/) - 反向代理

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.x 或更高版本
- **pnpm**: 8.x 或更高版本
- **Docker**: 20.x 或更高版本
- **Docker Compose**: 2.x 或更高版本

### 一键部署

```bash
# 克隆项目
git clone <repository-url>
cd nest-main

# 基础部署（推荐）
./deploy.sh basic

# 完整监控部署
./deploy.sh monitoring
```

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发环境数据库
./deploy.sh dev

# 生成 Proto 类型文件
pnpm run proto:gen

# 启动开发服务器
pnpm run start:dev
```

## 🛠️ 开发指南

### 新功能开发流程

#### 1. 环境准备
```bash
# 确保开发环境运行
./deploy.sh dev

# 检查服务状态
curl http://localhost:3000/health
```

#### 2. 创建功能模块
```bash
# 在 src/modules/ 下创建新模块
mkdir src/modules/your-feature
cd src/modules/your-feature

# 创建基础文件结构
touch your-feature.module.ts
touch your-feature.service.ts
touch your-feature.http.controller.ts
touch your-feature.grpc.controller.ts
touch entities/your-feature.entity.ts
```

#### 3. 定义数据模型
```typescript
// entities/your-feature.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('your_features')
export class YourFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

#### 4. 更新 Proto 定义（如需 gRPC 支持）
```protobuf
// protos/your-feature.proto
syntax = "proto3";

package yourfeature;

service YourFeatureService {
  rpc CreateYourFeature(CreateYourFeatureRequest) returns (YourFeatureResponse);
  rpc GetYourFeature(GetYourFeatureRequest) returns (YourFeatureResponse);
}

message CreateYourFeatureRequest {
  string name = 1;
}

message YourFeatureResponse {
  string id = 1;
  string name = 2;
  string created_at = 3;
}
```

#### 5. 生成类型文件
```bash
pnpm run proto:gen
```

#### 6. 实现业务服务
```typescript
// your-feature.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YourFeature } from './entities/your-feature.entity';

@Injectable()
export class YourFeatureService {
  constructor(
    @InjectRepository(YourFeature)
    private readonly repository: Repository<YourFeature>,
  ) {}

  async create(data: Partial<YourFeature>): Promise<YourFeature> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<YourFeature> {
    return this.repository.findOne({ where: { id } });
  }
}
```

#### 7. 实现 HTTP 控制器
```typescript
// your-feature.http.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { YourFeatureService } from './your-feature.service';

@Controller('your-features')
export class YourFeatureHttpController {
  constructor(private readonly service: YourFeatureService) {}

  @Post()
  async create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
```

#### 8. 实现 gRPC 控制器
```typescript
// your-feature.grpc.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { YourFeatureService } from './your-feature.service';

@Controller()
export class YourFeatureGrpcController {
  constructor(private readonly service: YourFeatureService) {}

  @GrpcMethod('YourFeatureService', 'CreateYourFeature')
  async createYourFeature(data: any) {
    const result = await this.service.create(data);
    return {
      id: result.id,
      name: result.name,
      created_at: result.createdAt.toISOString(),
    };
  }
}
```

#### 9. 配置模块
```typescript
// your-feature.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YourFeature } from './entities/your-feature.entity';
import { YourFeatureService } from './your-feature.service';
import { YourFeatureHttpController } from './your-feature.http.controller';
import { YourFeatureGrpcController } from './your-feature.grpc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([YourFeature])],
  controllers: [YourFeatureHttpController, YourFeatureGrpcController],
  providers: [YourFeatureService],
  exports: [YourFeatureService],
})
export class YourFeatureModule {}
```

#### 10. 注册到主模块
```typescript
// app.module.ts
import { YourFeatureModule } from './modules/your-feature/your-feature.module';

@Module({
  imports: [
    // 其他模块...
    YourFeatureModule,
  ],
})
export class AppModule {}
```

#### 11. 创建数据库迁移
```bash
# 生成迁移文件
pnpm run migration:generate src/migrations/AddYourFeature

# 运行迁移
pnpm run migration:run
```

#### 12. 编写测试
```typescript
// your-feature.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { YourFeatureService } from './your-feature.service';

describe('YourFeatureService', () => {
  let service: YourFeatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourFeatureService],
    }).compile();

    service = module.get<YourFeatureService>(YourFeatureService);
  });

  it('应该创建功能', async () => {
    // 测试逻辑
  });
});
```

#### 13. 运行测试
```bash
# 单元测试
pnpm run test your-feature

# 集成测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

#### 14. 验证功能
```bash
# 测试 HTTP 接口
curl -X POST http://localhost:3000/your-features \
  -H "Content-Type: application/json" \
  -d '{"name": "测试功能"}'

# 测试 gRPC 接口（需要 grpcurl）
grpcurl -plaintext -d '{"name": "测试功能"}' \
  localhost:50051 yourfeature.YourFeatureService/CreateYourFeature
```

## 🧪 测试指南

### 测试类型

```bash
# 单元测试
pnpm run test                    # 运行所有单元测试
pnpm run test:watch             # 监听模式
pnpm run test your-module       # 测试特定模块

# 集成测试
pnpm run test:e2e               # 端到端测试
pnpm run test:e2e:watch         # E2E 监听模式

# 测试覆盖率
pnpm run test:cov               # 生成覆盖率报告

# 性能测试
pnpm run test:performance       # gRPC vs HTTP 性能对比

# gRPC 测试
pnpm run test:grpc              # gRPC 连接测试
pnpm run test:grpc:batch        # gRPC 批量测试
```

### 测试最佳实践

1. **单元测试**：测试业务逻辑和服务方法
2. **集成测试**：测试 API 端点和数据库交互
3. **性能测试**：验证双协议性能和并发处理
4. **安全测试**：验证认证和权限控制

### 测试环境

```bash
# 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 运行数据库迁移
NODE_ENV=test pnpm run migration:run

# 运行测试
pnpm run test
```

## 🚀 部署指南

### 部署模式选择

```bash
# 1. 基础部署（开发/测试）
./deploy.sh basic
# 包含：应用 + PostgreSQL + Redis

# 2. Nginx 反向代理部署
./deploy.sh with-nginx
# 包含：基础服务 + Nginx 负载均衡

# 3. 完整监控部署（生产推荐）
./deploy.sh monitoring
# 包含：所有服务 + Prometheus + Grafana

# 4. 开发模式
./deploy.sh dev
# 仅启动数据库，应用在本地运行
```

### 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.production

# 重要：修改以下配置
# - JWT_SECRET: JWT 签名密钥
# - POSTGRES_PASSWORD: 数据库密码
# - 其他敏感信息
```

### 部署验证

```bash
# 检查服务状态
docker-compose ps

# 验证健康检查
curl http://localhost:3000/health

# 验证 gRPC 服务
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check

# 查看监控指标
curl http://localhost:3000/metrics
```

### 生产部署检查清单

- [ ] 修改所有默认密码和密钥
- [ ] 配置 SSL/TLS 证书
- [ ] 设置防火墙规则
- [ ] 配置备份策略
- [ ] 设置监控告警
- [ ] 验证日志收集
- [ ] 测试故障恢复

## 📊 监控和运维

### 监控端点

| 端点 | 说明 | 用途 |
|------|------|------|
| `/health` | 基础健康检查 | 负载均衡器探测 |
| `/health/detailed` | 详细健康状态 | 系统诊断 |
| `/metrics` | Prometheus 指标 | 监控数据收集 |
| `/metrics/performance` | 性能指标 | 性能分析 |
| `/metrics/errors` | 错误统计 | 错误监控 |

### 日志管理

```bash
# 查看应用日志
docker-compose logs -f nest-app

# 查看错误日志
docker-compose logs nest-app | grep ERROR

# 查看特定时间段日志
docker-compose logs --since="2024-01-28T10:00:00" nest-app
```

### 性能优化

```bash
# 运行性能测试
pnpm run test:performance

# 查看性能指标
curl http://localhost:3000/metrics/performance

# 监控资源使用
docker stats
```

## 📁 项目结构

```
src/
├── common/                 # 公共模块
│   ├── decorators/        # 装饰器
│   ├── filters/           # 异常过滤器
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   ├── middleware/        # 中间件
│   ├── grpc/             # gRPC 基础设施
│   ├── logging/          # 日志系统
│   └── transformers/     # 数据转换器
├── modules/               # 业务模块
│   ├── users/            # 用户管理
│   │   ├── entities/     # 实体定义
│   │   ├── dto/          # 数据传输对象
│   │   ├── *.service.ts  # 业务服务
│   │   ├── *.http.controller.ts   # HTTP 控制器
│   │   ├── *.grpc.controller.ts   # gRPC 控制器
│   │   └── *.module.ts   # 模块定义
│   └── rbac/             # 权限管理
├── health/               # 健康检查和监控
├── scripts/              # 工具脚本
├── migrations/           # 数据库迁移
└── shared/               # 共享类型定义

protos/                   # Protocol Buffer 定义
├── users.proto
├── rbac.proto
└── health.proto

docker/                   # Docker 相关文件
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── monitoring/
```

## 🔌 API 文档

### HTTP API

基础 URL: `http://localhost:3000`

#### 认证接口
```bash
# 用户登录
POST /auth/login
Content-Type: application/json
{
  "phone": "13800138000",
  "password": "password"
}

# 用户注册
POST /auth/register
Content-Type: application/json
{
  "phone": "13800138000",
  "username": "testuser",
  "password": "password"
}
```

#### 用户管理
```bash
# 获取用户信息（需认证）
GET /users/profile
Authorization: Bearer <token>

# 更新用户信息
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json
{
  "username": "newname"
}
```

#### 权限管理
```bash
# 获取权限列表
GET /permissions?page=1&limit=10
Authorization: Bearer <token>

# 创建权限
POST /permissions
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "user:read",
  "description": "查看用户",
  "resource": "user",
  "action": "read"
}
```

### gRPC API

服务地址: `localhost:50051`

#### 用户服务
```bash
# 用户登录
grpcurl -plaintext -d '{"phone":"13800138000","password":"password"}' \
  localhost:50051 users.UserService/Login

# 用户注册
grpcurl -plaintext -d '{"phone":"13800138000","username":"test","password":"password"}' \
  localhost:50051 users.UserService/Register
```

#### 权限服务
```bash
# 获取权限列表
grpcurl -plaintext -d '{"pagination":{"page":1,"pageSize":10}}' \
  localhost:50051 rbac.PermissionService/GetPermissions

# 创建权限
grpcurl -plaintext -d '{"name":"user:read","description":"查看用户"}' \
  localhost:50051 rbac.PermissionService/CreatePermission
```

## 🔧 常用命令

### 开发命令
```bash
# 启动开发服务器
pnpm run start:dev

# 构建项目
pnpm run build

# 代码检查
pnpm run lint
pnpm run lint:fix

# 代码格式化
pnpm run format

# 生成 Proto 类型
pnpm run proto:gen
```

### 数据库命令
```bash
# 生成迁移
pnpm run migration:generate src/migrations/MigrationName

# 运行迁移
pnpm run migration:run

# 回滚迁移
pnpm run migration:revert

# 查看迁移状态
pnpm run migration:show
```

### 部署命令
```bash
# 部署选项
./deploy.sh --help

# 查看服务日志
./deploy.sh logs [服务名]

# 停止服务
./deploy.sh stop

# 清理环境
./deploy.sh clean
```

### 工具命令
```bash
# 性能测试
pnpm run test:performance

# 错误处理优化
pnpm run optimize:errors

# 阶段验证
pnpm run validate:stage5
```

## 🤝 贡献指南

### 代码规范

1. **TypeScript**: 严格模式，完整类型定义
2. **ESLint**: 遵循项目 ESLint 配置
3. **Prettier**: 统一代码格式
4. **命名约定**: 
   - 文件：kebab-case
   - 类：PascalCase
   - 方法/变量：camelCase
   - 常量：UPPER_SNAKE_CASE

### 提交规范

```bash
# 格式：type(scope): description
feat(users): 添加用户头像上传功能
fix(auth): 修复JWT过期时间计算错误
docs(readme): 更新API文档
test(rbac): 添加权限管理单元测试
```

### 开发流程

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交变更: `git commit -m 'feat: 添加新功能'`
4. 推送分支: `git push origin feature/your-feature`
5. 创建 Pull Request

## ❓ 常见问题

### Q: 如何添加新的 gRPC 服务？
A: 
1. 在 `protos/` 目录添加 `.proto` 文件
2. 运行 `pnpm run proto:gen` 生成类型
3. 创建对应的 gRPC 控制器
4. 在模块中注册控制器

### Q: 如何配置双协议认证？
A: 使用 `@Public()` 装饰器跳过认证，或者确保请求包含有效的 JWT token（HTTP Header 或 gRPC Metadata）。

### Q: 如何查看性能指标？
A: 访问 `/metrics` 端点查看 Prometheus 格式指标，或启用监控模式查看 Grafana 仪表板。

### Q: 如何进行数据库迁移？
A: 
1. 修改实体定义
2. 运行 `pnpm run migration:generate`
3. 检查生成的迁移文件
4. 运行 `pnpm run migration:run`

### Q: 如何部署到生产环境？
A: 
1. 配置环境变量
2. 使用 `./deploy.sh monitoring` 启动完整监控
3. 配置 SSL 证书和域名
4. 设置监控告警

## 📞 技术支持

- **文档**: [完整部署指南](./DEPLOYMENT.md)
- **问题反馈**: [GitHub Issues]
- **讨论**: [GitHub Discussions]

---

## 📄 许可证

[MIT License](LICENSE)

---

*最后更新: 2024-01-28*

