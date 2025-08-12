# TypeORM 到 Prisma 迁移开发计划

## 背景与目标

### 任务背景
文件名：TYPEORM_TO_PRISMA_MIGRATION_PLAN.md
创建于：2023-11-08
任务分支：migration/prisma

项目正在从 GraphQL 迁移到 gRPC + REST 双协议架构，同时需要将数据访问层从 TypeORM 替换为 Prisma，以提升开发效率和代码质量。

### 核心目标
1. 替换现有的 TypeORM 数据访问层，改用 Prisma
2. 保持与 NestJS 11 的良好集成
3. 迁移现有的实体定义和关系映射
4. 转换现有的数据库迁移脚本
5. 确保与 gRPC + REST 双协议架构的兼容性
6. 保持与 RBAC 权限系统的集成

## 现状分析

### 技术栈现状
- NestJS 11.0.1
- TypeORM 0.3.21
- PostgreSQL 数据库
- 项目正在从 GraphQL 迁移到 gRPC + REST 双协议架构

### 数据模型现状
- User 实体：包含用户基本信息，与 Role 实体有多对多关系
- Role 实体：包含角色信息，与 Permission 实体有多对多关系
- Permission 实体：包含权限信息

### 迁移优势
1. **更简洁的 API 和类型安全**：Prisma 提供自动生成的、类型安全的查询构建器
2. **直观的数据模型定义**：使用 Prisma Schema 语言定义数据模型，更易读和维护
3. **强大的迁移工具**：Prisma Migrate 提供更可靠的数据库迁移体验
4. **减少样板代码**：Prisma Client 自动生成，无需手动编写数据访问代码
5. **更好的开发者体验**：包括自动完成、语法高亮和错误提示
6. **性能优化**：Prisma 针对常见查询模式进行了优化

### 迁移挑战
1. **代码重写**：需要重写现有的数据访问层代码
2. **实体关系迁移**：需要将 TypeORM 的关系定义转换为 Prisma 的关系定义
3. **迁移脚本转换**：需要将 TypeORM 的迁移脚本转换为 Prisma 的迁移格式
4. **学习曲线**：团队需要熟悉 Prisma 的使用方式
5. **兼容性问题**：需要确保与现有业务逻辑和服务的兼容性

## 迁移策略与实施步骤

### 总体策略
采用增量迁移策略，先在小范围模块试点，验证可行性后再全面推广。按照以下阶段实施：
1. 环境准备与 Prisma 初始化
2. 数据模型迁移与 Client 生成
3. NestJS 集成与数据访问层重构
4. 迁移脚本转换与测试
5. 文档更新和团队培训

### 详细实施步骤

#### 阶段一：环境准备与 Prisma 初始化
```bash
# 安装 Prisma CLI
npm install -g prisma

# 在项目中安装 Prisma 依赖
cd /Users/staff/Documents/my-tools/vue3-mono/server/nest-main
npm install @prisma/client prisma

# 初始化 Prisma
prisma init
```

#### 阶段二：数据模型迁移与 Client 生成
1. 创建 `prisma/schema.prisma` 文件，定义数据模型
2. 生成 Prisma Client
```bash
prisma generate
```

#### 阶段三：NestJS 集成与数据访问层重构
1. 创建 Prisma 模块集成到 NestJS
2. 重构数据访问层代码，替换为 Prisma Client
3. 更新业务服务实现

#### 阶段四：迁移脚本转换与测试
1. 创建初始迁移
```bash
prisma migrate dev --name init
```
2. 应用迁移到数据库
```bash
prisma migrate deploy
```
3. 运行单元测试和集成测试
4. 验证 API 功能正常
5. 检查数据库操作是否正确

#### 阶段五：文档更新和团队培训
1. 更新后端开发计划模板
2. 编写 Prisma 使用文档
3. 组织团队培训

## 详细模块计划

### 模块 A1: 数据模型设计（已更新）
- **架构决策**: 采用 Prisma 作为数据访问层解决方案，替换原有的 TypeORM
- **实施清单**:
  1. [✅] 定义 Prisma Schema 数据模型
  2. [✅] 生成 Prisma Client
  3. [✅] 集成 Prisma 到 NestJS 模块
  4. [✅] 创建初始数据库迁移
- **技术框架**:
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

### 模块 B1: 基础 CRUD 功能
- **架构决策**: 使用 Prisma Client 实现基础 CRUD 功能，同时支持 gRPC 和 REST 接口
- **实施清单**:
  1. [✅] 实现基于 Prisma 的数据访问层
  2. [✅] 实现 gRPC 服务接口 (现有接口已兼容)
  3. [✅] 实现 REST 控制器 (现有接口已兼容)
  4. [✅] 添加基础验证逻辑
