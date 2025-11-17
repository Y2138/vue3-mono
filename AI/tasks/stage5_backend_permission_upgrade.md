# 阶段5：后端权限改造执行计划

## 任务描述
完全重新实现后端权限认证系统，实现基于URL的自动权限码生成和管理，构建企业级的权限认证架构。重点实现权限认证守卫、权限装饰器，并集成到NestJS的路由和控制器中。

## 背景分析
- 阶段1-4已完成资源管理和角色管理功能
- 需要基于URL自动计算权限码，无需手动配置
- 原有的rbac模块需要完全删除重新实现
- 需要实现统一的后端权限认证架构
- 重点支持前端权限组件和指令的后端数据支持

## 核心需求
1. 删除现有rbac模块，重新构建
2. 实现基于URL的自动权限码生成
3. 实现权限认证守卫（AuthGuard和PermissionGuard）
4. 实现权限装饰器（@RequirePermission等）
5. 实现权限检查服务（PermissionService）
6. 实现资源权限映射（ResourcePermissionService）
7. 实现权限缓存机制
8. 集成到所有业务模块
9. 实现权限验证API接口
10. 支持动态权限检查

## 详细实施计划

### 1. 删除现有rbac模块
**目标**: 完全清理并重建rbac模块

**具体任务**:
- [ ] 备份现有rbac模块数据（如果需要）
- [ ] 删除server/nest-main/src/modules/rbac目录
- [ ] 删除rbac相关的Controller文件
- [ ] 删除rbac相关的Service文件
- [ ] 删除rbac相关的Module文件
- [ ] 清理rbac模块相关的引用
- [ ] 清理rbac路由配置
- [ ] 更新app.module.ts

**清理范围**:
- 完整删除rbac模块
- 清理PrismaService中rbac相关方法
- 清理全局模块中rbac相关引用
- 更新其他模块中rbac的依赖

### 2. 新建rbac模块架构
**目标**: 设计并实现全新的rbac模块架构

**具体任务**:
- [ ] 设计新的rbac模块目录结构
- [ ] 设计权限认证的层级关系
- [ ] 设计权限检查的策略模式
- [ ] 设计权限缓存机制
- [ ] 设计权限验证的流程

**新模块结构**:
```
server/nest-main/src/modules/rbac/
├── core/                      # 核心权限组件
│   ├── auth.guard.ts          # 认证守卫
│   ├── permission.guard.ts    # 权限守卫
│   ├── decorators/            # 权限装饰器
│   │   ├── require-permission.decorator.ts
│   │   ├── require-role.decorator.ts
│   │   └── public.decorator.ts
│   └── interfaces/            # 权限相关接口
│       ├── permission.interface.ts
│       ├── resource.interface.ts
│       └── role.interface.ts
├── services/                  # 权限服务层
│   ├── permission.service.ts  # 权限检查服务
│   ├── resource.service.ts    # 资源管理服务
│   ├── role.service.ts        # 角色管理服务
│   ├── cache.service.ts       # 权限缓存服务
│   └── permission-mapper.service.ts # 权限映射服务
├── dto/                       # 数据传输对象
│   ├── permission-check.dto.ts
│   ├── role-permission.dto.ts
│   └── resource-permission.dto.ts
├── controllers/               # 权限控制器
│   ├── permission.controller.ts
│   ├── role.controller.ts
│   └── resource.controller.ts
├── middleware/                # 权限中间件
│   ├── permission.middleware.ts
│   └── audit.middleware.ts
├── constants/                 # 常量定义
│   ├── permissions.constants.ts
│   ├── resources.constants.ts
│   └── actions.constants.ts
├── utils/                     # 权限工具
│   ├── permission-utils.ts
│   ├── resource-utils.ts
│   └── url-parser.utils.ts
└── rbac.module.ts             # 主模块文件
```

### 3. 权限认证守卫实现
**目标**: 实现核心的权限认证守卫

**具体任务**:
- [ ] 实现JwtAuthGuard（认证守卫）
- [ ] 实现PermissionGuard（权限守卫）
- [ ] 实现RoleGuard（角色守卫）
- [ ] 实现动态权限检查
- [ ] 实现权限缓存检查
- [ ] 实现权限继承逻辑

