# 阶段3：角色管理后端功能开发执行计划

## 任务描述
实现完整的角色管理后端功能，包括角色列表、角色增删改查，并支持对资源树的操作（勾选权限），为前端角色权限分配提供完整的后端支持。

## 背景分析
- 阶段1和2已完成资源管理的前后端实现
- 现有项目中的RBAC模块需要完全重新实现
- 需要建立角色与资源的关联关系
- 角色管理是权限系统的核心，为用户权限分配提供基础

## 核心需求
1. 重新设计角色管理数据模型
2. 实现角色CRUD操作
3. 实现角色权限分配功能
4. 实现资源权限树形展示
5. 实现权限继承和冲突检测
6. 支持角色权限的批量操作
7. 提供完整的权限管理API

## 详细实施计划

### 1. 数据库设计和迁移
**目标**: 设计完整的角色权限管理数据模型

**具体任务**:
- [ ] 更新prisma/schema.prisma，定义Role模型
- [ ] 设计RoleResource关联表模型
- [ ] 定义Role模型字段：id, name, description, is_active, created_at, updated_at
- [ ] 设计RoleResource模型字段：id, role_id, resource_id, created_at
- [ ] 添加数据库索引优化
- [ ] 创建数据库迁移文件
- [ ] 执行数据库迁移

**数据模型设计**:
```prisma
model Role {
  id          String  @id @default(cuid())
  name        String  @unique
  description String?
  is_active   Boolean @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // 关联
  user_roles  UserRole[]
  role_resources RoleResource[]
  
  @@map("roles")
}

model RoleResource {
  id         String  @id @default(cuid())
  role_id    String
  resource_id String
  created_at DateTime @default(now())
  
  // 关联
  role      Role      @relation(fields: [role_id], references: [id], onDelete: Cascade)
  resource  Resource  @relation(fields: [resource_id], references: [id], onDelete: Cascade)
  
  @@unique([role_id, resource_id])
  @@map("role_resources")
}
```

**技术要点**:
- Role.name字段唯一性约束
- RoleResource使用复合唯一索引(role_id, resource_id)
- 软删除策略（is_active字段）
- 级联删除策略

### 2. 角色模块重构
**目标**: 创建全新的角色管理模块

**具体任务**:
- [ ] 创建新的roles模块目录结构
- [ ] 设计角色管理模块架构
- [ ] 实现角色服务类
- [ ] 实现角色权限服务类
- [ ] 实现角色HTTP控制器
- [ ] 配置模块依赖和导出

**模块结构**:
```
src/modules/roles/
├── dto/
│   ├── create-role.dto.ts
│   ├── update-role.dto.ts
│   ├── assign-resources.dto.ts
│   └── query-role.dto.ts
├── entities/
│   ├── role.entity.ts
│   └── role-resource.entity.ts
├── services/
│   ├── role.service.ts
│   └── role-permission.service.ts
├── controllers/
│   ├── role.controller.ts
│   └── role-permission.controller.ts
├── roles.module.ts
└── types/
    ├── role.types.ts
    └── permission.types.ts
```

### 3. 角色实体和DTO设计
**目标**: 定义完整的数据传输对象

**具体任务**:
- [ ] 创建CreateRoleDto（创建角色）
- [ ] 创建UpdateRoleDto（更新角色）
- [ ] 创建AssignResourcesDto（分配资源权限）
- [ ] 创建QueryRoleDto（查询角色）
- [ ] 定义角色权限响应类型
- [ ] 定义权限树形结构类型

**字段设计**:
- name: 角色名称（必填，唯一）
- description: 角色描述（可选）
- is_active: 是否激活（默认true）
- resource_ids: 关联的资源ID数组（用于权限分配）

### 4. 角色服务层实现
**目标**: 实现角色管理核心业务逻辑

**具体任务**:
- [ ] 实现角色CRUD操作服务方法
- [ ] 实现角色与权限关联服务方法
- [ ] 实现角色与用户关联服务方法
- [ ] 实现角色继承逻辑
- [ ] 实现角色权限计算逻辑
- [ ] 实现角色查询和过滤方法
- [ ] 实现角色缓存逻辑
- [ ] 实现角色审计日志方法