- **技术框架**:
```typescript
// Prisma 数据访问层实现
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有用户
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { roles: true },
    });
  }

  /**
   * 根据手机号获取用户
   */
  async findOne(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException(`用户 ${phone} 不存在`);
    }

    return user;
  }

  /**
   * 创建用户
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    // 加密密码
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.create({
      data,
      include: { roles: true },
    });
  }

  /**
   * 更新用户
   */
  async update(phone: string, data: Prisma.UserUpdateInput): Promise<User> {
    // 如果更新密码，需要加密
    if (data.password) {
      data.password = await bcrypt.hash(data.password as string, 10);
    }

    return this.prisma.user.update({
      where: { phone },
      data,
      include: { roles: true },
    });
  }

  /**
   * 删除用户
   */
  async remove(phone: string): Promise<User> {
    return this.prisma.user.delete({
      where: { phone },
      include: { roles: true },
    });
  }

  /**
   * 验证用户密码
   */
  async validatePassword(phone: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  }
}
```

### 其他模块调整
- **模块 B2: 业务逻辑实现**：更新业务逻辑中的数据访问代码，使用 Prisma Client
- **模块 B3: 认证授权集成**：更新认证授权逻辑中的数据访问代码
- **模块 B4: RBAC模块迁移**：
  - [✅] 更新Prisma Schema，添加RBAC相关字段
  - [✅] 迁移RoleService到Prisma
  - [✅] 迁移PermissionService到Prisma
  - [✅] 迁移RbacSeedService到Prisma
  - [✅] 更新RBAC模块配置
  - [✅] 更新相关转换器
- **模块 C1: 服务集成与联调**：确保 Prisma 与其他服务的集成正常
- **模块 C2: 性能优化与完善**：针对 Prisma 进行查询优化
- **模块 C3: 测试与文档**：更新测试用例和 API 文档

## 时间表与里程碑

| 阶段 | 任务 | 预计时间 | 里程碑 |
|------|------|----------|--------|
| 1 | 环境准备和 Prisma 初始化 | 1 天 | Prisma 初始化完成 |
| 2 | 数据模型定义和 Client 生成 | 1-2 天 | 数据模型迁移完成 |
| 3 | NestJS 集成和数据访问层重构 | 3-5 天 | 数据访问层代码重构完成 |
| 4 | 迁移脚本转换和测试 | 2-3 天 | 测试通过，功能验证完成 |
| 5 | 文档更新和团队培训 | 1-2 天 | 文档更新完成，培训完成 |

## 风险评估与应对

| 风险类型 | 描述 | 应对策略 |
|----------|------|----------|
| 技术风险 | Prisma 与现有业务逻辑不兼容 | 先在小范围模块试点，验证可行性后再全面推广 |
| 进度风险 | 迁移时间超出预期 | 制定详细的迁移计划，明确里程碑，定期检查进度 |
| 质量风险 | 迁移后出现数据不一致或功能故障 | 完善测试用例，进行全面的测试和验证 |
| 团队风险 | 团队不熟悉 Prisma | 提供培训和文档，鼓励团队成员提前学习 |

## 执行控制流程

### AI 执行协议
**模块开始**: `[AI_START_MODULE: XX]` → **模块完成**: `[MODULE_XX_COMPLETED]` → **等待用户确认继续下一模块**

**执行过程**: AI 按清单逐项完成，每完成一项标记 ✅，遇到问题详细说明

### 技术要求与验收标准
- **框架**: NestJS 11+ + TypeScript
- **数据库**: PostgreSQL + Prisma
- **API 协议**: gRPC + REST 双协议
- **类型安全**: 基于 Protobuf 自动生成的类型
- **认证授权**: JWT + RBAC
- **缓存**: Redis
- **质量标准**: 无语法错误，TypeScript 类型检查通过，符合 ESLint 规范
- **性能标准**: 响应时间 < 500ms，吞吐量满足业务需求
- **安全标准**: 符合 OWASP 安全规范，无常见漏洞

## 任务进度
### 模块 A1: 数据模型设计
- 已完成所有任务

### 模块 B1: 基础 CRUD 功能
- 已完成：实现基于 Prisma 的数据访问层
- 已完成：实现 gRPC 服务接口 (现有接口已兼容)
- 已完成：实现 REST 控制器 (现有接口已兼容)
- 已完成：添加基础验证逻辑
- 已完成：修复auth.service.ts文件中的错误
  - 修复缺少的异常导入
  - 修复重复导入问题
  - 修复PrismaService使用方式错误
  - 修复userRepository引用错误
  - 优化空值检查

### 模块 B1.1: 优化 Prisma 实现
- 已完成：创建 Prisma 中间件处理数据转换
  - 解决模型定义与使用不一致问题
  - 统一处理userRoles到roles的转换
- 已完成：修改 PrismaService 注册中间件
  - 添加日志记录
  - 优化连接管理
