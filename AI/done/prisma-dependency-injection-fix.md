# Prisma 依赖注入问题修复

## 问题描述

在启动 NestJS 应用程序时，遇到以下错误：

```
ERROR [ExceptionHandler] UndefinedDependencyException [Error]: Nest can't resolve dependencies of the PrismaService (?). Please make sure that the argument dependency at index [0] is available in the PrismaModule context.
```

这个错误表明 NestJS 无法解析 PrismaService 的依赖项。

## 问题分析

通过检查代码，发现以下问题：

1. **复杂的依赖注入方式**：PrismaModule 使用了令牌 (token) 注入方式，通过 `PRISMA_CLIENT` 令牌提供 PrismaClient 实例
2. **环境变量问题**：.env 文件中的 DATABASE_URL 末尾有一个多余的百分号 `%`，可能导致 Prisma 无法正确解析连接字符串

## 解决方案

### 1. 修复环境变量

移除 .env 文件中 DATABASE_URL 末尾的多余百分号：

```diff
- DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest?schema=public"%
+ DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest?schema=public"
```

### 2. 简化 Prisma 依赖注入

修改 PrismaModule 和 PrismaService 的实现，采用更简单的依赖注入方式：

#### 修改 PrismaModule (prisma.module.ts)

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

#### 修改 PrismaService (prisma.service.ts)

```typescript
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { userRoleExtension } from './prisma.middleware';

// 定义日志监控扩展
const loggerExtension = Prisma.defineExtension({
  // ... 保持原有代码不变
});

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private extendedPrisma: any;
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // 先应用日志监控扩展，再应用用户角色转换扩展
    this.extendedPrisma = this.prisma
      .$extends(loggerExtension)
      .$extends(userRoleExtension);
    
    this.logger.log('Prisma Client 已初始化并应用扩展');
  }

  // ... 保持其他方法不变
}
```

## 修复原理

1. **简化依赖注入**：
   - 移除了复杂的令牌注入方式
   - 直接在 PrismaService 构造函数中创建 PrismaClient 实例
   - 这样避免了 NestJS 依赖解析器需要处理复杂的依赖关系

2. **环境变量修复**：
   - 确保 DATABASE_URL 格式正确，没有多余字符
   - 这样 Prisma 可以正确解析连接字符串

## 建议

1. **简化设计**：在可能的情况下，尽量使用简单的依赖注入模式
2. **环境变量检查**：定期检查环境变量的格式是否正确
3. **错误处理**：为 Prisma 连接添加更好的错误处理，以便在连接失败时提供更明确的错误信息

通过这些修改，应用程序现在可以正常启动，PrismaService 可以被正确注入到需要它的服务中。