**⚠️ 重要：proto文件接口定义要求**
- 所有新接口必须在 `protos/rbac.proto` 中定义
- 后端服务实现完全遵循 proto 中定义的 RPC 规范
- 前后端类型完全依赖 proto 文件生成，类型定义统一
- 新增角色相关RPC方法：
  - `GetRoles` (分页查询角色)
  - `CreateRole` (创建角色)
  - `UpdateRole` (更新角色) 
  - `DeleteRole` (删除角色)
  - `GetRolePermissions` (获取角色权限)
  - `AssignPermissionsToRole` (分配权限给角色)
  - `GetRoleUsers` (获取角色用户)
  - `AssignUsersToRole` (分配用户给角色)
  - `CheckUserRole` (检查用户角色)

**核心服务类设计**:
```typescript
@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService,
  ) {}

  // 基础CRUD操作 - 对应 proto 中的 RPC 方法
  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    // TODO: 实现角色创建逻辑，遵循 proto 接口定义
  }

  async updateRole(id: string, data: UpdateRoleRequest): Promise<RoleResponse> {
    // TODO: 实现角色更新逻辑，遵循 proto 接口定义
  }

  async deleteRole(id: string): Promise<ResponseStatus> {
    // TODO: 实现角色删除逻辑，遵循 proto 接口定义
  }

  async getRole(id: string): Promise<RoleResponse | null> {
    // TODO: 实现获取单个角色逻辑，遵循 proto 接口定义
  }

  async getRoles(params: GetRolesRequest): Promise<GetRolesResponse> {
    // TODO: 实现分页查询角色逻辑，遵循 proto 接口定义
  }

  // 权限关联 - 对应 proto 中的 RPC 方法
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<ResponseStatus> {
    // TODO: 实现分配权限逻辑，遵循 proto 接口定义
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<ResponseStatus> {
    // TODO: 实现移除权限逻辑，遵循 proto 接口定义
  }

  async getRolePermissions(roleId: string): Promise<GetPermissionsResponse> {
    // TODO: 实现获取角色权限逻辑，遵循 proto 接口定义
  }

  // 用户关联 - 对应 proto 中的 RPC 方法
  async assignUsers(roleId: string, userIds: string[]): Promise<ResponseStatus> {
    // TODO: 实现分配用户逻辑，遵循 proto 接口定义
  }

  async removeUsers(roleId: string, userIds: string[]): Promise<ResponseStatus> {
    // TODO: 实现移除用户逻辑，遵循 proto 接口定义
  }

  async getRoleUsers(roleId: string): Promise<GetUsersResponse> {
    // TODO: 实现获取角色用户逻辑，遵循 proto 接口定义
  }

  // 高级功能 - 对应 proto 中的 RPC 方法
  async checkUserRole(userId: string, roleId: string): Promise<CheckUserRoleResponse> {
    // TODO: 实现检查用户角色逻辑，遵循 proto 接口定义
  }

  async getUserRoles(userId: string): Promise<GetUserRolesResponse> {
    // TODO: 实现获取用户角色逻辑，遵循 proto 接口定义
  }

  async checkRolePermission(roleId: string, permissionCode: string): Promise<CheckRolePermissionResponse> {
    // TODO: 实现检查角色权限逻辑，遵循 proto 接口定义
  }
}
```

**核心业务逻辑**:
- 角色创建时的唯一性检查
- 角色删除时的关联数据处理
- 权限分配的并发控制
- 权限冲突检测
- 权限继承处理

### 5. 角色权限服务实现
**目标**: 实现权限管理的核心逻辑

**具体任务**:
- [ ] 实现权限树构建算法
- [ ] 实现权限继承计算
- [ ] 实现权限冲突检测
- [ ] 实现权限有效性验证
- [ ] 实现权限批量操作
- [ ] 实现权限统计查询