**⚠️ 重要：proto文件接口定义要求**
- 所有权限相关API接口必须在 `protos/rbac.proto` 中定义
- 后端服务实现完全遵循 proto 中定义的 RPC 规范
- 前后端类型完全依赖 proto 文件生成，类型定义统一
- 权限验证相关RPC方法：
  - `VerifyPermission` (验证权限)
  - `VerifyResourceAccess` (验证资源访问)
  - `GetUserPermissions` (获取用户权限)
  - `GetResourcePermissionCode` (获取资源权限码)
  - `CheckMultiplePermissions` (批量验证权限)

**AuthGuard实现**:
```typescript
// JwtAuthGuard - 基础认证守卫 - 对应 proto 中的 VerifyTokenRequest/Response
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly cacheService: PermissionCacheService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractToken(request)
    
    if (!token) {
      throw new UnauthorizedException('未提供认证令牌')
    }

    const payload = await this.authService.validateToken(token)
    if (!payload) {
      throw new UnauthorizedException('无效的认证令牌')
    }

    // 获取用户信息并附加到请求对象
    request.user = await this.authService.getUserById(payload.sub)
    return true
  }

  private extractToken(request: any): string | null {
    const authorization = request.headers['authorization']
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7)
    }
    return null
  }
}
```

**PermissionGuard实现**:
```typescript
// PermissionGuard - 权限验证守卫
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly resourceService: ResourceService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    
    if (!user) {
      throw new UnauthorizedException('用户未认证')
    }

    // 获取控制器和方法装饰器定义的权限要求
    const handler = context.getHandler()
    const class_ = context.getClass()
    
    const requiredPermissions = this.getRequiredPermissions(handler, class_)
    if (requiredPermissions.length === 0) {
      return true // 公共接口
    }

    // 提取URL信息
    const url = this.extractUrl(request)
    const method = request.method.toUpperCase()

    // 计算权限码
    const permissionCode = await this.calculatePermissionCode(url, method)
    
    // 检查用户权限
    const hasPermission = await this.permissionService.checkUserPermission(
      user.id,
      permissionCode
    )

    if (!hasPermission) {
      throw new ForbiddenException(`缺少权限: ${permissionCode}`)
    }

    return true
  }

  private extractUrl(request: any): string {
    return request.route?.path || request.originalUrl
  }

  private async calculatePermissionCode(url: string, method: string): Promise<string> {
    return this.resourceService.generatePermissionCode(url, method)
  }

  private getRequiredPermissions(handler: any, class_: any): string[] {
    const classPermissions = Reflect.getMetadata('permissions', class_) || []
    const methodPermissions = Reflect.getMetadata('permissions', handler) || []
    return [...classPermissions, ...methodPermissions]
  }
}
```

### 4. 权限装饰器实现
**目标**: 提供灵活的权限装饰器API

**具体任务**:
- [ ] 实现@RequirePermission装饰器
- [ ] 实现@RequireRole装饰器
- [ ] 实现@Public装饰器
- [ ] 实现@RequireAnyPermission装饰器
- [ ] 实现@RequireAllPermissions装饰器
- [ ] 实现装饰器参数验证

**装饰器实现**:
```typescript
// @RequirePermission - 单个权限要求
export function RequirePermission(
  url: string,
  action?: 'GET' | 'POST' | 'PUT' | 'DELETE'
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    Reflect.defineMetadata('permissions', [{ url, action }], method)
    return descriptor
  }
}

// @RequireRole - 角色要求
export function RequireRole(role: string | string[]): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const roles = Array.isArray(role) ? role : [role]
    Reflect.defineMetadata('roles', roles, method)
    return descriptor
  }
}

// @Public - 公开接口
export function Public(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    Reflect.defineMetadata('isPublic', true, method)
    return descriptor
  }
}

// @RequireAnyPermission - 任一权限要求
export function RequireAnyPermission(
  permissions: Array<{ url: string; action?: string }>
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    Reflect.defineMetadata('anyPermissions', permissions, method)
    return descriptor
  }
}

// @RequireAllPermissions - 所有权限要求
export function RequireAllPermissions(
  permissions: Array<{ url: string; action?: string }>
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    Reflect.defineMetadata('allPermissions', permissions, method)
    return descriptor
  }
}
```

### 5. 权限服务层实现
**目标**: 实现核心的权限检查和管理服务

