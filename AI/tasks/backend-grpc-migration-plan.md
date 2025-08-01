# 后端 GraphQL → gRPC 迁移开发计划

> **项目目标**：将 NestJS 后端从 GraphQL 架构迁移到 gRPC + REST 双协议架构
> 
> **技术栈**：NestJS + TypeORM + Protobuf + gRPC + HTTP
> 
> **开发周期**：预计 4-5 周
> 
> **负责模块**：后端服务层（server/nest-main）

---

## 📋 迁移概览

| 当前技术栈 | 目标技术栈 | 改动类型 |
|------------|------------|----------|
| GraphQL + Apollo Server | gRPC + HTTP 双协议 | 🔄 重大重构 |
| GraphQL Schema | Protobuf Schema | 🔄 重大重构 |
| GraphQL Resolver | gRPC Controller | 🔄 重大重构 |
| @ObjectType, @InputType | Protobuf Messages | 🔄 重大重构 |

---

## 🎯 阶段一：环境准备与基础设施（第1周）

### 步骤 1.1：创建 Protobuf 契约目录
**目标**：建立项目级别的 Protobuf 契约管理

**具体任务**：
- [ ] 在项目根目录创建 `protos/` 文件夹
- [ ] 创建 `protos/users.proto` - 用户服务契约定义
- [ ] 创建 `protos/rbac.proto` - 权限服务契约定义
- [ ] 创建 `protos/common.proto` - 通用类型定义
- [ ] 添加 `.proto` 文件的基本规范说明

**产出物**：
```
protos/
├── users.proto      # 用户服务协议定义
├── rbac.proto       # 权限服务协议定义
├── common.proto     # 通用类型定义
└── README.md        # 协议使用说明
```

**验收标准**：
- 所有 `.proto` 文件语法正确
- 包含基本的服务定义和消息类型
- 文档说明完整

---

### 步骤 1.2：安装和配置 gRPC 依赖
**目标**：在 NestJS 项目中添加 gRPC 支持

**具体任务**：
- [ ] 安装 gRPC 相关依赖包
  - `@nestjs/microservices`
  - `@grpc/grpc-js`
  - `@grpc/proto-loader`
  - `ts-proto`
- [ ] 安装开发工具依赖
  - `protoc-gen-ts_proto`
  - `concurrently`
  - `nodemon`
- [ ] 移除 GraphQL 相关依赖
  - `@nestjs/apollo`
  - `@nestjs/graphql`
  - `apollo-server-express`
  - `graphql`

**产出物**：
- 更新的 `package.json` 文件
- 清理后的依赖列表

**验收标准**：
- 依赖安装无错误
- 项目启动无依赖冲突
- 版本兼容性验证通过

---

### 步骤 1.3：配置 Protobuf 编译脚本
**目标**：建立 Protobuf 到 TypeScript 的自动编译流程

**具体任务**：
- [ ] 在 `package.json` 中添加编译脚本
  - `proto:gen` - 编译所有 proto 文件
  - `proto:watch` - 监听 proto 文件变化
  - `dev:with-proto` - 开发模式下同时监听和编译
- [ ] 配置 `ts-proto` 编译选项
  - 输出目录：`src/shared/`
  - 生成 NestJS 服务接口
  - 启用类型安全选项
- [ ] 测试编译流程

**产出物**：
- 可执行的编译脚本
- 自动生成的 TypeScript 类型文件

**验收标准**：
- 编译脚本正常执行
- 生成的类型文件语法正确
- 监听模式工作正常

---

### 步骤 1.4：建立开发环境配置
**目标**：配置支持双协议开发的环境

**具体任务**：
- [ ] 创建开发环境配置文件
  - `.env.development` - 开发环境变量
  - `.env.production` - 生产环境变量
- [ ] 配置端口分配
  - HTTP 端口：3000（保持不变）
  - gRPC 端口：50051（新增）
- [ ] 添加调试和日志配置
- [ ] 更新 `.gitignore` 包含生成的文件

**产出物**：
- 环境配置文件
- 端口分配文档

**验收标准**：
- 环境变量正确加载
- 端口配置无冲突
- 开发工具正常工作

---

## 🔧 阶段二：核心架构重构（第2周）

### 步骤 2.1：重构应用启动配置
**目标**：修改 NestJS 应用以支持 gRPC + HTTP 双协议

**具体任务**：
- [ ] 修改 `src/main.ts`
  - 移除 GraphQL 相关配置
  - 添加 gRPC 微服务配置
  - 配置双端口监听
  - 添加协议选择逻辑
- [ ] 修改 `src/app.module.ts`
  - 移除 `GraphQLModule`
  - 保留 HTTP 模块配置
  - 添加必要的中间件配置