**权限管理算法**:
```typescript
// 权限树构建
buildPermissionTree(resources: Resource[]): PermissionTreeNode[]

// 权限继承计算
calculateInheritedPermissions(roleId: string): Set<string>

// 权限冲突检测
detectPermissionConflicts(resources: string[]): ConflictInfo[]

// 权限有效性验证
validatePermissionAssignments(assignments: ResourceAssignment[]): ValidationResult
```

### 6. 角色控制器实现
**目标**: 提供RESTful API接口

**具体任务**:
- [ ] 实现GET /api/roles（获取角色列表）
- [ ] 实现GET /api/roles/:id（获取单个角色）
- [ ] 实现GET /api/roles/:id/permissions（获取角色权限）
- [ ] 实现POST /api/roles（创建角色）
- [ ] 实现PUT /api/roles/:id（更新角色）
- [ ] 实现DELETE /api/roles/:id（删除角色）
- [ ] 实现POST /api/roles/:id/permissions（分配权限）
- [ ] 实现DELETE /api/roles/:id/permissions（移除权限）
- [ ] 实现GET /api/roles/:id/permission-tree（获取权限树）

**API设计原则**:
- 统一的响应格式
- 完善的错误处理
- 数据验证和权限检查
- 支持查询参数：search、is_active、page、pageSize
- 支持权限树形结构返回

### 7. 权限树形结构实现
**目标**: 实现高效的权限树构建和查询

**具体任务**:
- [ ] 实现资源树形结构转换为权限树
- [ ] 实现权限状态标记（已分配/未分配/部分分配）
- [ ] 实现权限树形数据分页
- [ ] 实现权限树形数据缓存
- [ ] 实现权限树形搜索功能

**权限树节点设计**:
```typescript
interface PermissionTreeNode {
  key: string
  label: string
  type: string
  icon?: string
  isAssigned: boolean  // 是否已分配
  isIndeterminate: boolean  // 是否部分分配
  children?: PermissionTreeNode[]
  raw: Resource
}
```

**权限状态计算**:
- 已分配：角色直接拥有该权限
- 部分分配：角色拥有该权限的子权限
- 未分配：角色不拥有该权限及其子权限

### 8. 权限继承和冲突处理
**目标**: 实现复杂的权限逻辑处理

**具体任务**:
- [ ] 实现权限继承算法
- [ ] 实现权限冲突检测
- [ ] 实现权限冲突解决策略
- [ ] 实现权限审计日志
- [ ] 实现权限变更通知

**继承算法**:
- 父级权限自动包含子级权限
- 同级权限独立
- 跨分支权限独立计算

**冲突处理策略**:
- 检测权限分配冲突
- 提供冲突解决建议
- 记录冲突解决历史
- 支持权限回滚

### 9. 批量权限操作
**目标**: 支持高效的批量权限管理

**具体任务**:
- [ ] 实现批量权限分配
- [ ] 实现批量权限移除
- [ ] 实现权限模板功能
- [ ] 实现权限复制功能
- [ ] 实现权限导入/导出

**批量操作设计**:
- 事务保证数据一致性
- 进度跟踪和状态反馈
- 错误处理和重试机制
- 操作日志记录

### 10. 权限统计和报表
**目标**: 提供权限使用统计功能

**具体任务**:
- [ ] 实现角色权限统计
- [ ] 实现资源权限使用统计
- [ ] 实现权限分配趋势分析
- [ ] 实现权限覆盖率统计
- [ ] 实现权限审计报表

**统计指标**:
- 角色数量和分布
- 权限分配数量
- 权限使用频率
- 权限覆盖率
- 权限变更频率

### 11. 性能优化
**目标**: 确保大量数据时的性能表现

**具体任务**:
- [ ] 实现权限数据缓存
- [ ] 优化权限查询算法
- [ ] 实现权限树分页加载
- [ ] 实现权限索引优化
- [ ] 实现并发控制优化

**优化策略**:
- Redis缓存权限数据
- 数据库索引优化
- 权限树懒加载
- 查询结果缓存
- 并发控制

