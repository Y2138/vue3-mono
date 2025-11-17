# RBAC权限系统设计方案（资源码版）

## 1. 概述

本文档基于现有的RBAC（基于角色的访问控制）系统，设计一个基于资源码（res_code）的简化权限管理解决方案。通过资源码的概念，实现统一且自动化的权限标识管理，确保系统安全性和数据访问的合理性，同时简化权限配置和管理的复杂度。

## 2. 核心概念

### 2.1 资源码（res_code）

资源码是系统中所有资源的唯一标识符，采用以下规则自动生成：

| 资源类型 | 生成方式 | 格式示例 |
|---------|---------|----------|
| **page** | 页面路由自动计算，将"/"转换为"_" | `PAGE_user_management` |
| **api** | 接口路由自动计算，将"/"转换为"_" | `API_users` |
| **module** | 用户手动配置，不做处理 | `MODULE_user_create` |

### 2.2 资源数据模型

```typescript
interface Resource {
  id: string                    // 资源唯一标识
  type: 'page' | 'api' | 'module'  // 资源类型
  name: string                 // 资源名称
  res_code: string             // 资源码（唯一）
  path?: string                // 资源路径（page和api类型）
  parentId?: string            // 父资源ID（用于层级关系）
  description?: string         // 资源描述
  createdAt: Date
  updatedAt: Date
}
```

### 2.3 资源码生成规则

1. **page类型资源码**：
   - 基于路由path自动生成
   - 将"/"转换为"_"
   - 添加"PAGE_"前缀
   - 示例：`/user-management` → `PAGE_user_management`

2. **api类型资源码**：
   - 基于接口path自动生成
   - 将"/"转换为"_"
   - 添加"API_"前缀
   - 示例：`/api/users` → `API_users`

3. **module类型资源码**：
   - 由开发者手动配置
   - 不进行路径转换
   - 添加"MODULE_"前缀
   - 示例：`MODULE_user_create`、`MODULE_role_manage`

## 3. 资源码应用场景

### 3.1 前端页面权限控制

#### 3.1.1 路由权限配置

```typescript
// router/index.ts
export const routes = [
  {
    path: '/user-management',
    component: UserManagement,
    meta: {
      requiresAuth: true,
      // 无需配置 resCode，根据 url 自动计算
    }
  }
]
```

#### 3.1.2 页面访问控制

```typescript
// router/permission.ts
router.beforeEach(async (to, from, next) => {
  const permissionStore = usePermissionStore()
  const userStore = useUserStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return next('/login')
  }
  
  // 检查页面资源码
  if (to.meta.resCode) {
    const hasAccess = await permissionStore.checkResource(to.meta.resCode)
    if (!hasAccess) {
      return next('/403')
    }
  }
  
  next()
})
```

#### 3.1.3 菜单动态生成

```typescript
// utils/menu-generator.ts
interface MenuItem {
  path: string
  title: string
  icon?: string  // 使用资源的 icon 字段
  children?: MenuItem[]
}

function generateMenus(pageResources: Resource[]): MenuItem[] {
  return pageResources
    .filter(resource => resource.type === 'page')
    .map(resource => ({
      path: resource.url!,
      title: resource.name,
      icon: resource.icon,  // 使用资源配置的图标
      children: getChildResources(resource.id)
    }))
}
```

#### 3.1.4 页面访问控制

```typescript
// utils/page-permission.ts
class PagePermission {
  static generatePageResCode(url: string): string {
    // 移除开头的"/"，将"/"替换为"_"
    const cleanPath = url.replace(/^\//, '').replace(/\//g, '_')
    return `PAGE_${cleanPath}`
  }
  
  static async checkPageAccess(url: string): Promise<boolean> {
    const resCode = this.generatePageResCode(url)
    const permissionStore = usePermissionStore()
    return await permissionStore.checkResource(resCode)
  }
  
  // 路由守卫中使用
  static async checkRoutePermission(to: any): Promise<boolean> {
    const url = to.path
    return await this.checkPageAccess(url)
  }
}

// utils/api-permission.ts
class ApiPermission {
  static generateApiResCode(url: string): string {
    // 移除开头的"/api/"，将"/"替换为"_"
    const cleanPath = url.replace(/^\/api\//, '').replace(/\//g, '_')
    return `API_${cleanPath}`
  }
}
```

### 3.2 操作权限控制

#### 3.2.1 操作权限控制

