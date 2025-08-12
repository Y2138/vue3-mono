# Prisma 使用指南

## 简介

本项目使用 Prisma 作为 ORM 工具，替代了原有的 TypeORM。Prisma 提供了类型安全的数据库访问、自动生成的查询构建器和强大的迁移工具，有助于提高开发效率和代码质量。

## 基础配置

### 环境变量

Prisma 使用 `DATABASE_URL` 环境变量连接数据库，请确保在 `.env` 文件中正确配置：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database?schema=public"
```

### Prisma Schema

Prisma Schema 文件位于 `prisma/schema.prisma`，定义了数据库模型和关系：

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
  userRoles UserRole[]
}

// 其他模型定义...
```

## 使用方法

### 注入 PrismaService

在需要使用 Prisma 的服务中，注入 `PrismaService`：

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  
  // 使用 prisma.client 访问数据库
}
```

### 基本查询操作

#### 查询单条记录

```typescript
// 根据主键查询
const user = await this.prisma.client.user.findUnique({
  where: { phone: '13800138000' },
});

// 根据条件查询第一条记录
const user = await this.prisma.client.user.findFirst({
  where: { username: 'admin' },
});
```

#### 查询多条记录

```typescript
// 查询所有记录
const users = await this.prisma.client.user.findMany();

// 带条件查询
const activeUsers = await this.prisma.client.user.findMany({
  where: { isActive: true },
});

// 分页查询
const pagedUsers = await this.prisma.client.user.findMany({
  skip: 10,
  take: 20,
});

// 排序
const sortedUsers = await this.prisma.client.user.findMany({
  orderBy: { createdAt: 'desc' },
});
```

#### 包含关联数据

```typescript
// 包含用户角色
const userWithRoles = await this.prisma.client.user.findUnique({
  where: { phone: '13800138000' },
  include: { userRoles: true },
});

// 包含嵌套关联
const userWithRolesAndPermissions = await this.prisma.client.user.findUnique({
  where: { phone: '13800138000' },
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    },
  },
});
```

### 创建、更新和删除

#### 创建记录

```typescript
const newUser = await this.prisma.client.user.create({
  data: {
    phone: '13800138000',
    username: 'newuser',
    password: 'hashedpassword',
    isActive: true,
    userRoles: {
      create: [{
        role: {
          connect: { id: 'role-id' },
        },
      }],
    },
  },
});
```

#### 更新记录

```typescript
const updatedUser = await this.prisma.client.user.update({
  where: { phone: '13800138000' },
  data: {
    username: 'updatedname',
    isActive: false,
  },
});
```

#### 删除记录

```typescript
const deletedUser = await this.prisma.client.user.delete({
  where: { phone: '13800138000' },
});
```

### 事务

```typescript
const result = await this.prisma.client.$transaction(async (tx) => {
  // 在事务中执行多个操作
  const user = await tx.user.create({
    data: { /* ... */ },
  });
  
  const role = await tx.role.update({
    where: { id: 'role-id' },
    data: { /* ... */ },
  });
  
  return { user, role };
});
```

## 性能优化

### 查询优化

1. **避免过度嵌套查询**：深层嵌套查询会导致性能问题，尽量使用多个查询替代。

2. **使用 select 选择必要字段**：只选择需要的字段可以减少数据传输量。

   ```typescript
   const user = await this.prisma.client.user.findUnique({
     where: { phone: '13800138000' },
     select: {
       phone: true,
       username: true,
       isActive: true,
     },
   });
   ```

3. **批量操作**：使用 `createMany`、`updateMany` 和 `deleteMany` 进行批量操作。

   ```typescript
   const result = await this.prisma.client.user.updateMany({
     where: { isActive: false },
     data: { lastLoginAt: null },
   });
   ```

4. **合理使用 include**：只包含必要的关联数据。

### 性能监控

项目使用 Prisma Client Extensions 进行性能监控：

- 慢查询（>100ms）会在日志中以警告级别记录
- 开发环境下所有查询都会记录调试信息
- 可通过查看日志文件分析性能问题

性能监控通过 `Prisma.defineExtension` 实现，而非废弃的 `$use` API：

```typescript
const loggerExtension = Prisma.defineExtension({
  name: 'loggerExtension',
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const duration = Date.now() - start;
        
        if (duration > 100) {
          console.warn(`慢查询: ${model}.${operation} - ${duration}ms`);
        }
        
        return result;
      }
    }
  }
});

// 使用扩展
const prisma = new PrismaClient().$extends(loggerExtension);
```

如需更详细的监控，可以考虑：
1. 使用 ELK 或其他日志分析工具处理 Prisma 日志
2. 集成 Prometheus + Grafana 等监控方案

## 迁移管理

### 创建迁移

```bash
npx prisma migrate dev --name migration_name
```

### 应用迁移

```bash
npx prisma migrate deploy
```

### 重置数据库

```bash
npx prisma migrate reset
```

## 最佳实践

1. **保持简单架构**：避免过度工程化，直接在业务代码中优化查询结构。

2. **使用 Client Extensions**：项目使用 Prisma Client Extensions 而非废弃的 `$use` API 实现功能扩展。

3. **使用扩展处理数据转换**：项目已配置扩展处理 `userRoles` 到 `roles` 的转换，无需手动处理。

4. **避免直接修改 Prisma Schema**：修改数据模型时，应创建迁移而不是直接修改 Schema。

5. **使用 PrismaService 而非直接使用 PrismaClient**：PrismaService 提供了额外的功能和基础监控。

6. **处理异常**：始终处理 Prisma 查询可能抛出的异常。

7. **使用 TypeScript 类型**：利用 Prisma 生成的类型定义，确保类型安全。

8. **优化查询结构**：在定义查询时直接优化查询结构和层级，而不是依赖复杂的中间件。

9. **扩展顺序**：多个扩展应用时注意顺序，先应用通用扩展（如日志），再应用特定功能扩展。

## 常见问题

### Q: 如何处理关系数据？

A: 使用 `include` 查询关系数据，使用 `connect`、`disconnect`、`create` 等操作关系。

### Q: 如何优化慢查询？

A: 使用 `select` 只选择必要字段，添加适当的索引，避免深层嵌套查询，使用性能监控工具分析查询性能。

### Q: 如何处理大量数据？

A: 使用分页查询，批量操作，避免一次加载过多数据。

## 参考资源

- [Prisma 官方文档](https://www.prisma.io/docs/)
- [Prisma 与 NestJS 集成](https://docs.nestjs.com/recipes/prisma)
- [Prisma 性能优化指南](https://www.prisma.io/docs/guides/performance-and-optimization)
