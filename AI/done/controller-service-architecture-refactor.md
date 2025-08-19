# 控制器与服务层架构重构

## 问题描述

原有架构中，HTTP 控制器直接依赖于 gRPC 控制器，导致以下问题：

1. **紧耦合**：`UserHttpController` 直接依赖于 `UserGrpcController`，导致两者紧密耦合。
2. **类型不匹配**：gRPC 返回的类型与 HTTP 控制器期望的类型不匹配，导致了大量类型错误。
3. **职责混乱**：HTTP 控制器应该处理 HTTP 特定的逻辑，gRPC 控制器应该处理 gRPC 特定的逻辑，但原架构中 HTTP 控制器中混入了 gRPC 逻辑。
4. **难以维护**：如果 gRPC 接口发生变化，HTTP 控制器也需要相应修改，增加了维护成本。
5. **测试困难**：紧耦合的架构使得单元测试变得困难。

## 改进方案

我们重构为以下架构：

```
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│ UserHttpController│     │ UserGrpcController│
│                   │     │                   │
└─────────┬─────────┘     └─────────┬─────────┘
          │                         │
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────┐
│                                             │
│               UserService                   │
│                                             │
└─────────────────────────────────────────────┘
```

### 核心改进点

1. **Service 层**：
   - 包含所有业务逻辑，由 `UserService` 提供
   - 返回领域模型对象（Domain Model）
   - 不关心响应格式（HTTP/gRPC）

2. **Controller 层**：
   - `UserHttpController`：处理 HTTP 请求参数，调用 `UserService`，将返回的领域模型转换为 HTTP 响应
   - `UserGrpcController`：处理 gRPC 请求参数，调用 `UserService`，将返回的领域模型转换为 gRPC 响应

3. **数据流转**：
   - HTTP 请求 -> UserHttpController -> UserService -> 业务逻辑处理 -> HTTP 响应
   - gRPC 请求 -> UserGrpcController -> UserService -> 业务逻辑处理 -> gRPC 响应

## 实现细节

### 1. UserService 增强

- 添加了登录、注册、获取用户列表等业务方法
- 实现了用户角色和权限的处理逻辑
- 统一了错误处理机制

### 2. UserGrpcController 重构

- 移除了直接的业务逻辑
- 调用 UserService 处理业务逻辑
- 将 UserService 返回的领域模型转换为 gRPC 响应格式

### 3. UserHttpController 重构

- 移除了对 UserGrpcController 的依赖
- 直接调用 UserService 处理业务逻辑
- 将 UserService 返回的领域模型转换为 HTTP 响应格式

## 优势

1. **松耦合**：HTTP 控制器和 gRPC 控制器之间不再有依赖关系
2. **职责清晰**：每一层都有明确的职责
3. **易于维护**：修改一个协议的实现不会影响另一个协议
4. **易于测试**：可以独立测试每一层
5. **代码复用**：业务逻辑集中在 Service 层，避免重复实现

## 后续工作

1. 将类似的架构模式应用到其他模块
2. 添加更完善的单元测试
3. 优化错误处理机制
4. 完善文档和注释
