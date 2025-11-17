# 开发文档模板 - 后端服务开发版（类型驱动开发）

> **AI 协作提示**: 此模板用于生成后端服务开发文档。请根据实际需求替换所有 `[AI_FILL]` 标记的内容。此模板专为 AI 辅助开发设计，采用类型驱动的 6 步模块化开发模式。
>
> **类型驱动原则**: 基于 Protobuf 自动生成的类型定义，确保前后端接口一致性和类型安全。
>
> **按开发计划顺序，每个步骤完成后等待用户确认再继续下一步**
>
> **生成说明**: 输出最终文档时，仅保留 `[结果]` 部分内容，隐藏所有 `[指引]` 标记的内容。
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

**[指引]**: 请根据业务需求进行详细的需求分析和架构设计：

- 业务功能需求梳理和分解
- API 接口设计和规划
- 数据模型关系设计
- 安全性和性能需求分析

**[结果]**: TODO: [AI_FILL] 需求设计和架构规划结果

**架构决策**:

- 采用 BaseController + Service + Repository 三层架构
- 基于 Protobuf 类型定义确保接口一致性
- 统一的错误处理和响应格式
- 支持 RBAC 权限控制

**实施清单**:

- [ ] 1. 业务需求文档化
- [ ] 2. API 接口设计
- [ ] 3. 数据模型关系图
- [ ] 4. 安全性和权限设计

**技术框架**:

- **架构**: NestJS 模块化架构
- **类型定义**: Protocol Buffers
- **权限控制**: RBAC (基于角色的访问控制)
- **API 文档**: Swagger + 自动化文档

**验收标准**:

- 需求文档完整且清晰
- API 设计符合 RESTful 规范
- 数据模型符合第三范式
- 安全设计覆盖认证和授权

### 步骤 2：Prisma 数据模型设计

**[指引]**: 请根据需求分析设计 Prisma 数据模型：

- 核心业务实体模型设计
- 数据关系和约束定义
- 索引和性能优化设计
- 审计字段和软删除策略

**[结果]**: TODO: [AI_FILL] Prisma 数据模型设计结果

**架构决策**:

- 统一的基类模型（BaseModel）包含审计字段
- 严格的外键约束保证数据一致性
- 合理的索引设计优化查询性能
- 支持软删除保持数据完整性

**实施清单**:

- [ ] 1. 核心实体模型定义
- [ ] 2. 数据关系映射
- [ ] 3. 索引和约束设计
- [ ] 4. 数据库迁移脚本

**技术框架**:

- **ORM**: Prisma 6.13+
- **数据库**: PostgreSQL 16+
- **迁移**: Prisma Migrate
- **类型生成**: prisma generate

**验收标准**:

- 数据模型设计规范且可扩展
- 支持所有业务查询需求
- 迁移脚本可重复执行
- 索引设计合理优化查询性能

### 步骤 3：Proto 类型定义

**[指引]**: 请根据数据模型和 API 设计定义 Protocol Buffers 类型：

- 请求和响应消息类型定义
- 枚举类型和自定义类型
- 嵌套消息和重复字段设计
- 类型向后兼容性考虑

**[结果]**: TODO: [AI_FILL] Proto 类型定义结果

**架构决策**:

- 前后端共享的 Protobuf 类型定义
- 统一的编码规范和命名约定
- 支持类型演进的向后兼容
- 自动生成 TypeScript 类型文件

**实施清单**:

- [ ] 1. 核心消息类型定义
- [ ] 2. 枚举和常量定义
- [ ] 3. 类型验证规则
- [ ] 4. 前端类型生成

**技术框架**:

- **类型定义**: Protocol Buffers 3
- **代码生成**: protoc + TypeScript 插件
- **类型共享**: 前端共享包
- **文档**: 自动生成的 API 文档

**验收标准**:

- Proto 定义完整覆盖所有 API
- 类型定义符合编码规范
- 前后端类型一致性
- 支持未来功能扩展

### 步骤 4：Service 层实现

**[指引]**: 请实现业务逻辑层，专注于核心业务处理：

- 数据访问层封装（Repository 模式）
- 业务逻辑实现和数据验证
- 事务管理和并发控制
- 缓存策略和性能优化

**[结果]**: TODO: [AI_FILL] Service 层实现结果

**架构决策**:

- Service 层封装所有业务逻辑
- 使用 Repository 模式隔离数据访问
- 统一的事务管理和异常处理
- 基于 Redis 的多层缓存策略

**实施清单**:

- [ ] 1. Repository 数据访问层
- [ ] 2. Service 业务逻辑层
- [ ] 3. 数据验证和约束
- [ ] 4. 缓存和性能优化

**技术框架**:

- **数据访问**: Prisma Client
- **业务逻辑**: NestJS Service
- **缓存**: Redis + cache-manager
- **验证**: class-validator + class-transformer

**验收标准**:

- 所有业务逻辑正确实现
- 数据访问层可测试且可复用
- 事务保证数据一致性
- 缓存策略有效提升性能

**代码示例**:

```typescript
// Service 层示例
@Injectable()
export class ExampleService {
  constructor(private readonly prisma: PrismaService, private readonly cacheManager: Cache) {}

  async createExample(data: CreateExampleDto): Promise<Example> {
    // 数据验证
    await this.validateCreateData(data)

    // 缓存清理
    await this.cacheManager.del('examples:list')

    // 业务逻辑处理
    return this.prisma.$transaction(async (tx) => {
      // TODO: [AI_FILL] 具体业务逻辑实现
    })
  }
}
```

### 步骤 5：Controller 层实现

**[指引]**: 请实现 Controller 层，确保正确继承 BaseController：

- 正确继承 BaseController 并调用 super()
- 使用 BaseController 提供的响应和断言方法
- 参数验证和数据处理
- 统一的错误处理和日志记录

**[结果]**: TODO: [AI_FILL] Controller 层实现结果

**架构决策**:

- 所有 Controller 必须继承 BaseController
- 使用统一的响应格式和错误处理
- 参数验证通过装饰器和管道实现
- 业务日志和安全审计

**实施清单**:

- [ ] 1. 继承 BaseController
- [ ] 2. 实现 CRUD 操作方法
- [ ] 3. 参数验证和转换
- [ ] 4. 错误处理和日志

**技术框架**:

- **控制器**: NestJS Controller + BaseController
- **验证**: class-validator + ValidationPipe
- **日志**: 统一的业务日志记录
- **异常处理**: BaseController 内置方法

**验收标准**:

- 正确继承 BaseController
- 所有 API 端点功能正常
- 参数验证覆盖所有场景
- 错误处理返回标准化信息

**代码示例**:

```typescript
@Controller('examples')
export class ExampleController extends BaseController {
  constructor(private readonly exampleService: ExampleService) {
    super() // 必须调用 super()
  }

  @Post()
  async createExample(@Body() data: CreateExampleDto): Promise<IExample> {
    // 参数验证
    this.assertNotEmpty(data.name, '名称不能为空')

    try {
      // 业务逻辑处理
      const result = await this.exampleService.createExample(data)

      // 成功响应
      return this.created(result, '创建成功')
    } catch (error) {
      // 统一错误处理
      throw this.handleError(error)
    }
  }

  @Get(':id')
  async getExample(@Param('id') id: string): Promise<IExample> {
    // 参数验证
    this.assertNotEmpty(id, 'ID 不能为空')

    try {
      // 数据获取
      const result = await this.exampleService.findById(id)

      // 数据存在性检查
      this.assertDataExists(result, '示例不存在')

      // 成功响应
      return this.success(result)
    } catch (error) {
      throw this.handleError(error)
    }
  }
}
```

### 步骤 6：模块配置

**[指引]**: 请完成模块的最终配置和集成：

- NestJS 模块声明和依赖注入配置
- 数据库连接和迁移执行
- 权限控制和安全配置
- API 路由和中间件配置

**[结果]**: TODO: [AI_FILL] 模块配置结果

**架构决策**:

- 模块化设计支持独立部署和测试
- 统一的依赖注入和配置管理
- 基于装饰器的权限控制
- 自动化 API 文档生成

**实施清单**:

- [ ] 1. NestJS 模块配置
- [ ] 2. 数据库迁移执行
- [ ] 3. 权限和安全配置
- [ ] 4. API 文档和测试

**技术框架**:

- **模块化**: NestJS Module
- **依赖注入**: NestJS DI Container
- **权限控制**: RBAC + 装饰器
- **文档**: Swagger 自动生成

**验收标准**:

- 模块配置完整且正确
- 所有依赖注入正常工作
- 权限控制功能正常
- API 文档自动生成

**模块配置示例**:

```typescript
@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 300 // 5分钟缓存
    })
  ],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService]
})
export class ExampleModule {}
```

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

### 包管理规范

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 开发模式运行
pnpm dev

# 构建所有项目
pnpm build

