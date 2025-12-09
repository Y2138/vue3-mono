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

> controller 的路由定义尽量使用 query 参数，而不是 path 参数

```typescript
// src/modules/your-feature/your-feature.controller.ts
import { Controller, Post, Get, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiConsumes, ApiProduces, ApiParam, ApiResponse } from '@nestjs/swagger'
import { BaseController } from '../../common/controllers/base.controller'
import { CreateYourFeatureRequest } from '../../shared/your-feature'

@Controller('api/your-feature')
@ApiTags('功能管理')
export class YourFeatureController extends BaseController {
  constructor(private readonly yourFeatureService: YourFeatureService) {
    super(YourFeatureController.name)
  }

  @Post('create')
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

  @Get('detail')
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
  async getFeature(@Query('id') id: string) {
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

  @Delete('delete')
  @ApiOperation({ summary: '删除功能', description: '根据ID删除功能' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    type: Object
  })
  @ApiResponse({
    status: 404,
    description: '功能不存在'
  })
  async deleteFeature(@Query('id') id: string) {
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