```vue
<template>
  <div>
    <n-button v-resource="'/api/users'">新增用户</n-button>
    <n-button v-resource="'/api/users/:id'">编辑用户</n-button>
    <n-button v-resource="'/api/users/:id'">删除用户</n-button>
    <n-button v-resource="'/api/users/export'">导出用户</n-button>
  </div>
</template>
```

#### 3.2.2 操作权限指令

```typescript
// directives/resource.ts
export const vResource = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore()
    const urls = binding.value  // 可能是URL字符串或URL数组
    
    // 检查单个URL权限
    const checkSinglePermission = async (url: string) => {
      const resCode = url.startsWith('/api/') 
        ? ApiPermission.generateApiResCode(url)
        : PagePermission.generatePageResCode(url)
      
      return await permissionStore.checkResource(resCode)
    }
    
    // 检查多个URL权限（任一通过即可）
    const checkMultiplePermissions = async (urls: string[]) => {
      for (const url of urls) {
        const hasResource = await checkSinglePermission(url)
        if (hasResource) {
          return true  // 任一权限通过即可
        }
      }
      return false  // 所有权限都不通过
    }
    
    const checkPermission = async (urls: any) => {
      if (Array.isArray(urls)) {
        return await checkMultiplePermissions(urls)
      } else {
        return await checkSinglePermission(urls)
      }
    }
    
    checkPermission(urls).then(hasResource => {
      if (!hasResource) {
        el.style.display = 'none'
      }
    })
  }
}
```

#### 3.2.3 权限组合控制

```vue
<template>
  <div>
    <n-button v-resource="['/api/users', '/api/users/import']">
      新增用户
    </n-button>
  </div>
</template>
```

### 3.3 API接口权限控制

#### 3.3.2 接口权限控制

```typescript
// controllers/user.controller.ts
@Controller('api/users')
@UseGuards(ResourceGuard)
export class UserController extends BaseController {
  
  // 自动检查 API_users 权限
  @Get()
  async getUsers() {
    return this.userService.findUsers()
  }
  
  // 自动检查 API_users 权限
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto)
  }
  
  // 自动检查 API_users_id 权限
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto)
  }
}
```

#### 3.3.3 资源守卫实现

```typescript
// guards/resource.guard.ts
@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resourceService: ResourceService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    
    // 自动根据API路由计算资源码
    const routePath = this.extractRoutePath(request)
    const apiResCode = this.buildApiResCode(routePath)
    
    return this.checkUserResources(user, [apiResCode])
  }
  
  private async checkUserResources(user: User, requiredResCodes: string[]): Promise<boolean> {
    // 超级管理员拥有所有资源
    if (this.isSuperAdmin(user)) {
      return true
    }
    
    return this.resourceService.hasAnyResource(user.phone, requiredResCodes)
  }
  
  private buildApiResCode(routePath: string): string {
    // 移除开头的"/api/"
    const cleanPath = routePath.replace(/^\/api\//, '')
    // 将"/"替换为"_"，保持原有的下划线
    const resCode = cleanPath.replace(/\//g, '_')
    return `API_${resCode}`
  }
}
```

## 4. 资源管理界面

### 4.1 资源码管理

#### 4.1.1 资源码列表页面

- **功能**：展示所有资源码，支持按类型筛选
- **搜索**：支持按资源码名称、路径搜索
- **操作**：查看、编辑资源码信息
- **类型筛选**：page、api、module三种类型

#### 4.1.2 资源码自动生成

```typescript
// utils/resource-generator.ts
class ResourceGenerator {
  static generatePageResCode(path: string): string {
    // 移除开头的"/"，将"/"替换为"_"
    const cleanPath = path.replace(/^\//, '').replace(/\//g, '_')
    return `PAGE_${cleanPath}`
  }
  
  static generateApiResCode(path: string): string {
    // 移除开头的"/"，将"/"替换为"_"
    const cleanPath = path.replace(/^\//, '').replace(/\//g, '_')
    return `API_${cleanPath}`
  }
  
  static generateWholeId(parentIds: string[], currentId: string): string {
    // 生成层级关系ID：父节点到当前节点的ID拼接
    const ids = [...parentIds.filter(id => id), currentId]
    return ids.join('.')
  }
  
  static validateResCode(resCode: string): boolean {
    // 验证资源码格式
    const pattern = /^(PAGE|API|MODULE)_[a-zA-Z0-9_]+$/
    return pattern.test(resCode)
  }
}
```

## 5. 数据模型设计

### 5.1 资源表结构