# 数据库操作
pnpm prisma:generate    # 生成 Prisma 客户端
pnpm prisma:migrate    # 执行数据库迁移
pnpm prisma:studio     # 数据库 GUI 工具
```

### 类型驱动开发

#### Protobuf 类型定义

```protobuf
// 示例 Proto 定义
message CreateExampleRequest {
  string name = 1;
  string description = 2;
  repeated string tags = 3;
}

message ExampleResponse {
  string id = 1;
  string name = 2;
  string description = 3;
  repeated string tags = 4;
  string createdAt = 5;
  string updatedAt = 6;
}
```

#### 类型生成命令

```bash
# 生成前后端共享类型
pnpm generate:types

# 前端类型导入
import { CreateExampleRequest, ExampleResponse } from '@/shared/types/example';
```

### 架构核心组件

#### BaseController 规范

- 所有 Controller 必须继承 BaseController
- 使用统一的响应方法：`success()`, `created()`, `paginated()`
- 使用断言方法：`assertNotEmpty()`, `assertDataExists()`
- 异常处理：`throwValidationError()`, `throwDataNotFound()`

#### Prisma 数据访问

```typescript
// 基类服务示例
@Injectable()
export class BaseService<T extends BaseModel> {
  constructor(protected readonly prisma: PrismaService) {}

  async findMany(params: FindManyParams<T>): Promise<T[]> {
    // TODO: [AI_FILL] 通用查询逻辑
  }

  async findUnique(id: string): Promise<T | null> {
    // TODO: [AI_FILL] 唯一查询逻辑
  }
}
```

### API 设计规范

#### RESTful 端点设计

```
GET    /api/examples          # 获取示例列表（分页）
GET    /api/examples/:id      # 获取单个示例
POST   /api/examples          # 创建示例
PUT    /api/examples/:id      # 更新示例
DELETE /api/examples/:id      # 删除示例
```

#### 统一响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": ExampleResponse,
  "message": "操作成功",
  "timestamp": "2023-12-01T00:00:00Z"
}

// 分页响应
{
  "success": true,
  "data": ExampleResponse[],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "message": "获取成功",
  "timestamp": "2023-12-01T00:00:00Z"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "name",
        "message": "名称不能为空"
      }
    ]
  },
  "timestamp": "2023-12-01T00:00:00Z"
}
```

### 数据库设计规范

#### Prisma Schema 设计

```prisma
// 基类模型
model BaseModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([createdAt])
  @@index([updatedAt])
}

// 示例实体
model Example extends BaseModel {
  name        String   @unique
  description String?
  tags        String[]

  @@map("examples")
}
```

#### 数据迁移管理

```bash
# 创建迁移
pnpm prisma migrate dev --name init

# 重置数据库
pnpm prisma migrate reset

# 查看迁移状态
pnpm prisma migrate status

# 生成 Prisma 客户端
pnpm prisma generate
```

### 开发规范要求

#### 类型安全要求

- 严格禁止使用 `any` 类型
- 所有 API 请求/响应必须有类型定义
- 优先使用 `interface` 而非 `type`
- 泛型变量语义化：T(Type), K(Key), V(Value), E(Element)

#### 错误处理规范

- 使用 BaseController 内置的断言方法
- 统一异常处理通过 `handleError()` 方法
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

#### 代码质量要求

- Oxlint 代码格式化和检查
- TypeScript 严格模式开启
- 单元测试覆盖率 ≥ 80%
- 提交前自动检查和格式化

### 数据库操作命令

```bash
# 数据库相关命令
pnpm prisma:generate    # 生成客户端
pnpm prisma:migrate     # 执行迁移
pnpm prisma:reset       # 重置数据库
pnpm prisma:studio      # 数据库 GUI
pnpm prisma:seed        # 种子数据

# 开发命令
pnpm dev                # 开发模式
pnpm build              # 构建项目
pnpm test               # 运行测试
pnpm lint               # 代码检查
```

### 手动测试 HTTP API

#### API 测试示例

```bash
# 创建示例
curl -X POST http://localhost:3030/api/examples \
  -H "Content-Type: application/json" \
  -d '{
    "name": "示例名称",
    "description": "示例描述",
    "tags": ["标签1", "标签2"]
  }'

# 获取示例列表
curl -X GET http://localhost:3030/api/examples

# 获取单个示例
curl -X GET http://localhost:3030/api/examples/{id}

# 更新示例
curl -X PUT http://localhost:3030/api/examples/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的名称",
    "description": "更新后的描述"
  }'

# 删除示例
curl -X DELETE http://localhost:3030/api/examples/{id}
```

### 常用开发命令

```bash
# 启动开发服务
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 数据库操作
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio

# 清理和重建
pnpm clean
pnpm rebuild
```