**具体任务**:
- [ ] 实现PermissionService权限检查服务
- [ ] 实现ResourceService资源管理服务
- [ ] 实现RoleService角色管理服务
- [ ] 实现PermissionCacheService缓存服务
- [ ] 实现PermissionMapperService映射服务

**PermissionService实现**:
```typescript
@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: PermissionCacheService,
    private readonly resourceService: ResourceService
  ) {}

  /**
   * 检查用户是否具有指定权限
   */
  async checkUserPermission(
    userId: string,
    permissionCode: string
  ): Promise<boolean> {
    // 先检查缓存
    const cached = await this.cacheService.getUserPermission(userId, permissionCode)
    if (cached !== null) {
      return cached
    }

    // 从数据库查询用户权限
    const hasPermission = await this.queryUserPermission(userId, permissionCode)
    
    // 缓存结果（设置过期时间）
    await this.cacheService.setUserPermission(userId, permissionCode, hasPermission)
    
    return hasPermission
  }

  /**
   * 检查用户是否具有任一权限
   */
  async checkUserAnyPermission(
    userId: string,
    permissionCodes: string[]
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      if (await this.checkUserPermission(userId, code)) {
        return true
      }
    }
    return false
  }

  /**
   * 检查用户是否具有所有权限
   */
  async checkUserAllPermissions(
    userId: string,
    permissionCodes: string[]
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      if (!await this.checkUserPermission(userId, code)) {
        return false
      }
    }
    return true
  }

  /**
   * 获取用户所有权限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const cached = await this.cacheService.getUserAllPermissions(userId)
    if (cached) {
      return cached
    }

    const permissions = await this.queryUserAllPermissions(userId)
    await this.cacheService.setUserAllPermissions(userId, permissions)
    
    return permissions
  }

  /**
   * 清除用户权限缓存
   */
  async invalidateUserPermissionCache(userId: string): Promise<void> {
    await this.cacheService.invalidateUserCache(userId)
  }

  private async queryUserPermission(userId: string, permissionCode: string): Promise<boolean> {
    const result = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          select: {
            role: {
              select: {
                permissions: {
                  where: {
                    resource: {
                      permission_code: permissionCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    return result?.roles?.some(userRole => 
      userRole.role.permissions?.length > 0
    ) || false
  }

  private async queryUserAllPermissions(userId: string): Promise<string[]> {
    const result = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          select: {
            role: {
              select: {
                permissions: {
                  select: {
                    resource: {
                      select: {
                        permission_code: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const permissionSet = new Set<string>()
    result?.roles?.forEach(userRole => {
      userRole.role.permissions?.forEach(permission => {
        if (permission.resource?.permission_code) {
          permissionSet.add(permission.resource.permission_code)
        }
      })
    })

    return Array.from(permissionSet)
  }
}
```

### 6. 资源权限映射服务
**目标**: 实现基于URL的权限码自动生成和映射

**具体任务**:
- [ ] 实现URL解析和权限码生成
- [ ] 实现HTTP方法映射
- [ ] 实现权限码标准化
- [ ] 实现权限映射缓存
- [ ] 实现权限继承机制

