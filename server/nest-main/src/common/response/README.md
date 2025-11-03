# 响应处理模块

## 概述

响应处理模块提供了一套统一的响应格式化工具，包括：

- **HttpExceptionFilter**: 全局异常过滤器，统一处理所有异常并转换为标准响应格式
- **自定义异常类**: 业务异常、验证异常、数据不存在异常等，提供语义化的错误处理
- **BaseController**: 控制器基类，提供统一的成功响应方法和异常抛出辅助方法
- **ResponseInterceptor**: 负责日志记录和性能监控
- **响应类型**: 统一的响应类型定义

## 模块结构

```
src/common/
├── response/
│   ├── types.ts                # 响应类型定义
│   ├── response-interceptor.ts # 响应拦截器（日志和监控）
│   ├── response-builder.ts     # 响应构建器
│   ├── index.ts                # 导出入口
│   └── README.md               # 使用文档
├── controllers/
│   └── base.controller.ts      # 控制器基类
└── filters/
    ├── http-exception.filter.ts # HTTP 异常过滤器
    └── grpc-exception.filter.ts # gRPC 异常过滤器
```

## 响应类型

所有 HTTP 响应都遵循统一的格式：

```typescript
// 基础响应类型
interface ApiResponse<T = any> {
  success: boolean // 是否成功
  code: number // 状态码
  message: string // 消息
  data?: T // 数据
  error?: ErrorInfo // 错误信息
}

// 分页响应类型
interface ApiPaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number // 当前页码
    pageSize: number // 每页大小
    total: number // 总记录数
    totalPages: number // 总页数
    hasNext: boolean // 是否有下一页
    hasPrev: boolean // 是否有上一页
  }
}

// 错误响应类型
interface ApiErrorResponse extends ApiResponse<null> {
  success: false
  error: ErrorInfo
}
```

## BaseController 使用指南

### 继承 BaseController

```typescript
import { Controller } from '@nestjs/common'
import { BaseController } from '../common/controllers/base.controller'

@Controller('api/users')
export class UserController extends BaseController {
  constructor() {
    super('UserController') // 传入控制器名称用于日志记录
  }
}
```

### 成功响应方法

```typescript
// 基本成功响应
return this.success(data, '操作成功')

// 创建成功响应
return this.created(data, '创建成功')

// 无内容响应
return this.noContent('删除成功')
```

### 分页响应方法

```typescript
return this.paginated(
  items,
  {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  },
  '查询成功'
)
```

### 错误处理方法 - 新的异常抛出方式

```typescript
// 数据不存在异常
this.throwDataNotFound('用户', userId)

// 业务规则异常
this.throwBusinessError('余额不足，无法完成支付')

// 冲突异常
this.throwConflictError('用户名已存在')

// 验证异常
this.throwValidationError('请求参数验证失败', { field: 'email', message: '邮箱格式不正确' })

// 断言方法
this.assert(user.isActive, '用户已被禁用')
this.assertNotEmpty(data.name, '用户名')
this.assertDataExists(user, '用户', userId)

// 原生异常（会被自动转换为服务器错误）
throw new Error('数据库连接失败')
```

### 新的控制器编写方式

```typescript
@Controller('api/users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super(UserController.name)
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<ApiResponse<User>> {
    // 参数验证 - 验证失败会自动抛出 ValidationException
    Validator.uuid(id, '用户ID')

    // 查询数据
    const user = await this.userService.findById(id)

    // 断言数据存在 - 不存在会自动抛出 DataNotFoundException
    this.assertDataExists(user, '用户', id)

    return this.success(user, '获取用户成功')
  }

  @Post()
  async createUser(@Body() data: CreateUserDto): Promise<ApiResponse<User>> {
    // 参数验证
    Validator.email(data.email, '邮箱')
    Validator.stringLength(data.name, 1, 50, '用户名')

    // 业务验证
    const existingUser = await this.userService.findByEmail(data.email)
    if (existingUser) {
      this.throwConflictError('邮箱已被注册')
    }

    // 创建用户 - 异常会被 HttpExceptionFilter 自动处理
    const user = await this.userService.create(data)
    return this.success(user, '创建用户成功')
  }
}
```

## 响应拦截器和异常过滤器使用指南

### 注册拦截器和过滤器

```typescript
import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core'
import { ResponseInterceptor } from './common/response'
import { HttpExceptionFilter, GrpcExceptionFilter } from './common/filters'

@Module({
  providers: [
    // 拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor
    },
    // 异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter
    }
  ]
})
export class AppModule {}
```

### 拦截器功能

- 记录请求开始和结束时间
- 计算请求执行时间
- 提供请求处理的性能指标

### 异常过滤器功能

- **HttpExceptionFilter**: 捕获 HTTP 请求中的异常，转换为统一的错误响应格式
- **GrpcExceptionFilter**: 捕获 gRPC 请求中的异常，转换为 gRPC 错误格式
- 详细记录错误日志

## 响应构建器使用指南

### 基本用法

```typescript
import { ResponseBuilder } from './common/response'

// 成功响应
const successResponse = ResponseBuilder.success(data).message('操作成功').build()

// 分页响应
const paginatedResponse = ResponseBuilder.paginated(items, pagination).message('查询成功').build()

// 错误响应
const errorResponse = ResponseBuilder.error('操作失败').code(400).build()
```

### 特殊错误响应

```typescript
// 资源未找到
const notFoundResponse = ResponseBuilder.notFound('用户').build()

// 验证错误
const validationResponse = ResponseBuilder.validationError('请求参数验证失败', errors).build()

// 业务错误
const businessResponse = ResponseBuilder.businessError('余额不足').build()

// 服务器错误
const serverErrorResponse = ResponseBuilder.serverError('服务器内部错误', error).build()
```

## 最佳实践

### 新的错误处理最佳实践

1. **直接抛出异常**：不再使用 `try-catch` 和 `return this.error()`，直接抛出异常让 `HttpExceptionFilter` 处理
2. **使用语义化异常**：根据错误类型使用对应的异常类（`ValidationException`、`DataNotFoundException` 等）
3. **参数验证优先**：在方法开始就进行参数验证，验证失败立即抛出异常
4. **使用断言方法**：使用 `this.assertDataExists()` 等断言方法简化代码
5. **业务逻辑清晰**：移除错误处理代码后，业务逻辑更加清晰易读
6. **统一响应格式**：所有异常都会被转换为统一的 API 响应格式
7. **HTTP 状态码策略**：
   - `401/403/404` - 用于身份认证、权限和路由问题
   - `200` - 用于业务错误，通过响应体的 `success` 和 `code` 字段判断

### 迁移指南

**旧的错误处理方式：**

```typescript
// ❌ 旧方式 - 不推荐
try {
  const user = await this.userService.findById(id)
  if (!user) {
    return this.notFound('用户')
  }
  return this.success(user, '获取成功')
} catch (error) {
  return this.handleError(error, '获取失败')
}
```

**新的错误处理方式：**

```typescript
// ✅ 新方式 - 推荐
const user = await this.userService.findById(id)
this.assertDataExists(user, '用户', id)
return this.success(user, '获取成功')
```