```prisma
model Resource {
  id          String   @id @default(cuid())
  name        String   @unique  // 资源名称
  type        ResourceType  // 资源类型：page/api/module
  res_code    String   @unique  // 资源码（唯一标识）
  url         String?  // 资源URL路径（page和api类型）
  icon        String?  // 资源图标（主要应用于page类型）
  description String?  // 资源描述
  whole_id    String?  // 层级关系ID（根节点到当前节点的ID拼接，如：parent.child.grandchild）
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 关联字段
  parentId    String?  // 父资源ID
  parent      Resource? @relation("ResourceHierarchy", fields: [parentId], references: [id])
  children    Resource[] @relation("ResourceHierarchy")
  
  // 与角色关联
  roleResources RoleResource[]
}

enum ResourceType {
  page    // 页面资源
  api     // 接口资源  
  module  // 模块资源
}
```

### 5.2 角色资源关联表

```prisma
model RoleResource {
  id          String  @id @default(cuid())
  roleId      String
  resourceId  String
  
  role        Role    @relation(fields: [roleId], references: [id], onDelete: Cascade)
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  
  @@unique([roleId, resourceId])
}
```

## 6. 数据层面权限设计

### 6.1 简化的数据权限模型

#### 6.1.1 数据权限类型

| 权限类型 | 描述 | 实现方式 | 适用场景 |
|---------|------|---------|----------|
| **ALL** | 全部数据权限 | 无限制访问所有数据 | 超级管理员 |
| **DEPARTMENT** | 部门数据权限 | 部门及子部门数据 | 部门管理员 |
| **OWN** | 个人数据权限 | 仅自己的数据 | 普通用户 |
| **CUSTOM** | 自定义数据权限 | 基于条件的数据访问 | 特定业务需求 |

#### 6.1.2 数据权限配置

```typescript
interface DataPermission {
  type: 'ALL' | 'DEPARTMENT' | 'OWN' | 'CUSTOM'
  name: string
  description: string
  // 仅在type为CUSTOM时使用
  condition?: {
    field: string
    operator: 'eq' | 'ne' | 'in' | 'not_in' | 'like' | 'gte' | 'lte'
    value: any
  }
  // 仅在type为DEPARTMENT时使用
  departmentField?: string // 默认 'department_id'
  // 仅在type为OWN时使用
  ownerField?: string // 默认 'created_by'
}
```

#### 6.1.3 数据权限使用示例

```typescript
// 为角色分配数据权限
const roleDataPermissions: DataPermission[] = [
  {
    type: 'DEPARTMENT',
    name: '部门数据访问',
    description: '可访问本部门及子部门的所有数据',
    departmentField: 'department_id'
  },
  {
    type: 'OWN',
    name: '个人数据访问',
    description: '可访问自己创建的数据',
    ownerField: 'created_by'
  }
]

// 为特定业务分配自定义权限
const customPermission: DataPermission = {
  type: 'CUSTOM',
  name: '特定项目数据',
  description: '仅可访问指定项目的数据',
  condition: {
    field: 'project_id',
    operator: 'in',
    value: ['project-1', 'project-2', 'project-3']
  }
}
```

### 6.2 角色数据权限配置

#### 6.2.1 角色扩展

```typescript
interface Role {
  id: string
  name: string
  description: string
  level: number
  parentRoleId?: string
  dataPermissions: DataPermission[]
  // 其他字段...
}
```

#### 6.2.2 数据权限继承

- **角色层级继承**：子角色继承父角色的数据权限
- **权限合并**：用户拥有多个角色时，合并所有角色的数据权限
- **权限扩展**：高级别角色的数据权限可以覆盖低级别的限制

### 6.3 数据权限实现

#### 6.3.1 数据权限服务