**ResourceService实现**:
```typescript
@Injectable()
export class ResourceService {
  private readonly methodActionMap = {
    'GET': 'VIEW',
    'POST': 'CREATE', 
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  }

  /**
   * 基于URL和方法生成权限码
   */
  async generatePermissionCode(url: string, method: string): Promise<string> {
    // 标准化URL
    const normalizedUrl = this.normalizeUrl(url)
    
    // 获取操作类型
    const action = this.methodActionMap[method.toUpperCase()] || 'VIEW'
    
    // 缓存键
    const cacheKey = `${normalizedUrl}:${action}`
    
    // 检查缓存
    const cached = await this.cacheService.getPermissionCode(cacheKey)
    if (cached) {
      return cached
    }

    // 查询或创建资源
    const resource = await this.findOrCreateResource(normalizedUrl, method)
    
    // 生成权限码
    const permissionCode = `${action}:${resource.id}`
    
    // 缓存结果
    await this.cacheService.setPermissionCode(cacheKey, permissionCode)
    
    return permissionCode
  }

  /**
   * 获取资源树
   */
  async getResourceTree(): Promise<any[]> {
    const resources = await this.prisma.resource.findMany({
      where: { is_active: true },
      include: {
        children: {
          where: { is_active: true },
          include: {
            children: {
              where: { is_active: true }
            }
          }
        }
      },
      orderBy: [
        { parent_id: 'asc' },
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    })

    return resources.map(resource => this.formatResourceTreeNode(resource))
  }

  /**
   * 根据权限码获取资源信息
   */
  async getResourceByPermissionCode(permissionCode: string): Promise<Resource | null> {
    const [action, resourceId] = permissionCode.split(':', 2)
    if (!resourceId) {
      return null
    }

    return await this.prisma.resource.findUnique({
      where: { id: resourceId }
    })
  }

  private normalizeUrl(url: string): string {
    // 移除查询参数
    const urlObj = new URL(url, 'http://localhost')
    let path = urlObj.pathname
    
    // 参数化ID路径
    path = path.replace(/\/\d+/g, '/:id')
    path = path.replace(/\/[\w-]+\/(\d+)/g, '/$1/:id')
    
    // 移除尾部的/
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1)
    }
    
    return path
  }

  private async findOrCreateResource(url: string, method: string): Promise<Resource> {
    // 查找现有资源
    let resource = await this.prisma.resource.findFirst({
      where: { 
        url: url,
        http_method: method.toUpperCase(),
        is_active: true
      }
    })

    if (!resource) {
      // 创建新资源
      resource = await this.prisma.resource.create({
        data: {
          name: this.generateResourceName(url),
          url: url,
          http_method: method.toUpperCase(),
          permission_code: `${method.toUpperCase()}:${url}`,
          is_active: true,
          sort_order: 0
        }
      })
    }

    return resource
  }

  private generateResourceName(url: string): string {
    const segments = url.split('/').filter(s => s && !s.startsWith(':'))
    const lastSegment = segments[segments.length - 1] || 'root'
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  private formatResourceTreeNode(resource: any): any {
    return {
      key: resource.id,
      label: resource.name,
      url: resource.url,
      icon: resource.icon,
      type: resource.resource_type,
      children: resource.children?.map(child => this.formatResourceTreeNode(child)) || []
    }
  }
}
```

### 7. 权限缓存服务
**目标**: 实现高效的权限数据缓存机制

**具体任务**:
- [ ] 实现Redis缓存集成
- [ ] 实现缓存键设计
- [ ] 实现缓存过期策略
- [ ] 实现缓存预热机制
- [ ] 实现缓存失效策略

**CacheService实现**:
```typescript
@Injectable()
export class PermissionCacheService {
  private readonly cachePrefix = 'rbac:permission'
  private readonly defaultTTL = 300 // 5分钟

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  /**
   * 获取用户权限
   */
  async getUserPermission(userId: string, permissionCode: string): Promise<boolean | null> {
    const key = `${this.cachePrefix}:user:${userId}:${permissionCode}`
    return await this.cacheManager.get(key)
  }

  /**
   * 设置用户权限
   */
  async setUserPermission(
    userId: string, 
    permissionCode: string, 
    hasPermission: boolean
  ): Promise<void> {
    const key = `${this.cachePrefix}:user:${userId}:${permissionCode}`
    await this.cacheManager.set(key, hasPermission, this.defaultTTL)
  }

  /**
   * 获取用户所有权限
   */
  async getUserAllPermissions(userId: string): Promise<string[] | null> {
    const key = `${this.cachePrefix}:user:${userId}:all`
    return await this.cacheManager.get(key)
  }

  /**
   * 设置用户所有权限
   */
  async setUserAllPermissions(userId: string, permissions: string[]): Promise<void> {
    const key = `${this.cachePrefix}:user:${userId}:all`
    await this.cacheManager.set(key, permissions, this.defaultTTL)
  }

  /**
   * 获取权限码映射
   */
  async getPermissionCode(cacheKey: string): Promise<string | null> {
    const key = `${this.cachePrefix}:code:${cacheKey}`
    return await this.cacheManager.get(key)
  }

  /**
   * 设置权限码映射
   */
  async setPermissionCode(cacheKey: string, permissionCode: string): Promise<void> {
    const key = `${this.cachePrefix}:code:${cacheKey}`
    await this.cacheManager.set(key, permissionCode, 600) // 10分钟
  }

  /**
   * 失效用户缓存
   */
  async invalidateUserCache(userId: string): Promise<void> {
    // 删除用户所有权限缓存
    const pattern = `${this.cachePrefix}:user:${userId}:*`
    await this.deleteByPattern(pattern)
  }

  /**
   * 预热用户权限缓存
   */
  async warmupUserCache(userId: string): Promise<void> {
    // 在权限服务中调用
  }

  private async deleteByPattern(pattern: string): Promise<void> {
    // Redis通配符删除
    const keys = await this.cacheManager.store.keys(pattern)
    if (keys.length > 0) {
      await this.cacheManager.store.del(...keys)
    }
  }
}
```

