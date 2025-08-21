# HTTP 请求方法标准化重构

## 重构概述

本次重构的目标是将项目中的 HTTP 请求方法标准化为只使用 GET 和 POST 两种方法：
- GET：用于获取数据的操作
- POST：用于变更数据的操作（创建、更新、删除等）

## 重构内容

### 1. 用户控制器 (user.http.controller.ts)

- 将 `@Put('update/:phone')` 修改为 `@Post('update/:phone')`
- 将 `@Delete('delete/:phone')` 修改为 `@Post('delete/:phone')`
- 移除了不必要的 `Put` 和 `Delete` 导入

### 2. 角色控制器 (role.http.controller.ts)

- 将 `@Put(':id')` 修改为 `@Post('update/:id')`
- 将 `@Delete(':id')` 修改为 `@Post('delete/:id')`
- 将 `@Delete(':id/permissions')` 修改为 `@Post(':id/permissions/remove')`
- 将 `@Put(':id/permissions')` 修改为 `@Post(':id/permissions/set')`
- 移除了不必要的 `Put` 和 `Delete` 导入

### 3. 权限控制器 (permission.http.controller.ts)

- 将 `@Put(':id')` 修改为 `@Post('update/:id')`
- 将 `@Delete(':id')` 修改为 `@Post('delete/:id')`
- 移除了不必要的 `Put` 和 `Delete` 导入

### 4. 示例控制器 (example.controller.ts)

- 将 `@Put(':id')` 修改为 `@Post('update/:id')`
- 将 `@Delete(':id')` 修改为 `@Post('delete/:id')`
- 移除了不必要的 `Put` 和 `Delete` 导入

## 重构原则

1. 保持 API 语义清晰：
   - 对于更新操作，使用 `POST` + `update/` 路径前缀
   - 对于删除操作，使用 `POST` + `delete/` 路径前缀

2. 路径命名规范：
   - 对于资源操作，保持 RESTful 风格的路径命名（如 `:id`、`:phone` 等）
   - 对于特殊操作，使用动词+名词的形式（如 `permissions/remove`、`permissions/set` 等）

## 重构收益

1. **简化前端调用**：前端开发只需要处理 GET 和 POST 两种请求方法，无需考虑 PUT、DELETE 等方法的特殊处理
2. **提高兼容性**：某些老旧浏览器或网络环境可能对 PUT、DELETE 等方法支持不完善
3. **统一接口规范**：所有数据变更操作统一使用 POST 方法，便于接口管理和权限控制
4. **简化防火墙配置**：只需要允许 GET 和 POST 两种 HTTP 方法，简化网络安全配置

## 注意事项

1. 此次重构仅修改了 HTTP 控制器，不影响 gRPC 控制器的实现
2. API 文档（如 Swagger）需要相应更新，以反映新的 API 结构
3. 前端调用代码需要相应调整，将原来的 PUT 和 DELETE 请求改为 POST 请求
