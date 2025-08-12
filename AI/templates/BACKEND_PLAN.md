# 开发文档模板 - 后端服务开发版（架构优先）

> **AI 协作提示**: 此模板用于生成后端服务开发文档。请根据实际需求替换所有 `[AI_FILL]` 标记的内容。此模板专为 AI 辅助开发设计，采用增量模块化开发模式。
> 
> **架构优先原则**: 专注于架构设计和实现指导，具体代码实现使用 TODO 标记，避免生成过多具体代码细节。
> 
> **按开发计划阶段顺序，每个阶段完成后等待用户确认再继续下一步**
> 
> **生成说明**: 输出最终文档时，仅保留 `[结果]` 部分内容，隐藏所有 `[指引]` 标记的内容。
> 
> **重要**: 本项目正在从 GraphQL 迁移到 gRPC + REST 双协议架构，使用基于 Protobuf 的混合 API 服务实现。

## 📋 项目概述与配置

### 需求&服务概述

**[AI_FILL: 服务功能描述]**

<!-- 示例: "用户服务"，负责用户管理、认证授权等核心功能。采用 NestJS 模块化架构，支持 gRPC 和 REST 双协议，使用 PostgreSQL 数据库存储用户数据。 -->

### 初始化配置

**服务目录**: `[MANUAL_FILL: 服务目录完整路径]`
**模块文件**: `[MANUAL_FILL: 模块文件路径]`
**Protobuf 文件**: `[MANUAL_FILL: Protobuf 定义文件路径]`

---

## 🎯 开发目标拆解

**[AI_FILL: 服务功能描述]**

### 核心模块与接口

**[AI_FILL: 根据需求识别主要功能和接口]**
**[Attention: 请先从项目的 Protobuf 定义中寻找功能对应的接口，若无法找到则定义新的接口]**

| 功能模块          | 接口方法                          | 协议类型       | 优先级              |
| ----------------- | --------------------------------- | -------------- | ------------------- |
| [AI_FILL: 模块名] | `[AI_FILL: gRPC 方法名]`          | gRPC           | [AI_FILL: 高/中/低] |
| [AI_FILL: 模块名] | `[AI_FILL: REST 接口路径]`        | REST           | [AI_FILL: 高/中/低] |

**接口实现说明**：
- gRPC 接口: 基于 Protobuf 定义，使用 NestJS gRPC 模块实现
- REST 接口: 使用 NestJS Controller 实现，可与 gRPC 接口共享业务逻辑
- 数据访问: 使用 TypeORM 或 Prisma 访问数据库

**数据模型说明: [AI_FILL: 对于核心数据模型列出主要字段和关系]**

**依赖服务**: 

-   数据库服务: PostgreSQL
-   缓存服务: Redis
-   认证服务: JWT/Passport
-   消息队列: RabbitMQ (如需)

---

## 🔄 增量开发计划

#### 🏗️ 阶段一：基础架构

-   **A0**: 服务结构与模块配置 → **A1**: 数据模型设计 → **A2**: Protobuf 接口定义

#### ⚙️ 阶段二：核心功能

-   **B1**: 基础 CRUD 功能 → **B2**: 业务逻辑实现 → **B3**: 认证授权集成 → **Bn**: xxx 功能

#### 🚀 阶段三：集成优化

-   **C1**: 服务集成联调 → **C2**: 性能优化完善 → **C3**: 测试与文档

### 🔧 执行规则

1. **按序执行**: 严格按模块顺序，不可跳跃
2. **确认机制**: 每阶段完成后等待用户确认再继续下一模块
3. **阶段二根据需求大小拆分多个步骤**
4. **实施清单要求**: 使用精炼语言，避免过度拆分，每个清单项应为一个完整的功能单元

---

## 📦 模块详细设计

### 模块 A0: 服务结构与模块配置

#### [指引] 目标与实施要点

创建服务目录结构，配置 NestJS 模块，建立基本服务框架。

**服务结构设计（符合项目规范）**:

```
server/[服务名称]/
├── src/
│   ├── modules/
│   │   └── [模块名]/
│   │       ├── [模块名].module.ts    # 模块定义
│   │       ├── controllers/          # REST 控制器
│   │       ├── services/             # 业务服务
│   │       ├── repositories/         # 数据访问层
│   │       ├── entities/             # 数据实体
│   │       └── dtos/                 # 数据传输对象
│   ├── config/                       # 配置文件
│   ├── common/                       # 公共组件
│   └── main.ts                       # 入口文件
└── package.json
```

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 服务结构选择和理由]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 5 个]

**技术框架**:

```typescript
// TODO: 模块配置框架
// TODO: 服务基础结构
```

**验收标准**:

-   [ ] 服务启动正常，无模块错误
-   [ ] 目录结构符合项目规范

**完成标识**: `[MODULE_A0_COMPLETED]`

---

### 模块 A1: 数据模型设计

#### [指引] 目标与实施要点

设计数据库实体和关系，基于 Prisma 创建数据模型。

#### [结果] 架构决策与实施清单

**架构决策**: 采用 Prisma 作为数据访问层解决方案，替换原有的 TypeORM。Prisma 提供更简洁的 API、更强大的类型安全和更好的开发者体验，适合项目当前的技术升级方向。

**实施清单**:

1. [ ] 定义 Prisma Schema 数据模型
2. [ ] 生成 Prisma Client
3. [ ] 集成 Prisma 到 NestJS 模块
4. [ ] 创建初始数据库迁移

**技术框架**:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  phone    String   @id
  username String
  password String
  isActive Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  roles    Role[]   @relation(through: "UserRole")
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  permissions Permission[] @relation(through: "RolePermission")
  users       User[]       @relation(through: "UserRole")
}

model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  roles       Role[]   @relation(through: "RolePermission")
}

model UserRole {
  user   User   @relation(fields: [userId], references: [phone])
  role   Role   @relation(fields: [roleId], references: [id])
  userId String
  roleId String

  @@id([userId, roleId])
}