### 8. 权限中间件实现
**目标**: 实现权限相关的中间件支持

**具体任务**:
- [ ] 实现权限检查中间件
- [ ] 实现审计日志中间件
- [ ] 实现权限变更通知中间件
- [ ] 实现性能监控中间件

**PermissionMiddleware实现**:
```typescript
@Injectable()
export class PermissionMiddleware implements NestMiddleware {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly auditService: AuditService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now()
    
    // 记录请求开始
    await this.auditService.logRequestStart(req)
    
    // 包装response，监听结束事件
    const originalEnd = res.end
    res.end = async (...args: any[]) => {
      const duration = Date.now() - startTime
      
      // 记录请求完成
      await this.auditService.logRequestComplete({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userId: (req as any).user?.id
      })
      
      originalEnd.apply(res, args)
    }
    
    next()
  }
}
```

### 9. 权限控制器实现
**目标**: 提供权限管理的API接口

**具体任务**:
- [ ] 实现PermissionController权限控制器
- [ ] 实现RoleController角色控制器
- [ ] 实现ResourceController资源控制器
- [ ] 实现权限检查API
- [ ] 实现权限统计API

**PermissionController实现**:
```typescript
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly resourceService: ResourceService
  ) {}

  /**
   * 检查用户权限
   */
  @Post('check')
  @UseGuards(JwtAuthGuard)
  async checkPermission(
    @Body() dto: PermissionCheckDto,
    @CurrentUser() user: User
  ): Promise<{ hasPermission: boolean; permissionCode: string }> {
    const { url, method } = dto
    
    // 生成权限码
    const permissionCode = await this.resourceService.generatePermissionCode(url, method)
    
    // 检查权限
    const hasPermission = await this.permissionService.checkUserPermission(
      user.id, 
      permissionCode
    )
    
    return {
      hasPermission,
      permissionCode
    }
  }

  /**
   * 获取用户所有权限
   */
  @Get('user/permissions')
  @UseGuards(JwtAuthGuard)
  async getUserPermissions(@CurrentUser() user: User): Promise<string[]> {
    return await this.permissionService.getUserPermissions(user.id)
  }

  /**
   * 获取资源树
   */
  @Get('resources/tree')
  async getResourceTree(): Promise<any[]> {
    return await this.resourceService.getResourceTree()
  }

  /**
   * 批量检查用户权限
   */
  @Post('check/batch')
  @UseGuards(JwtAuthGuard)
  async checkBatchPermissions(
    @Body() dto: BatchPermissionCheckDto,
    @CurrentUser() user: User
  ): Promise<Array<{ url: string; method: string; hasPermission: boolean }>> {
    const results = []
    
    for (const { url, method } of dto.checks) {
      const permissionCode = await this.resourceService.generatePermissionCode(url, method)
      const hasPermission = await this.permissionService.checkUserPermission(
        user.id,
        permissionCode
      )
      
      results.push({
        url,
        method,
        hasPermission
      })
    }
    
    return results
  }
}
```

### 10. 权限常量定义
**目标**: 定义权限相关的常量和枚举

**具体任务**:
- [ ] 定义权限常量
- [ ] 定义资源类型
- [ ] 定义操作类型
- [ ] 定义缓存键常量