### 12. 数据初始化
**目标**: 提供基础角色数据

**具体任务**:
- [ ] 创建系统默认角色（超级管理员、普通用户、只读用户等）
- [ ] 创建角色权限关联数据
- [ ] 创建权限模板
- [ ] 实现角色数据seed脚本

**默认角色设计**:
- 超级管理员：拥有所有权限
- 系统管理员：拥有系统管理权限
- 普通用户：拥有基础查看权限
- 只读用户：只能查看部分数据

### 13. 测试和验证
**目标**: 确保功能完整性和稳定性

**具体任务**:
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 验证CRUD操作
- [ ] 验证权限分配功能
- [ ] 验证权限继承逻辑
- [ ] 性能测试和压力测试

**测试覆盖**:
- 正常业务流程测试
- 异常情况处理测试
- 边界条件测试
- 并发操作测试
- 性能压力测试

## 实施清单
1. [ ] 设计并实现Role和RoleResource数据模型
2. [ ] 创建角色管理模块结构
3. [ ] 实现角色服务层核心逻辑
4. [ ] 实现角色权限服务逻辑
5. [ ] 实现角色控制器API接口
6. [ ] 实现权限树形结构构建
7. [ ] 实现权限继承和冲突处理
8. [ ] 实现批量权限操作
9. [ ] 实现权限统计和报表
10. [ ] 性能优化和缓存
11. [ ] 创建基础数据初始化
12. [ ] 编写完整测试用例

## 技术风险
1. **权限冲突复杂性**: 权限继承和冲突检测逻辑复杂
   - 风险：高
   - 缓解：分步实现、充分测试、使用算法验证
2. **权限树性能**: 大量权限数据时的树形构建性能
   - 风险：高
   - 缓解：分页加载、缓存优化、虚拟滚动
3. **数据一致性**: 权限分配时的数据一致性保证
   - 风险：中
   - 缓解：事务控制、锁机制、数据校验
4. **并发控制**: 多个用户同时操作权限时的并发问题
   - 风险：中
   - 缓解：乐观锁、版本控制、操作队列

## 验收标准
1. 角色CRUD操作完全正常
2. 权限分配功能完整正确
3. 权限树正确显示和操作
4. 权限继承和冲突检测正确
5. 批量操作功能正常
6. 性能满足要求（1000个权限节点<2秒）
7. 数据一致性保证
8. 错误处理完善
9. API接口响应格式统一
10. 测试用例通过率100%

## 时间估算
- 总计：4-5个工作日
- 数据库设计和迁移：0.5天
- 模块重构：1天
- 服务层实现：2天
- 权限逻辑和优化：1天
- 测试和验证：0.5-1天

## 与其他阶段集成
### 与阶段1（资源管理）的集成
- 依赖资源管理的Resource模型
- 使用资源ID进行权限关联
- 权限树基于资源树构建

### 与阶段2（资源管理前端）的集成
- 提供权限树形API接口
- 支持权限树形数据返回
- 为前端权限分配提供数据支持

### 为阶段4（角色管理前端）准备
- 提供完整的角色管理API
- 提供权限树形数据API
- 设计权限分配的数据格式
- 准备联调测试用例

## 与资源管理API集成要点
1. **依赖关系**: 角色管理完全依赖资源管理
2. **数据关联**: 通过Resource ID建立角色-权限关联
3. **权限树**: 基于资源树构建权限分配树
4. **级联操作**: 资源变更时自动更新角色权限
5. **数据一致性**: 确保角色权限与资源数据一致

## 下阶段准备
1. 为阶段4前端开发提供完整的角色管理API
2. 设计权限分配界面的数据结构
3. 准备角色权限管理的测试数据
4. 设计前端权限树组件的数据格式
5. 准备联调测试用例和边界情况

## 注意事项
- 保持与设计文档的一致性
- 关注权限逻辑的正确性和性能
- 确保与资源管理的无缝集成
- 预留扩展性，支持未来的权限需求
- 代码规范遵循项目统一标准
- 充分的错误处理和数据验证
- 操作日志和审计追踪