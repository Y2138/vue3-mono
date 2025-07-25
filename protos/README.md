# Protobuf 契约定义

本目录包含了项目的所有 Protocol Buffers (protobuf) 契约定义文件，用于 gRPC 服务的接口定义和前后端数据类型统一。

## 📁 文件结构

```
protos/
├── common.proto      # 通用类型定义（分页、时间戳、错误等）
├── users.proto       # 用户服务契约定义
├── rbac.proto        # 权限管理服务契约定义
└── README.md         # 本说明文档
```

## 📋 契约概览

### common.proto - 通用类型
- `Timestamp` - 时间戳类型
- `PaginationRequest/Response` - 分页请求/响应
- `ResponseStatus` - 通用响应状态
- `ErrorDetail` - 错误详情

### users.proto - 用户服务
**核心消息类型：**
- `User` - 用户信息
- `LoginRequest/AuthResponse` - 登录认证
- `CreateUserRequest/UpdateUserRequest` - 用户管理
- `GetUsersRequest/GetUsersResponse` - 用户列表

**服务定义：**
- `UserService` - 用户相关的所有 gRPC 方法

### rbac.proto - 权限管理服务
**核心消息类型：**
- `Permission` - 权限信息
- `Role` - 角色信息
- `CreateRoleRequest/UpdateRoleRequest` - 角色管理
- `CheckPermissionRequest/Response` - 权限检查

**服务定义：**
- `PermissionService` - 权限管理相关方法
- `RoleService` - 角色管理相关方法

## 🔧 使用方式

### 后端 (NestJS)
1. 安装依赖：
```bash
npm install @nestjs/microservices @grpc/grpc-js @grpc/proto-loader ts-proto
```

2. 编译 proto 文件：
```bash
npm run proto:gen
```

3. 在 Controller 中使用：
```typescript
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LoginRequest, AuthResponse } from '../shared/users';

@Controller()
export class AuthController {
  @GrpcMethod('UserService', 'Login')
  async login(data: LoginRequest): Promise<AuthResponse> {
    // 实现登录逻辑
  }
}
```

### 前端 (Vue3)
1. 安装依赖：
```bash
npm install @improbable-eng/grpc-web google-protobuf
```

2. 配置 Vite 自动编译：
```typescript
// vite.config.ts
import protoPlugin from 'vite-plugin-proto';

export default defineConfig({
  plugins: [
    vue(),
    protoPlugin({
      input: ['../../protos/*.proto'],
      output: 'src/shared'
    })
  ]
});
```

3. 在组件中使用：
```typescript
import { UserServiceClient } from '@/shared/users';
import type { LoginRequest } from '@/shared/users';

const client = new UserServiceClient(grpcEndpoint);
const response = await client.login(loginRequest);
```

## 📝 开发规范

### 命名约定
- **Package 名称**：小写，简洁描述（如 `users`, `rbac`）
- **Message 名称**：大驼峰命名（如 `LoginRequest`, `UserInfo`）
- **字段名称**：下划线命名（如 `user_id`, `created_at`）
- **Service 名称**：大驼峰 + Service 后缀（如 `UserService`）
- **RPC 方法**：大驼峰命名（如 `GetUser`, `CreateRole`）

### 版本控制
- 字段编号一旦分配，不可更改
- 新增字段使用新的编号
- 删除字段时保留字段编号注释
- 使用 `optional` 关键字标记可选字段

### 数据类型选择
- **ID 字段**：使用 `string` 类型（支持 UUID）
- **时间字段**：使用 `common.Timestamp` 类型
- **布尔字段**：使用 `bool` 类型
- **枚举字段**：暂时使用 `string`，后续可考虑 `enum`

## 🚀 编译脚本

项目中已配置自动编译脚本：

```bash
# 编译所有 proto 文件
npm run proto:gen

# 监听 proto 文件变化并自动编译
npm run proto:watch

# 开发模式（同时监听和启动服务）
npm run dev:with-proto
```

## 🔄 迁移进度

- [x] `common.proto` - 通用类型定义
- [x] `users.proto` - 用户服务契约
- [x] `rbac.proto` - 权限服务契约
- [ ] 后端 gRPC Controller 实现
- [ ] 前端 gRPC Client 实现
- [ ] 测试和验证

## 📚 参考资料

- [Protocol Buffers 官方文档](https://developers.google.com/protocol-buffers)
- [gRPC 官方文档](https://grpc.io/docs/)
- [NestJS Microservices 文档](https://docs.nestjs.com/microservices/basics)
- [gRPC-Web 文档](https://github.com/grpc/grpc-web) 