**常量实现**:
```typescript
// 资源类型枚举
export enum ResourceType {
  MENU = 'MENU',
  PAGE = 'PAGE',
  API = 'API',
  BUTTON = 'BUTTON'
}

// 操作类型枚举
export enum ActionType {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT'
}

// HTTP方法映射
export const HTTP_METHOD_ACTION_MAP = {
  'GET': ActionType.VIEW,
  'POST': ActionType.CREATE,
  'PUT': ActionType.UPDATE,
  'PATCH': ActionType.UPDATE,
  'DELETE': ActionType.DELETE
}

// 缓存键前缀
export const CACHE_KEYS = {
  USER_PERMISSION: 'rbac:permission:user',
  USER_ALL_PERMISSIONS: 'rbac:permission:user:all',
  PERMISSION_CODE: 'rbac:permission:code',
  RESOURCE_TREE: 'rbac:resource:tree'
} as const

// 默认角色权限
export const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: ['*'], // 管理员拥有所有权限
  USER: [], // 普通用户无特殊权限
  GUEST: [] // 访客用户无权限
} as const
```

### 11. 权限工具类
**目标**: 提供权限相关的工具函数

**具体任务**:
- [ ] 实现URL解析工具
- [ ] 实现权限码生成工具
- [ ] 实现权限验证工具
- [ ] 实现权限继承工具

**工具实现**:
```typescript
export class PermissionUtils {
  /**
   * 解析URL为权限码
   */
  static parseUrlToPermissionCode(url: string, method: string): string {
    const normalizedUrl = this.normalizeUrl(url)
    const action = this.getActionByMethod(method)
    return `${action}:${normalizedUrl}`
  }

  /**
   * 标准化URL
   */
  static normalizeUrl(url: string): string {
    const urlObj = new URL(url, 'http://localhost')
    let path = urlObj.pathname
    
    // 参数化动态路径
    path = path.replace(/\/\d+/g, '/:id')
    path = path.replace(/\/[\w-]+\/(\d+)/g, '/$1/:id')
    
    // 移除尾部斜杠
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1)
    }
    
    return path
  }

  /**
   * 根据HTTP方法获取操作类型
   */
  static getActionByMethod(method: string): string {
    const actionMap = {
      'GET': 'VIEW',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    }
    return actionMap[method.toUpperCase()] || 'VIEW'
  }

  /**
   * 检查权限码是否匹配
   */
  static matchPermissionCode(
    userPermission: string,
    requiredPermission: string
  ): boolean {
    if (userPermission === '*') {
      return true // 超级管理员
    }
    
    const [userAction, userResource] = userPermission.split(':', 2)
    const [requiredAction, requiredResource] = requiredPermission.split(':', 2)
    
    // 资源匹配
    if (userResource !== requiredResource) {
      return false
    }
    
    // 权限级别检查
    const actionLevel = {
      'VIEW': 1,
      'CREATE': 2,
      'UPDATE': 2,
      'DELETE': 3,
      'MANAGE': 4
    }
    
    const userLevel = actionLevel[userAction] || 0
    const requiredLevel = actionLevel[requiredAction] || 0
    
    return userLevel >= requiredLevel
  }
}
```

### 12. 权限异常处理
**目标**: 实现权限相关的异常处理

**具体任务**:
- [ ] 实现权限异常类
- [ ] 实现权限异常过滤器
- [ ] 实现权限错误响应格式
- [ ] 实现权限审计日志

**异常实现**:
```typescript
// 权限异常类
export class PermissionException extends HttpException {
  constructor(
    message: string,
    permissionCode?: string,
    statusCode: number = HttpStatus.FORBIDDEN
  ) {
    super(
      {
        error: 'PERMISSION_DENIED',
        message,
        permissionCode
      },
      statusCode
    )
  }
}

// 权限过滤器
@Catch(PermissionException)
export class PermissionExceptionFilter implements ExceptionFilter {
  catch(exception: PermissionException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()

    response.status(status).json({
      success: false,
      error: {
        code: 'PERMISSION_DENIED',
        message: exception.message,
        details: exception.getResponse()
      },
      timestamp: new Date().toISOString()
    })
  }
}
```

### 13. 集成到应用模块
**目标**: 将权限系统集成到NestJS应用

**具体任务**:
- [ ] 更新app.module.ts注册rbac模块
- [ ] 配置全局权限守卫
- [ ] 配置权限中间件
- [ ] 配置权限异常过滤器
- [ ] 集成缓存模块

**应用集成**:
```typescript
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5分钟默认TTL
    }),
    RbacModule,
    // ... 其他模块
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    },
    {
      provide: APP_FILTER,
      useClass: PermissionExceptionFilter
    }
  ]
})
export class AppModule {}
```