- [ ] 测试应用启动

**产出物**：
- 更新的应用启动文件
- 双协议支持验证

**验收标准**：
- 应用同时监听 HTTP 和 gRPC 端口
- 启动无错误信息
- 基本健康检查通过

---

### 步骤 2.2：创建 gRPC 服务基础设施
**目标**：建立 gRPC 服务的基础框架

**具体任务**：
- [ ] 创建 gRPC 服务基类
  - 统一错误处理
  - 请求日志记录
  - 性能监控埋点
- [ ] 创建协议转换工具
  - Protobuf 到 Entity 转换
  - Entity 到 Protobuf 转换
  - 统一数据验证
- [ ] 建立 gRPC 测试工具
  - 简单的客户端测试脚本
  - 连接性验证

**产出物**：
- gRPC 服务基础类库
- 数据转换工具
- 测试脚本

**验收标准**：
- 基础服务类功能正常
- 数据转换工具测试通过
- gRPC 连接测试成功

---

### 步骤 2.3：实现双协议路由策略
**目标**：建立智能的协议选择和路由机制

**具体任务**：
- [ ] 创建协议检测中间件
  - 识别请求协议类型
  - 添加协议标识到请求上下文
- [ ] 实现统一的响应格式
  - gRPC 响应格式
  - HTTP 响应格式
  - 错误响应标准化
- [ ] 建立协议降级机制
  - gRPC 不可用时降级到 HTTP
  - 配置降级策略

**产出物**：
- 协议检测中间件
- 统一响应格式定义
- 降级策略配置

**验收标准**：
- 协议识别准确
- 响应格式标准化
- 降级机制工作正常

---

## 🏗️ 阶段三：业务模块迁移（第3周）

### 步骤 3.1：迁移用户认证模块 - 准备工作
**目标**：准备用户模块的 Protobuf 定义和基础结构

**具体任务**：
- [ ] 完善 `protos/users.proto` 定义
  - `LoginRequest`, `AuthResponse` 消息
  - `GetUserRequest`, `User` 消息
  - `UserService` 服务定义
  - 添加所有认证相关方法
- [ ] 重新生成 TypeScript 类型
- [ ] 清理现有的 GraphQL DTO
  - 删除 `dto/auth-response.ts`
  - 删除 `dto/create-user.input.ts`
  - 删除 `dto/login.input.ts`
- [ ] 清理 Entity 中的 GraphQL 装饰器

**产出物**：
- 完整的用户服务 Protobuf 定义
- 生成的 TypeScript 类型
- 清理后的 Entity 文件

**验收标准**：
- Protobuf 定义涵盖所有用户操作
- 生成的类型文件正确
- Entity 文件不包含 GraphQL 依赖

---

### 步骤 3.2：实现用户认证 gRPC Controller
**目标**：将 AuthResolver 转换为 gRPC Controller

**具体任务**：
- [ ] 创建 `src/modules/users/auth.controller.ts`
  - 实现 `UserServiceController` 接口
  - 添加 `@GrpcMethod` 装饰器
  - 迁移所有认证方法
- [ ] 添加 HTTP 兼容接口
  - 创建 `@Post('/login')` 等 HTTP 端点
  - 复用 gRPC 方法逻辑
- [ ] 保持业务逻辑不变
  - `auth.service.ts` 保持现有逻辑
  - 只修改调用接口
- [ ] 删除 `auth.resolver.ts` 文件

**产出物**：
- 新的 gRPC Controller 文件
- HTTP 兼容接口
- 保持的业务服务层

**验收标准**：
- gRPC 方法调用正常
- HTTP 接口功能正常
- 业务逻辑保持一致
- 原有测试通过

---

### 步骤 3.3：迁移权限管理模块 - RBAC
**目标**：将 RBAC 模块从 GraphQL 迁移到 gRPC

**具体任务**：
- [ ] 完善 `protos/rbac.proto` 定义
  - `Permission`, `Role` 消息定义
  - `GetPermissionsRequest`, `CreateRoleRequest` 等
  - `PermissionService`, `RoleService` 服务定义
- [ ] 实现 Permission Controller
  - 创建 `src/modules/rbac/permission.controller.ts`
  - 迁移权限查询和管理方法
  - 添加 HTTP 兼容接口
- [ ] 实现 Role Controller
  - 创建 `src/modules/rbac/role.controller.ts`
  - 迁移角色 CRUD 操作
  - 添加 HTTP 兼容接口
- [ ] 删除原有的 Resolver 文件

**产出物**：
- RBAC 相关的 Protobuf 定义
- Permission 和 Role 的 gRPC Controller
- HTTP 兼容接口

**验收标准**：
- 所有权限操作功能正常
- 角色管理功能完整
- 权限验证逻辑正确