model RolePermission {
  role       Role       @relation(fields: [roleId], references: [id])
  permission Permission @relation(fields: [permissionId], references: [id])
  roleId     String
  permissionId String

  @@id([roleId, permissionId])
}
```

```typescript
// Prisma 模块集成
import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => new PrismaClient(),
    },
  ],
  exports: [PrismaClient],
})
export class PrismaModule {}
```

**验收标准**:

-   [ ] 数据模型符合业务需求
-   [ ] 实体关系设计合理
-   [ ] 迁移脚本生成正确

**完成标识**: `[MODULE_A1_COMPLETED]`

---

### 模块 A2: Protobuf 接口定义

#### [指引] 目标与实施要点

定义 gRPC 接口和消息类型，生成 TypeScript 类型。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: Protobuf 接口设计方案]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 4 个]

**技术框架**:

```protobuf
// TODO: Protobuf 消息定义
// TODO: Protobuf 服务定义
```

**验收标准**:

-   [ ] 接口定义符合业务需求
-   [ ] 消息结构设计合理
-   [ ] TypeScript 类型生成正确

**完成标识**: `[MODULE_A2_COMPLETED]`

---

### 模块 B1: 基础 CRUD 功能

#### [指引] 目标与实施要点

实现基础的创建、读取、更新、删除功能，包括 gRPC 和 REST 接口。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: CRUD 实现方案]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 5 个]

**技术框架**:

```typescript
// TODO: gRPC 服务实现
// TODO: REST 控制器实现
// TODO: 数据访问层实现
// TODO: 基础验证逻辑
```

**验收标准**:

-   [ ] CRUD 功能正常工作
-   [ ] gRPC 和 REST 接口响应一致
-   [ ] 数据验证正确

**完成标识**: `[MODULE_B1_COMPLETED]`

---

### 模块 B2: 业务逻辑实现

#### [指引] 目标与实施要点

实现核心业务逻辑，包括复杂计算、事务处理等。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 业务逻辑实现方案]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 5 个]

**技术框架**:

```typescript
// TODO: 业务服务实现
// TODO: 事务处理逻辑
// TODO: 复杂计算逻辑
// TODO: 错误处理机制
```

**验收标准**:

-   [ ] 业务逻辑符合需求
-   [ ] 事务处理正确
-   [ ] 边界条件处理完善

**完成标识**: `[MODULE_B2_COMPLETED]`

---

### 模块 B3: 认证授权集成

#### [指引] 目标与实施要点

集成认证授权机制，实现基于角色的访问控制。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 认证授权方案]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 4 个]

**技术框架**:

```typescript
// TODO: JWT 认证实现
// TODO: RBAC 权限控制
// TODO: 守卫和装饰器实现
// TODO: 权限验证逻辑
```

**验收标准**:

-   [ ] 认证流程正常
-   [ ] 权限控制有效
-   [ ] 安全机制完善

**完成标识**: `[MODULE_B3_COMPLETED]`

---

### 模块 C1: 服务集成与联调

#### [指引] 目标与实施要点

整合各功能模块，与其他服务联调，完善服务间交互。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 服务集成策略]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 5 个]

**技术框架**:

```typescript
// TODO: 服务间调用实现
// TODO: 事件订阅发布机制
// TODO: 分布式事务处理
// TODO: 服务健康检查
```

**验收标准**:

-   [ ] 服务间通信正常
-   [ ] 集成测试通过
-   [ ] 错误处理机制完善

**完成标识**: `[MODULE_C1_COMPLETED]`

---

### 模块 C2: 性能优化与完善

#### [指引] 目标与实施要点

性能优化处理，代码质量提升，安全加固。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 优化策略]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 4 个]

**技术框架**:

**1. 性能优化**

```typescript
// TODO: 数据库查询优化
// TODO: 缓存策略实现
// TODO: gRPC 性能优化
// TODO: 并发处理优化
```

**2. 安全优化**

```typescript
// TODO: 输入验证强化
// TODO: 敏感数据加密
// TODO: 防注入攻击
// TODO: 速率限制实现
```

**3. 代码优化**

```typescript
// TODO: 代码重构
// TODO: 工具函数提取
// TODO: 代码规范检查
// TODO: 注释完善
```

**验收标准**:

-   [ ] 性能指标满足要求（响应时间、吞吐量等）
-   [ ] 安全机制完善
-   [ ] 代码质量符合规范
-   [ ] 资源占用合理

**完成标识**: `[MODULE_C2_COMPLETED]`

---

### 模块 C3: 测试与文档

#### [指引] 目标与实施要点

编写单元测试、集成测试，生成 API 文档。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 测试与文档策略]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 4 个]

**技术框架**:

```typescript
// TODO: 单元测试实现
// TODO: 集成测试实现
// TODO: E2E 测试实现
// TODO: API 文档生成
```

**验收标准**:

-   [ ] 测试覆盖率达到要求 (>80%)
-   [ ] 所有测试通过
-   [ ] API 文档完整准确
-   [ ] 文档与代码同步

**完成标识**: `[MODULE_C3_COMPLETED]`

---

## 🚀 执行控制流程

### AI 执行协议

**模块开始**: `[AI_START_MODULE: XX]` → **模块完成**: `[MODULE_XX_COMPLETED]` → **等待用户确认继续下一模块**

**执行过程**: AI 按清单逐项完成，每完成一项标记 ✅，遇到问题详细说明

### 技术要求与验收标准

-   **框架**: NestJS 11+ + TypeScript
-   **数据库**: PostgreSQL + TypeORM/Prisma
-   **API 协议**: gRPC + REST 双协议
-   **类型安全**: 基于 Protobuf 自动生成的类型
-   **认证授权**: JWT + RBAC
-   **缓存**: Redis
-   **质量标准**: 无语法错误，TypeScript 类型检查通过，符合 ESLint 规范
-   **性能标准**: 响应时间 < 500ms，吞吐量满足业务需求
-   **安全标准**: 符合 OWASP 安全规范，无常见漏洞

---

> **使用说明**:
> 
> -   **AI 开发者**: 按模块顺序执行，完成后输出标识等待用户确认
> -   **项目开发者**: 填写 `[MANUAL_FILL]` 标记内容
> -   **生成时**: 仅保留 `[结果]` 部分，隐藏 `[指引]` 部分
> -   **实施清单**: 使用精炼语言，避免过度拆分
> -   **接口实现**: 优先实现 gRPC 接口，再实现 REST 接口

---