# 错误类型分类改进

## 问题描述

原有的错误类型分类不够精确，特别是"找不到用户"这类错误被错误地归类为资源未找到（NOT_FOUND）错误。实际上，这类错误应该是数据错误，而不是路由或API端点不存在的错误。

## 改进内容

1. 在 `ERROR_TYPES` 中添加了新的错误类型 `DATA_ERROR`，用于表示数据库中的记录不存在的情况。
2. 在 `BaseController` 中添加了 `dataNotFound` 方法，用于处理数据不存在的错误。
3. 修改了 `handleOperationError` 方法，使其能够区分资源不存在和数据不存在的错误。
4. 在 `ResponseBuilder` 中添加了 `dataNotFound` 方法，用于构建数据不存在的错误响应。
5. 修改了 `UserService` 的 `findOne` 方法，使其在用户不存在时抛出带有实体类型和标识符信息的错误。

## 错误类型使用指南

- `NOT_FOUND_ERROR`：仅用于表示路由或API端点不存在的情况，HTTP状态码为404。
- `DATA_ERROR`：用于表示数据库中的记录不存在的情况，如用户、角色等，HTTP状态码为400。

## 影响范围

这个改进主要影响以下文件：
- `server/nest-main/src/common/response/types.ts`
- `server/nest-main/src/common/controllers/base.controller.ts`
- `server/nest-main/src/common/response/response-builder.ts`
- `server/nest-main/src/modules/users/user.service.ts`

## 后续工作

其他服务中类似的错误处理也应该进行相应的调整，确保错误类型的一致性。
