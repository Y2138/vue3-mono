# Permission 模型字段缺失修复

## 问题描述

在启动 NestJS 应用程序时，遇到以下错误：

```
Invalid `this.prisma.client.permission.findFirst()` invocation in
/Users/staff/Documents/my-tools/vue3-mono/server/nest-main/src/modules/rbac/seeds/rbac-seed.service.ts:23:70

The column `Permission.resource` does not exist in the current database.
```

这个错误表明数据库中的 Permission 表缺少 resource 字段，而代码中尝试访问这个不存在的字段。

## 问题分析

通过检查代码和数据库结构，发现以下问题：

1. **Prisma schema 与数据库不一致**：
   - Prisma schema 中的 Permission 模型定义了 resource 和 action 字段
   - 但实际数据库中的 Permission 表没有这些字段

2. **可能的原因**：
   - Prisma schema 被更新后没有运行迁移
   - 或者数据库是从旧版本的 schema 创建的，没有包含这些字段

## 解决方案

运行 Prisma 迁移来更新数据库结构，添加缺失的字段：

```bash
npx prisma migrate dev --name add_resource_action_to_permission
```

这个命令执行了以下操作：

1. 创建了一个新的迁移文件：`20250821080611_add_resource_action_to_permission/migration.sql`
2. 该迁移文件包含以下 SQL 语句：

```sql
-- AlterTable
ALTER TABLE "public"."Permission" ADD COLUMN "action" TEXT NOT NULL,
ADD COLUMN "resource" TEXT NOT NULL;
```

3. 应用迁移到数据库，添加了缺失的字段
4. 重新生成了 Prisma 客户端

## 修复原理

1. **数据库结构同步**：
   - 通过 Prisma 迁移，将数据库结构与 Prisma schema 同步
   - 添加了缺失的 resource 和 action 字段到 Permission 表

2. **注意事项**：
   - 由于添加的是非空字段，如果表中已有数据，可能需要提供默认值
   - 在这种情况下，如果 Permission 表中已有数据，可能需要手动更新这些记录，为新字段提供值

## 建议

1. **保持迁移同步**：
   - 每次修改 Prisma schema 后，都应该运行 `prisma migrate dev` 来更新数据库结构
   - 或者使用 `prisma db push` 在开发环境快速同步结构（不推荐用于生产环境）

2. **版本控制**：
   - 将 Prisma 迁移文件纳入版本控制
   - 这样可以跟踪数据库结构的变化历史

3. **环境一致性**：
   - 确保开发、测试和生产环境的数据库结构保持一致
   - 使用相同的迁移流程在所有环境中应用更改

通过这些修改，应用程序现在可以正确访问 Permission 表中的 resource 和 action 字段，解决了原来的错误。