---

### 步骤 3.4：实现健康检查和监控
**目标**：建立 gRPC 服务的健康检查和监控机制

**具体任务**：
- [ ] 实现 gRPC 健康检查服务
  - 实现标准的 Health 服务
  - 添加自定义健康检查逻辑
  - 支持服务状态查询
- [ ] 添加服务监控指标
  - 请求计数和延迟统计
  - 错误率监控
  - 连接状态监控
- [ ] 建立日志记录机制
  - gRPC 请求日志
  - 性能指标日志
  - 错误详情日志

**产出物**：
- 健康检查服务
- 监控指标收集
- 日志记录系统

**验收标准**：
- 健康检查服务响应正常
- 监控指标准确收集
- 日志信息完整详细

---

## 🛡️ 阶段四：安全和中间件适配（第4周）

### 步骤 4.1：重构认证守卫
**目标**：适配认证守卫以支持双协议

**具体任务**：
- [ ] 创建混合认证守卫
  - 创建 `src/common/guards/hybrid-auth.guard.ts`
  - 支持 gRPC 和 HTTP 请求上下文
  - 兼容现有的 JWT 策略
- [ ] 修改上下文获取逻辑
  - gRPC 请求：`context.switchToRpc().getContext()`
  - HTTP 请求：`context.switchToHttp().getRequest()`
- [ ] 删除原有的 `gql-auth.guard.ts`
- [ ] 更新所有使用认证守卫的地方

**产出物**：
- 新的混合认证守卫
- 更新的守卫使用方式

**验收标准**：
- 认证守卫在两种协议下都正常工作
- JWT 验证逻辑保持一致
- 无安全漏洞

---

### 步骤 4.2：重构权限守卫
**目标**：适配权限验证以支持双协议

**具体任务**：
- [ ] 更新权限守卫 `src/common/guards/permission.guard.ts`
  - 适配 gRPC 和 HTTP 上下文
  - 保持权限验证逻辑不变
  - 优化上下文获取性能
- [ ] 更新权限装饰器
  - 确保 `@RequirePermissions` 在两种协议下都有效
  - 添加协议特定的权限处理
- [ ] 测试权限验证功能
  - 验证 gRPC 和 HTTP 下的权限控制
  - 确保权限继承关系正确

**产出物**：
- 更新的权限守卫
- 兼容的权限装饰器

**验收标准**：
- 权限验证在两种协议下一致
- 权限拒绝响应格式正确
- 性能无明显下降

---

### 步骤 4.3：实现统一异常处理
**目标**：建立双协议的统一异常处理机制

**具体任务**：
- [ ] 创建 gRPC 异常过滤器
  - 创建 `src/common/filters/grpc-exception.filter.ts`
  - 转换内部异常为 gRPC 状态码
  - 统一错误响应格式
- [ ] 更新 HTTP 异常过滤器
  - 保持现有 HTTP 异常处理
  - 统一错误响应结构
- [ ] 建立异常映射规则
  - 业务异常到 gRPC 状态码
  - 系统异常到通用错误码
  - 敏感信息过滤

**产出物**：
- gRPC 异常过滤器
- 统一的异常映射规则

**验收标准**：
- 异常处理覆盖所有场景
- 错误信息对用户友好
- 不泄露敏感系统信息

---

### 步骤 4.4：配置和优化中间件
**目标**：优化中间件以支持双协议高效运行

**具体任务**：
- [ ] 优化日志中间件
  - 添加协议类型识别
  - 记录请求耗时和状态
  - 支持结构化日志输出
- [ ] 配置 CORS 中间件
  - 支持 gRPC-Web 跨域请求
  - 配置预检请求处理
- [ ] 添加请求限流中间件
  - 分别限制 gRPC 和 HTTP 请求
  - 支持动态限流配置
- [ ] 性能监控中间件
  - 收集性能指标
  - 支持链路追踪

**产出物**：
- 优化的中间件栈
- 性能监控配置

**验收标准**：
- 中间件对性能影响最小
- 监控数据准确完整
- 安全策略有效执行

---

## 🧪 阶段五：测试和验证（第5周）

### 步骤 5.1：重构单元测试
**目标**：更新单元测试以支持新的 gRPC 架构

**具体任务**：
- [ ] 更新 Controller 测试
  - 测试 gRPC 方法调用
  - 测试 HTTP 兼容接口
  - 模拟 Protobuf 消息对象
- [ ] 更新 Service 测试
  - 保持现有业务逻辑测试
  - 添加数据转换测试
- [ ] 更新守卫和中间件测试
  - 测试双协议支持
  - 验证安全机制

**产出物**：
- 更新的单元测试套件
- 新的测试工具类