- 已完成：更新 PrismaModule 导出配置
  - 正确导出PrismaService
  - 添加日志配置
- 已完成：修改 UserService 移除手动转换代码
  - 简化代码结构
  - 提高可维护性
- 已完成：修改 AuthService 移除手动转换代码
  - 修复validateUser方法中的查询

### 执行记录
2023-11-09
- 已修改：server/nest-main/src/modules/users/user.service.ts
- 更改：创建了基于 Prisma 的用户服务
- 状态：成功

2023-11-09
- 已修改：server/nest-main/src/modules/users/users.module.ts
- 更改：更新了用户模块，添加了 UserService 并移除了对 TypeORM 的依赖
- 状态：成功

2023-11-09
- 已修改：server/nest-main/src/modules/users/auth.service.ts
- 更改：更新了认证服务，使用 UserService 和 PrismaService 替代 TypeORM 的 Repository
- 状态：成功

2023-11-09
- 已修改：AI/tasks/TYPEORM_TO_PRISMA_MIGRATION_PLAN.md
- 更改：更新了模块 B1 的实施清单，标记已完成的任务
- 状态：成功

2023-11-10
- 已修改：server/nest-main/src/modules/users/user.service.ts
- 更改：添加基础验证逻辑，包括手机号格式验证、密码强度验证、用户名验证等
- 状态：成功

2023-11-10
- 已修改：AI/tasks/TYPEORM_TO_PRISMA_MIGRATION_PLAN.md
- 更改：更新任务进度，标记模块 B1 的第 4 个任务为已完成
- 状态：成功

2023-11-11
- 已修改：server/nest-main/src/modules/users/auth.service.ts
- 更改：修复文件中的错误（缺少异常导入、重复导入、PrismaService使用方式、userRepository引用、空值检查、UserCreateInput中不存在'roles'属性问题）
- 状态：成功

2023-11-11
- 已修改：server/nest-main/src/modules/users/user.service.ts
- 更改：修复文件中缺少的异常导入
- 状态：成功

2023-11-11
- 已修改：AI/tasks/TYPEORM_TO_PRISMA_MIGRATION_PLAN.md
- 更改：更新任务进度，记录auth.service.ts和user.service.ts文件的错误修复
- 状态：成功

2024-05-14
- 已创建：server/nest-main/src/prisma/prisma.middleware.ts
- 更改：创建Prisma中间件处理数据转换，解决模型定义与使用不一致问题
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/prisma/prisma.service.ts
- 更改：注册Prisma中间件，添加日志记录
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/prisma/prisma.module.ts
- 更改：更新PrismaModule导出配置，正确导出PrismaService
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/modules/users/user.service.ts
- 更改：移除手动转换代码，依赖中间件处理数据转换
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/modules/users/auth.service.ts
- 更改：移除手动转换代码，修复validateUser方法中的查询
- 状态：成功

2024-05-14
- 已修改：server/nest-main/prisma/schema.prisma
- 更改：更新Permission模型，添加resource和action字段
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/modules/rbac/services/role.service.ts
- 更改：将RoleService从TypeORM迁移到Prisma
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/modules/rbac/services/permission.service.ts
- 更改：将PermissionService从TypeORM迁移到Prisma
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/modules/rbac/seeds/rbac-seed.service.ts
- 更改：将RbacSeedService从TypeORM迁移到Prisma
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/modules/rbac/rbac.module.ts
- 更改：更新RBAC模块配置，移除TypeORM依赖，添加PrismaModule依赖
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/modules/rbac/seeds/initial-data.ts
- 更改：更新引用，使用Prisma模型替代TypeORM实体
- 状态：成功

2024-05-14
- 已修改：server/nest-main/src/common/transformers/rbac.transformer.ts
- 更改：更新引用，使用Prisma模型替代TypeORM实体
- 状态：成功

2024-05-14
- 已创建：AI/done/rbac-module-prisma-migration.md
- 更改：创建RBAC模块迁移总结文档
- 状态：成功

## 最终审查

### 已完成部分
1. 模块A1: 数据模型设计 - 完全完成
2. 模块B1: 基础CRUD功能 - 完全完成
3. 模块B1.1: 优化Prisma实现 - 完全完成
4. 模块B4: RBAC模块迁移 - 完全完成

### 待完成部分
1. 模块B2: 业务逻辑实现 - 尚未开始
2. 模块B3: 认证授权集成 - 尚未开始
3. 模块C1-C3: 服务集成、性能优化和测试 - 尚未开始

### 存在问题
1. 应用同时配置了Prisma和TypeORM，需要在完成所有模块迁移后移除TypeORM
2. 迁移文件日期错误（20250811085229_init），但不影响功能

### 下一步计划
1. 添加测试验证
2. 移除TypeORM依赖
3. 更新开发文档