```typescript
// services/data-permission.service.ts
@Injectable()
export class DataPermissionService {
  constructor(
    private readonly roleService: RoleService,
    private readonly prisma: PrismaService
  ) {}

  async getUserDataPermissions(userId: string): Promise<DataPermission[]> {
    const userRoles = await this.roleService.getUserRoles(userId)
    const allPermissions: DataPermission[] = []
    
    // 收集所有角色的数据权限
    for (const role of userRoles) {
      allPermissions.push(...role.dataPermissions)
    }
    
    // 合并相同类型的数据权限
    return this.mergeDataPermissions(allPermissions)
  }

  async buildDataQuery(
    model: string,
    baseQuery: any,
    userId: string
  ): Promise<any> {
    const dataPermissions = await this.getUserDataPermissions(userId)
    
    // 如果用户有ALL权限，直接返回
    if (dataPermissions.some(p => p.type === 'ALL')) {
      return baseQuery
    }
    
    // 构建数据权限过滤条件
    const permissionFilters = await this.buildPermissionFilters(dataPermissions, userId)
    
    if (permissionFilters.length === 0) {
      return baseQuery
    }
    
    // 合并过滤条件
    baseQuery.where = {
      AND: [
        baseQuery.where || {},
        { OR: permissionFilters }
      ]
    }
    
    return baseQuery
  }

  private async buildPermissionFilters(
    permissions: DataPermission[],
    userId: string
  ): Promise<any[]> {
    const filters: any[] = []
    
    for (const permission of permissions) {
      switch (permission.type) {
        case 'DEPARTMENT':
          const userDepartment = await this.getUserDepartment(userId)
          if (userDepartment) {
            const departmentIds = await this.getDepartmentTreeIds(userDepartment.id)
            filters.push({
              [permission.departmentField!]: {
                in: departmentIds
              }
            })
          }
          break
          
        case 'OWN':
          filters.push({
            [permission.ownerField!]: userId
          })
          break
          
        case 'CUSTOM':
          filters.push({
            [permission.condition!.field]: {
              [permission.condition!.operator]: permission.condition!.value
            }
          })
          break
      }
    }
    
    return filters
  }
}
```

#### 6.3.2 数据访问增强

```typescript
// services/user.service.ts
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataPermissionService: DataPermissionService
  ) {}

  async findUsers(query: any, userId: string): Promise<User[]> {
    // 构建带数据权限的查询
    const dataQuery = await this.dataPermissionService.buildDataQuery(
      'user',
      { ...query },
      userId
    )
    
    return this.prisma.user.findMany(dataQuery)
  }
  
  async createUser(createUserDto: CreateUserDto, userId: string): Promise<User> {
    // 创建用户时自动填充数据权限相关字段
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        created_by: userId,
        department_id: createUserDto.department_id || await this.getUserDepartmentId(userId)
      }
    })
    
    return user
  }
}
```

#### 6.3.3 数据权限中间件

```typescript
// middlewares/data-permission.middleware.ts
@Injectable()
export class DataPermissionMiddleware implements NestMiddleware {
  constructor(
    private readonly dataPermissionService: DataPermissionService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user
    
    if (user) {
      // 获取用户的数据权限
      const dataPermissions = await this.dataPermissionService.getUserDataPermissions(user.id)
      ;(req as any).dataPermissions = dataPermissions
    }
    
    next()
  }
}
```

## 6. 实施计划

### 6.1 核心实施步骤

1. **数据模型调整**
   - 创建Resource表，替代原有Permission表
   - 创建RoleResource关联表
   - 实现资源码自动生成机制

2. **资源码服务**
   - 实现资源码生成工具类
   - 开发资源权限检查服务
   - 集成资源码验证机制

3. **前端权限控制**
   - 更新路由配置使用resCode
   - 实现v-resource指令替代v-permission
   - 调整菜单生成逻辑

4. **后端权限守卫**
   - 实现ResourceGuard替代PermissionGuard
   - 更新@RequireResource装饰器
   - 实现API资源码自动推断

### 6.2 迁移策略

1. **数据迁移**
   - 从现有Permission表迁移到Resource表
   - 生成所有page和api类型的res_code
   - 保留module类型的自定义res_code

2. **代码更新**
   - 逐步替换权限检查逻辑
   - 更新前端组件使用resCode
   - 调整后端接口权限装饰器

3. **测试验证**
   - 验证资源码正确性
   - 测试权限控制功能
   - 确保系统兼容性

## 7. 总结

### 7.1 核心优势

1. **统一资源码**：三种资源类型(page/api/module)统一使用res_code标识
2. **自动生成**：page和api类型资源码自动生成，module类型手动配置
3. **格式规范**：统一使用下划线("_")作为路径分隔符的转换
4. **易于维护**：简化的数据模型，降低维护复杂度
5. **前后端一致**：统一的资源码在前后端权限控制中应用

### 7.2 实施要点

1. **资源码格式**：page类型`PAGE_{路径}`，api类型`API_{路径}`，module类型`MODULE_{自定义}`
2. **自动生成规则**：将路由路径中的"/"替换为"_"生成资源码
3. **数据存储**：Resource表存储所有资源，RoleResource表建立角色与资源的关联
4. **权限控制**：前端使用v-resource指令，后端使用@RequireResource装饰器和ResourceGuard

通过本方案的实施，将实现一个简洁、高效、易维护的基于资源码的权限管理系统。