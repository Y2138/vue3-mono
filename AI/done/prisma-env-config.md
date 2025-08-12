# Prisma 环境配置说明

## 概述

在迁移到 Prisma 后，数据库连接配置得到了简化。Prisma 使用单一的 `DATABASE_URL` 环境变量来配置数据库连接，而不是之前 TypeORM 需要的多个单独配置项。

## 主要变更

### 1. 数据库连接配置简化

**之前 (TypeORM):**
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nest_main
```

**现在 (Prisma):**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_main?schema=public"
```

### 2. 查询日志配置方式变更

**之前 (TypeORM):**
```
ENABLE_QUERY_LOGGING=true
```

**现在 (Prisma):**
Prisma 的日志配置在 `prisma.module.ts` 中通过 PrismaClient 初始化选项设置：

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### 3. 查询性能监控实现方式变更

**之前:**
通过中间件和专门的监控服务实现

**现在:**
通过 Prisma Client Extensions 实现：

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
```

## 更新后的环境变量

### 开发环境 (.env.development)

```
# 数据库配置 (Prisma)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_main?schema=public"

# 日志配置
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
# Prisma 日志配置通过 schema.prisma 的 generator 块或 PrismaClient 初始化时设置
```

### 生产环境 (.env.production)

```
# 数据库配置 (Prisma)
DATABASE_URL="postgresql://user:password@your-production-db-host:5432/nest_main_prod?schema=public"

# 日志配置
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=true
# Prisma 日志配置通过 schema.prisma 的 generator 块或 PrismaClient 初始化时设置
```

## 其他 Prisma 特定配置

### 1. 数据库 URL 格式

```
DATABASE_URL="[数据库类型]://[用户名]:[密码]@[主机]:[端口]/[数据库名]?[参数]"
```

示例：
- PostgreSQL: `postgresql://user:password@localhost:5432/mydb?schema=public`
- MySQL: `mysql://user:password@localhost:3306/mydb`
- SQLite: `file:./dev.db`

### 2. 连接池配置

在 Prisma schema 中配置连接池：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  poolSize  = 20 // 连接池大小
}
```

### 3. 日志级别

在 PrismaClient 初始化时配置：

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
})
```

## 最佳实践

1. **使用环境变量**: 始终通过环境变量提供数据库连接信息，不要硬编码
2. **连接池配置**: 根据应用负载和数据库服务器能力调整连接池大小
3. **日志级别**: 开发环境可启用详细日志，生产环境应仅记录警告和错误
4. **连接字符串安全**: 确保包含凭据的连接字符串不会被提交到版本控制系统
5. **使用 Client Extensions**: 使用 Prisma Client Extensions 实现监控和日志记录，而不是中间件