### 14. 数据库迁移和种子
**目标**: 创建数据库迁移和初始数据

**具体任务**:
- [ ] 设计rbac相关的数据库表结构
- [ ] 创建数据库迁移文件
- [ ] 实现数据种子
- [ ] 实现数据验证

**迁移设计**:
- 用户表(user): 包含用户基础信息和角色关联
- 角色表(role): 角色定义
- 权限表(permission): 权限定义
- 资源表(resource): 资源定义
- 用户角色关联表(user_role)
- 角色权限关联表(role_permission)

### 15. 性能优化
**目标**: 确保权限系统的高性能

**具体任务**:
- [ ] 实现权限查询优化
- [ ] 实现缓存策略优化
- [ ] 实现数据库索引优化
- [ ] 实现权限预加载
- [ ] 实现权限批量检查

**优化策略**:
- 权限查询使用join而非子查询
- 常用权限数据预加载
- 权限缓存分层设计
- 权限检查批量优化

## 实施清单
1. [ ] 删除现有rbac模块
2. [ ] 设计新的rbac模块架构
3. [ ] 实现权限认证守卫
4. [ ] 实现权限装饰器
5. [ ] 实现权限服务层
6. [ ] 实现资源权限映射服务
7. [ ] 实现权限缓存服务
8. [ ] 实现权限中间件
9. [ ] 实现权限控制器
10. [ ] 实现权限常量定义
11. [ ] 实现权限工具类
12. [ ] 实现权限异常处理
13. [ ] 集成到应用模块
14. [ ] 数据库迁移和种子
15. [ ] 性能优化

## 技术栈
- **框架**: NestJS 11+
- **数据库**: PostgreSQL + Prisma
- **缓存**: Redis + cache-manager
- **认证**: JWT + Passport
- **类型系统**: TypeScript 5.9.2
- **工具库**: bcryptjs, class-validator等

## 技术风险
1. **权限查询性能**: 大量权限数据时的查询性能
   - 风险：高
   - 缓解：缓存机制、查询优化、索引优化
2. **权限一致性**: 权限变更后的缓存一致性问题
   - 风险：中
   - 缓解：缓存失效策略、实时更新机制
3. **权限复杂性**: 多级权限继承和组合的复杂性
   - 风险：中
   - 缓解：清晰的数据模型、完善的测试
4. **并发安全性**: 权限检查的并发安全性
   - 风险：中
   - 缓解：事务处理、乐观锁
5. **数据库压力**: 频繁的权限查询对数据库的压力
   - 风险：中
   - 缓解：缓存机制、查询优化

## 验收标准
1. 权限认证守卫正确工作
2. 权限装饰器API完善可用
3. 基于URL的权限码自动生成正确
4. 权限检查性能满足要求
5. 权限缓存机制正确有效
6. 所有API接口权限控制正常
7. 权限异常处理完善
8. 数据库迁移成功
9. 权限审计日志完整
10. 代码质量符合项目规范

## 时间估算
- 总计：5-6个工作日
- 模块删除和重建：0.5天
- 权限守卫和装饰器：1.5天
- 权限服务层实现：1.5天
- 权限控制器和API：1天
- 数据库迁移和集成：1天
- 测试和优化：1-1.5天

## 与前端集成
### 为阶段6准备的接口
1. **权限检查接口**: `/api/permissions/check` - 前端权限组件使用
2. **用户权限获取**: `/api/permissions/user/permissions` - 路由守卫使用
3. **资源树获取**: `/api/permissions/resources/tree` - 权限树组件使用
4. **批量权限检查**: `/api/permissions/check/batch` - 指令使用

### 权限数据格式
权限码格式：`{ACTION}:{RESOURCE_ID}`，如`VIEW:user_list`、`CREATE:user_create`
资源树格式：标准的树形结构，支持父子层级关系

## 后续阶段准备
1. 为阶段6前端权限改造提供完整的权限检查API
2. 支持前端权限组件和指令的后端数据需求
3. 提供权限验证的统一接口
4. 为权限认证守卫提供前端集成支持
5. 准备权限测试和调试工具

## 注意事项
- 确保权限系统的性能和扩展性
- 权限码生成逻辑要稳定可靠
- 权限缓存要考虑数据一致性
- 异常处理要友好且安全
- 代码要符合NestJS最佳实践
- 充分的单元测试和集成测试