**验收标准**：
- 所有测试通过
- 代码覆盖率保持在 80% 以上
- 测试执行时间合理

---

### 步骤 5.2：实现集成测试
**目标**：建立端到端的集成测试

**具体任务**：
- [ ] 创建 gRPC 客户端测试
  - 测试用户认证流程
  - 测试权限管理操作
  - 验证数据一致性
- [ ] 创建 HTTP 接口测试
  - 保持现有 E2E 测试
  - 添加新的 HTTP 接口测试
- [ ] 测试协议切换和降级
  - 模拟 gRPC 不可用场景
  - 验证自动降级机制
- [ ] 性能基准测试
  - 对比 GraphQL 和 gRPC 性能
  - 测试并发处理能力

**产出物**：
- 完整的集成测试套件
- 性能基准报告

**验收标准**：
- 所有集成测试通过
- 性能指标满足要求
- 降级机制工作正常

---

### 步骤 5.3：部署和环境验证
**目标**：验证在不同环境下的部署和运行

**具体任务**：
- [ ] 更新 Docker 配置
  - 暴露 gRPC 端口
  - 配置健康检查
  - 优化镜像大小
- [ ] 更新部署脚本
  - 支持双协议部署
  - 添加服务发现配置
- [ ] 测试不同环境部署
  - 开发环境验证
  - 测试环境验证
  - 生产环境预检
- [ ] 建立监控和告警
  - 服务健康监控
  - 性能指标告警
  - 错误率监控

**产出物**：
- 更新的部署配置
- 监控告警规则

**验收标准**：
- 部署过程顺利
- 服务运行稳定
- 监控数据正常

---

### 步骤 5.4：文档和知识转移
**目标**：完善文档和团队知识转移

**具体任务**：
- [ ] 编写 API 文档
  - gRPC 服务文档
  - HTTP 接口文档
  - 认证和权限说明
- [ ] 更新开发指南
  - gRPC 开发规范
  - 调试和测试指南
  - 常见问题解答
- [ ] 团队培训
  - gRPC 基础知识培训
  - 工具使用培训
  - 最佳实践分享
- [ ] 建立运维手册
  - 部署运维指南
  - 故障排查手册
  - 性能优化建议

**产出物**：
- 完整的技术文档
- 培训材料
- 运维手册

**验收标准**：
- 文档内容完整准确
- 团队成员掌握新技术
- 运维流程清晰

---

## 📊 质量控制和里程碑

### 里程碑检查点

| 里程碑 | 时间节点 | 验收标准 | 风险评估 |
|--------|----------|----------|----------|
| **M1 - 环境就绪** | 第1周末 | 基础环境搭建完成，编译流程正常 | 低风险 |
| **M2 - 架构重构** | 第2周末 | 双协议支持，基础服务运行 | 中风险 |
| **M3 - 模块迁移** | 第3周末 | 核心业务模块迁移完成 | 高风险 |
| **M4 - 安全完善** | 第4周末 | 安全机制完整，中间件优化 | 中风险 |
| **M5 - 测试验证** | 第5周末 | 所有测试通过，部署验证完成 | 低风险 |

### 风险缓解策略

| 风险项 | 缓解措施 | 应急预案 |
|--------|----------|----------|
| **学习曲线陡峭** | 提前培训，分阶段实施 | 延长开发周期，增加支援 |
| **性能不达标** | 基准测试，持续优化 | 回滚到 GraphQL 架构 |
| **数据不一致** | 严格测试，数据校验 | 数据修复脚本，手动校正 |
| **服务不稳定** | 渐进式发布，监控告警 | 快速回滚，紧急修复 |

### 质量门禁

**每个阶段完成前必须通过：**
- [ ] 代码审查（Code Review）
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试全部通过
- [ ] 性能测试达标
- [ ] 安全检查通过
- [ ] 文档更新完成

---

## 🚀 部署和上线策略

### 分阶段部署计划

1. **灰度部署**（20% 流量）
   - 部署到测试环境
   - 小范围用户验证
   - 监控关键指标

2. **逐步扩量**（50% 流量）
   - 扩大用户范围
   - 观察系统稳定性
   - 收集用户反馈

3. **全量部署**（100% 流量）
   - 完全切换到新架构
   - 关闭旧的 GraphQL 服务
   - 持续监控和优化

### 回滚预案

- **快速回滚**：保留 GraphQL 服务，数据库回滚点
- **数据恢复**：定期数据备份，增量恢复机制
- **服务降级**：关键功能降级方案，基础服务保障

---

> **总结**：本开发计划采用渐进式迁移策略，确保系统稳定性的同时实现技术架构升级。重点关注数据一致性、服务稳定性和团队技能提升。 