# 响应处理架构

## 概述

本项目采用响应拦截器 + BaseController + 异常过滤器的模式进行响应处理，提供统一的响应格式和类型安全。这种架构设计明确划分了各组件职责：响应拦截器负责日志和监控，BaseController 负责成功响应格式化，异常过滤器负责异常处理。

## 架构设计

### 1. 响应拦截器

响应拦截器仅负责日志记录和性能监控，不处理响应格式化或异常处理：

- 记录请求开始和结束时间
- 计算请求执行时间
- 提供请求处理的性能指标

### 2. BaseController 基类

BaseController 提供了一系列类型安全的响应方法，包括：

- 成功响应：`success`, `created`, `noContent`
- 分页响应：`paginated`
- 错误响应：`userError`, `businessError`, `notFound`, `forbidden`, `validationError`, `serverError`
- 安全执行：`safeExecute`, `safePaginatedExecute`

### 3. 统一响应格式

所有 HTTP 响应都遵循统一的格式：

```typescript
interface ApiResponse<T> {
  success: boolean // 是否成功
  code: number // 状态码
  message: string // 消息
  data?: T // 数据
  error?: ErrorInfo // 错误信息
}

interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

### 4. 统一响应设计

- **HTTP 响应**：使用统一的 REST API 响应格式（`ApiResponse`）
- **标准化**：所有 API 端点都遵循相同的响应结构
- **类型安全**：通过 TypeScript 类型系统确保响应格式一致性

## 使用方式

### 1. 控制器继承 BaseController

```typescript
@Controller('api/roles')
export class RoleController extends BaseController {
  constructor(private readonly roleService: RoleService) {
    super('RoleController')
  }

  @Get()
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const roles = await this.roleService.findAll()
    return this.success(roles, '获取角色列表成功')
  }

  @Get(':id')
  async getRole(@Param('id') id: string): Promise<ApiResponse<Role>> {
    const role = await this.roleService.findById(id)
    if (!role) {
      return this.notFound('角色')
    }
    return this.success(role, '获取角色信息成功')
  }
}
```

### 2. 使用响应构建器

对于不继承 BaseController 的场景，可以使用响应构建器：

```typescript
import { ResponseBuilder } from './common/response'

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    try {
      const user = await this.userService.findById(id)
      if (!user) {
        return ResponseBuilder.notFound('用户').build()
      }
      return ResponseBuilder.success(user).message('获取用户信息成功').build()
    } catch (error) {
      return ResponseBuilder.serverError('获取用户信息失败', error).build()
    }
  }
}
```

### 3. 注册拦截器和过滤器

在模块中注册响应拦截器和异常过滤器：

```typescript
import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core'
import { ResponseInterceptor } from './common/response'
import { HttpExceptionFilter } from './common/filters'

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
    }
  ]
})
export class AppModule {}
```

### 4. 安全执行方法

使用安全执行方法简化错误处理：

```typescript
@Post()
async createRole(@Body() createDto: CreateRoleDto): Promise<ApiResponse<Role>> {
  return this.safeExecute(
    () => this.roleService.create(createDto),
    '创建角色成功'
  );
}
```

### 3. 异常过滤器

项目使用专门的异常过滤器处理所有异常：

- **HttpExceptionFilter**：处理 HTTP 请求中的异常，转换为统一的 `ApiErrorResponse` 格式

这种设计确保了：

- 异常处理职责集中在过滤器中
- 统一的错误响应格式
- 详细的错误日志记录

## 错误处理

异常过滤器会捕获并格式化所有未处理的异常，转换为统一的错误响应格式：

```typescript
{
  "success": false,
  "code": 500,
  "message": "服务器内部错误",
  "data": null,
  "error": {
    "type": "INTERNAL_ERROR",
    "details": { ... },
    "stack": "..." // 仅在非生产环境
  }
}
```

HTTP 响应始终返回状态码 200，错误信息在响应体中，这样可以：

- 确保前端始终能解析到响应体
- 提供更详细的错误信息
- 统一错误处理流程

## 最佳实践

1. **优先继承 BaseController**：大多数控制器应继承 BaseController，利用其提供的响应方法
2. **特殊场景使用响应构建器**：对于不适合继承 BaseController 的特殊场景，使用响应构建器
3. **使用安全执行方法**：对于可能抛出异常的操作，使用 `safeExecute` 或 `safePaginatedExecute`
4. **明确返回类型**：使用 TypeScript 类型标注明确返回类型，如 `Promise<ApiResponse<User>>`
5. **使用适当的错误响应方法**：根据错误类型选择合适的错误响应方法，如 `notFound`、`forbidden` 等
6. **保持消息一致性**：使用一致的消息格式，如中文提示信息
7. **链式调用**：利用响应构建器的链式调用特性，使代码更简洁可读
8. **统一标准**：所有 HTTP API 都遵循相同的响应格式标准

## 性能考量

- 职责明确分离，减少了处理开销，提升了性能
- 拦截器只负责日志和监控，不处理响应格式化
- 异常处理集中在过滤器中，避免了重复处理
- 统一的响应处理流程，减少了重复代码
- 使用 TypeScript 类型系统提供编译时类型检查，减少运行时错误

## 组件职责总结

| 组件                    | 职责                          |
| ----------------------- | ----------------------------- |
| **ResponseInterceptor** | 日志记录、性能监控            |
| **BaseController**      | 成功响应格式化、业务错误处理  |
| **HttpExceptionFilter** | HTTP 异常处理、错误响应格式化 |
