# 响应处理模块

## 概述

响应处理模块提供了一套统一的响应格式化工具，包括：

- **BaseController**: 控制器基类，提供统一的响应方法
- **ResponseInterceptor**: 负责日志记录和性能监控
- **响应构建器**: 支持链式调用的响应构建工具
- **响应类型**: 统一的响应类型定义
- **异常过滤器**: 处理异常，转换为统一的错误响应格式

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
  success: boolean;   // 是否成功
  code: number;       // 状态码
  message: string;    // 消息
  data?: T;           // 数据
  error?: ErrorInfo;  // 错误信息
}

// 分页响应类型
interface ApiPaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;      // 当前页码
    pageSize: number;  // 每页大小
    total: number;     // 总记录数
    totalPages: number; // 总页数
    hasNext: boolean;  // 是否有下一页
    hasPrev: boolean;  // 是否有上一页
  };
}

// 错误响应类型
interface ApiErrorResponse extends ApiResponse<null> {
  success: false;
  error: ErrorInfo;
}
```

## BaseController 使用指南

### 继承 BaseController

```typescript
import { Controller } from '@nestjs/common';
import { BaseController } from '../common/controllers/base.controller';

@Controller('api/users')
export class UserController extends BaseController {
  constructor() {
    super('UserController'); // 传入控制器名称用于日志记录
  }
}
```

### 成功响应方法

```typescript
// 基本成功响应
return this.success(data, '操作成功');

// 创建成功响应
return this.created(data, '创建成功');

// 无内容响应
return this.noContent('删除成功');
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
);
```

### 错误响应方法

```typescript
// 用户友好错误（可直接展示给用户）
return this.userError('用户名或密码错误');

// 业务错误
return this.businessError('余额不足');

// 资源未找到
return this.notFound('用户');

// 权限不足
return this.forbidden('没有操作权限');

// 验证错误
return this.validationError('请求参数验证失败', errors);

// 服务器错误
return this.serverError('服务器内部错误', error);
```

### 安全执行方法

```typescript
// 安全执行异步操作
return this.safeExecute(
  async () => {
    const result = await this.service.create(data);
    return result;
  },
  '创建成功'
);

// 安全执行分页查询
return this.safePaginatedExecute(
  async () => {
    const { data, total } = await this.service.findAll(query);
    return { data, total };
  },
  page,
  pageSize,
  '查询成功'
);
```

## 响应拦截器和异常过滤器使用指南

### 注册拦截器和过滤器

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ResponseInterceptor } from './common/response';
import { HttpExceptionFilter, GrpcExceptionFilter } from './common/filters';

@Module({
  providers: [
    // 拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // 异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
  ],
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
import { ResponseBuilder } from './common/response';

// 成功响应
const successResponse = ResponseBuilder.success(data)
  .message('操作成功')
  .build();

// 分页响应
const paginatedResponse = ResponseBuilder.paginated(items, pagination)
  .message('查询成功')
  .build();

// 错误响应
const errorResponse = ResponseBuilder.error('操作失败')
  .code(400)
  .build();
```

### 特殊错误响应

```typescript
// 资源未找到
const notFoundResponse = ResponseBuilder.notFound('用户').build();

// 验证错误
const validationResponse = ResponseBuilder.validationError('请求参数验证失败', errors).build();

// 业务错误
const businessResponse = ResponseBuilder.businessError('余额不足').build();

// 服务器错误
const serverErrorResponse = ResponseBuilder.serverError('服务器内部错误', error).build();
```

## 最佳实践

1. **优先继承 BaseController**：大多数控制器应继承 BaseController
2. **特殊场景使用响应构建器**：对于不适合继承 BaseController 的特殊场景
3. **使用安全执行方法**：对于可能抛出异常的操作
4. **明确返回类型**：使用 TypeScript 类型标注明确返回类型
5. **使用适当的错误响应方法**：根据错误类型选择合适的错误响应方法
6. **保持消息一致性**：使用一致的消息格式，如中文提示信息
7. **协议分离**：gRPC 和 HTTP 各自保持其最适合的响应格式