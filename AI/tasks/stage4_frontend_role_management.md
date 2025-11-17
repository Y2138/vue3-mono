# 阶段4：角色管理前端功能开发及功能联调执行计划

## 任务描述
实现完整的角色管理前端功能，包括角色列表界面、权限分配功能，以及与后端API的功能联调。重点实现基于资源树的权限分配界面，支持直观的权限勾选操作。

## 背景分析
- 阶段1-3已完成资源管理和角色管理后端功能
- 阶段2已完成资源管理前端功能
- 需要基于资源管理前端经验，实现角色管理前端
- 核心是实现权限分配界面，支持在资源树上勾选权限
- 需要与后端API完整集成，确保权限分配的实时性

## 核心需求
1. 实现角色列表展示和管理界面
2. 实现权限分配界面（基于资源树）
3. 实现权限勾选和批量操作
4. 实现角色权限的实时预览
5. 实现角色权限模板功能
6. 实现角色权限的复制和继承
7. 与后端API完整集成
8. 响应式设计，支持移动端

## 详细实施计划

### 1. 目录结构和模块设计
**目标**: 设计清晰的目录结构和模块架构

**具体任务**:
- [ ] 创建roles模块目录结构
- [ ] 设计组件层级关系
- [ ] 设计状态管理方案
- [ ] 设计路由配置

**目录结构**:
```
apps/naive-admin/src/views/roles/
├── index.vue                    # 角色管理主页
├── components/
│   ├── RoleList.vue             # 角色列表组件
│   ├── RoleForm.vue             # 角色表单组件
│   ├── PermissionTree.vue       # 权限树组件
│   ├── PermissionAssign.vue     # 权限分配组件
│   ├── RoleToolbar.vue          # 角色操作工具栏
│   └── RoleInfo.vue             # 角色详情组件
├── hooks/
│   ├── useRole.ts               # 角色管理组合式函数
│   └── usePermission.ts         # 权限管理组合式函数
├── store/
│   └── role.store.ts            # 角色状态管理
├── api/
│   └── role.api.ts              # 角色API接口
└── types/
    ├── role.types.ts            # 角色类型定义
    └── permission.types.ts      # 权限类型定义
```

### 2. 类型定义和接口设计
**目标**: 定义完整的TypeScript类型和接口

**具体任务**:
- [ ] 定义Role接口类型
- [ ] 定义PermissionTreeNode权限树节点类型
- [ ] 定义RoleFormData角色表单类型
- [ ] 定义PermissionAssignment权限分配类型
- [ ] 定义API响应类型

**类型设计**:
```typescript
// 角色基础类型
interface Role {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  permissions?: Permission[]
  permission_count?: number
  user_count?: number
}

// 权限树节点类型
interface PermissionTreeNode {
  key: string
  label: string
  type: 'PAGE' | 'API' | 'BUTTON'
  icon?: string
  isAssigned: boolean        // 是否已分配
  isIndeterminate: boolean   // 是否部分分配
  children?: PermissionTreeNode[]
  raw: Resource
  disabled?: boolean
  isLeaf?: boolean
}

// 权限分配类型
interface PermissionAssignment {
  role_id: string
  resource_ids: string[]
  operation: 'assign' | 'remove'
}

// 角色表单数据
interface RoleFormData {
  name: string
  description?: string
  is_active: boolean
  resource_ids: string[]
}
```

### 3. API接口层实现
**目标**: 实现前端API接口封装

**具体任务**:
- [ ] 在 `src/request/api` 目录下创建角色管理相关API
- [ ] 实现角色CRUD操作API
- [ ] 实现角色与权限关联API
- [ ] 实现角色与用户关联API
- [ ] 实现角色查询和过滤API
- [ ] 实现批量操作API
- [ ] 实现API错误处理
- [ ] 实现API请求拦截器

**⚠️ 重要：proto文件类型依赖要求**
- 所有API类型定义必须依赖 `protos/rbac.proto` 生成的类型
- 前端类型文件从共享类型文件 `src/shared/` 引入，禁止手动定义
- 前端API接口与后端RPC服务完全对应
- 禁止使用 any 类型，所有请求响应必须有类型定义

**API设计**:
```typescript
// 角色管理API - 类型完全依赖 proto 文件生成
export const roleApi = {
  // 获取角色列表 - 对应 proto 中的 GetRolesRequest/Response
  getRoles: (params?: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) => 
    get<SharedTypes.GetRolesResponse>('/api/roles', params),

  // 获取角色详情 - 对应 proto 中的 GetRoleRequest/Response
  getRole: (id: string) => 
    get<SharedTypes.RoleResponse>(`/api/roles/${id}`),

  // 创建角色 - 对应 proto 中的 CreateRoleRequest/Response
  createRole: (data: SharedTypes.CreateRoleRequest) => 
    post<SharedTypes.RoleResponse>('/api/roles', data),

  // 更新角色 - 对应 proto 中的 UpdateRoleRequest/Response
  updateRole: (id: string, data: SharedTypes.UpdateRoleRequest) => 
    put<SharedTypes.RoleResponse>(`/api/roles/${id}`, data),

  // 删除角色 - 对应 proto 中的 DeleteRoleRequest/Response
  deleteRole: (id: string) => 
    delete<SharedTypes.ResponseStatus>(`/api/roles/${id}`),

  // 批量删除 - 对应 proto 中的 BatchDeleteRolesRequest/Response
  batchDelete: (ids: string[]) => 
    delete<SharedTypes.ResponseStatus>('/api/roles/batch', { ids }),

  // 获取角色权限 - 对应 proto 中的 GetRolePermissionsRequest/Response
  getRolePermissions: (id: string) => 
    get<SharedTypes.GetPermissionsResponse>(`/api/roles/${id}/permissions`),

  // 分配权限给角色 - 对应 proto 中的 AssignPermissionsToRoleRequest/Response
  assignPermissions: (id: string, permissionIds: string[]) => 
    post<SharedTypes.ResponseStatus>(`/api/roles/${id}/permissions`, { permissionIds }),

  // 移除角色权限 - 对应 proto 中的 RemovePermissionsFromRoleRequest/Response
  removePermissions: (id: string, permissionIds: string[]) => 
    delete<SharedTypes.ResponseStatus>(`/api/roles/${id}/permissions`, { permissionIds }),

  // 获取角色用户 - 对应 proto 中的 GetRoleUsersRequest/Response
  getRoleUsers: (id: string) => 
    get<SharedTypes.GetUsersResponse>(`/api/roles/${id}/users`),

  // 分配用户给角色 - 对应 proto 中的 AssignUsersToRoleRequest/Response
  assignUsers: (id: string, userIds: string[]) => 
    post<SharedTypes.ResponseStatus>(`/api/roles/${id}/users`, { userIds }),

  // 移除角色用户 - 对应 proto 中的 RemoveUsersFromRoleRequest/Response
  removeUsers: (id: string, userIds: string[]) => 
    delete<SharedTypes.ResponseStatus>(`/api/roles/${id}/users`, { userIds }),

  // 检查用户角色 - 对应 proto 中的 CheckUserRoleRequest/Response
  checkUserRole: (userId: string, roleId: string) => 
    get<SharedTypes.CheckUserRoleResponse>(`/api/users/${userId}/roles/${roleId}/check`),

  // 获取用户角色 - 对应 proto 中的 GetUserRolesRequest/Response
  getUserRoles: (userId: string) => 
    get<SharedTypes.GetUserRolesResponse>(`/api/users/${userId}/roles`),
}
```

**类型文件依赖**:
```typescript
// src/shared/ 目录下的类型文件
// 这些类型完全从 protos/rbac.proto 生成
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  GetRolesRequest,
  GetRolesResponse,
  GetRoleRequest,
  RoleResponse,
  GetPermissionsRequest,
  GetPermissionsResponse,
  AssignPermissionsToRoleRequest,
  RemovePermissionsFromRoleRequest,
  GetRoleUsersRequest,
  GetUsersResponse,
  AssignUsersToRoleRequest,
  RemoveUsersFromRoleRequest,
  CheckUserRoleRequest,
  CheckUserRoleResponse,
  GetUserRolesRequest,
  GetUserRolesResponse,
  ResponseStatus
} from './rbac-types'
```

### 4. 状态管理设计
**目标**: 使用Pinia管理角色数据状态

**具体任务**:
- [ ] 设计role store状态结构
- [ ] 实现action方法：fetchRoles、createRole、assignPermissions等
- [ ] 实现getter方法：filteredRoles、activeRoles等
- [ ] 实现权限树状态管理
- [ ] 实现缓存机制

**状态管理方案**:
- 角色列表缓存
- 当前选中的角色
- 权限树状态
- 权限分配状态
- 加载状态和错误状态
- 表单数据状态

### 5. 角色管理主页面
**目标**: 实现主要的角色管理界面

**具体任务**:
- [ ] 设计页面布局结构
- [ ] 实现三栏布局（角色列表 + 权限分配 + 角色详情）
- [ ] 实现工具栏组件
- [ ] 实现搜索和筛选功能
- [ ] 实现分页组件

**布局设计**:
```
┌─────────────────────────────────────────────────────────┐
│                      工具栏 (搜索、按钮)                    │
├─────────────┬─────────────────────────┬─────────────────┤
│             │                         │                 │
│   角色列表   │      权限分配区域        │    角色详情     │
│  (RoleList) │   (PermissionAssign)    │  (RoleInfo)    │
│             │                         │                 │
│ - 角色名称   │   - 权限树 (n-tree)     │ - 基本信息     │
│ - 描述      │   - 勾选/取消权限        │ - 权限统计     │
│ - 状态      │   - 批量操作            │ - 用户统计     │
│ - 操作      │   - 搜索和筛选          │ - 操作历史     │
└─────────────┴─────────────────────────┴─────────────────┘
```

### 6. 角色列表组件
**目标**: 实现角色列表的展示和管理

**具体任务**:
- [ ] 实现角色列表表格展示
- [ ] 实现角色状态切换
- [ ] 实现角色操作按钮（编辑、删除、权限分配）
- [ ] 实现角色搜索和筛选
- [ ] 实现角色批量操作

**功能设计**:
- 支持表格排序和分页
- 角色状态一键切换
- 角色信息快捷操作
- 角色权限统计显示
- 批量选择和操作

### 7. 权限分配组件
**目标**: 实现核心的权限分配功能

**具体任务**:
- [ ] 集成n-tree组件展示权限树
- [ ] 实现权限勾选和取消功能
- [ ] 实现权限状态实时更新
- [ ] 实现权限搜索和筛选
- [ ] 实现权限批量操作
- [ ] 实现权限分配进度显示

**权限树功能**:
- 支持三态选择（已分配/未分配/部分分配）
- 支持节点展开/折叠
- 支持权限搜索和高亮
- 支持拖拽分配（可选）
- 支持权限模板应用

**交互设计**:
- 点击节点切换权限状态
- 支持Shift/ctrl多选
- 右键菜单快捷操作
- 权限变更实时预览
- 分配进度条显示

### 8. 权限树组件
**目标**: 实现高级的权限树形展示

**具体任务**:
- [ ] 实现权限树数据转换
- [ ] 实现权限状态计算
- [ ] 实现权限树懒加载
- [ ] 实现权限树搜索功能
- [ ] 实现权限树拖拽排序

**权限状态算法**:
```typescript
// 计算权限节点状态
function calculatePermissionState(
  node: Resource,
  assignedResources: Set<string>
): PermissionState {
  const hasDirect = assignedResources.has(node.id)
  const children = getChildResources(node.id)
  const hasChildren = children.length > 0
  const assignedChildren = children.filter(child => 
    assignedResources.has(child.id)
  )
  
  if (!hasChildren) {
    return { isAssigned: hasDirect, isIndeterminate: false }
  }
  
  const allChildrenAssigned = assignedChildren.length === children.length
  const hasAnyChildAssigned = assignedChildren.length > 0
  
  return {
    isAssigned: allChildrenAssigned,
    isIndeterminate: hasAnyChildAssigned && !allChildrenAssigned
  }
}
```

### 9. 角色表单组件
**目标**: 实现角色的创建和编辑功能

**具体任务**:
- [ ] 设计表单布局和字段
- [ ] 实现表单验证逻辑
- [ ] 实现角色权限预分配
- [ ] 实现角色模板选择
- [ ] 实现表单重置和提交

**表单字段**:
- 角色名称（必填）
- 角色描述（可选）
- 是否激活
- 初始权限分配（可选）

**验证规则**:
- 角色名称：必填、长度1-50字符、唯一性
- 描述：长度0-200字符
- 权限：至少分配一个权限

### 10. 角色权限模板功能
**目标**: 实现权限模板的创建和应用

**具体任务**:
- [ ] 实现权限模板创建
- [ ] 实现权限模板保存
- [ ] 实现权限模板应用
- [ ] 实现权限模板管理
- [ ] 实现权限模板分享

**模板功能**:
- 保存当前权限分配为模板
- 从模板创建新角色
- 模板版本管理
- 模板导入/导出
- 模板分享和复用

### 11. 权限分配高级功能
**目标**: 实现增强的权限管理功能

**具体任务**:
- [ ] 实现权限继承提示
- [ ] 实现权限冲突检测
- [ ] 实现权限变更历史
- [ ] 实现权限使用统计
- [ ] 实现权限风险评估

**高级功能**:
- 权限继承关系可视化
- 权限冲突警告和解决
- 权限变更操作日志
- 权限使用频率统计
- 权限风险等级评估

### 12. 实时预览和反馈
**目标**: 提供实时的权限分配反馈

**具体任务**:
- [ ] 实现权限分配实时预览
- [ ] 实现权限统计实时更新
- [ ] 实现操作结果即时反馈
- [ ] 实现权限变更确认
- [ ] 实现操作撤销功能

**实时功能**:
- 权限勾选即时反映
- 统计数字实时更新
- 操作成功/失败提示
- 权限变更确认对话框
- 撤销/重做功能

### 13. 性能优化
**目标**: 确保大量数据时的流畅体验

**具体任务**:
- [ ] 实现权限树虚拟滚动
- [ ] 实现权限数据懒加载
- [ ] 实现组件懒加载
- [ ] 实现搜索防抖
- [ ] 实现操作防抖

**优化策略**:
- 权限树节点分页加载
- 大型权限树虚拟滚动
- 权限计算缓存
- 搜索结果防抖
- 操作请求防抖

### 14. 响应式设计
**目标**: 确保在不同设备上的良好体验

**具体任务**:
- [ ] 实现移动端适配
- [ ] 实现触摸手势支持
- [ ] 优化移动端交互
- [ ] 实现暗色模式支持
- [ ] 无障碍功能实现

**响应式断点**:
- 手机：< 768px（单栏布局）
- 平板：768px - 1024px（两栏布局）
- 桌面：> 1024px（三栏布局）

### 15. 完整功能联调
**目标**: 确保前后端完整集成

**具体任务**:
- [ ] API接口联调测试
- [ ] 权限分配功能测试
- [ ] 角色管理流程测试
- [ ] 异常情况处理测试
- [ ] 性能压力测试

**联调要点**:
- 权限分配实时性
- 数据一致性验证
- 错误处理完整性
- 性能表现验证
- 边界条件处理

## 实施清单
1. [ ] 设计前端模块架构和目录结构
2. [ ] 定义TypeScript类型和接口
3. [ ] 实现API接口层
4. [ ] 实现Pinia状态管理
5. [ ] 实现角色管理主页面布局
6. [ ] 实现角色列表组件
7. [ ] 实现权限分配组件
8. [ ] 实现权限树组件
9. [ ] 实现角色表单组件
10. [ ] 实现权限模板功能
11. [ ] 实现权限分配高级功能
12. [ ] 实现实时预览和反馈
13. [ ] 实现性能优化
14. [ ] 实现响应式设计
15. [ ] 完整功能联调和测试

## 技术栈
- **UI组件库**: Naive UI (n-tree, n-table, n-form, n-button等)
- **状态管理**: Pinia
- **HTTP客户端**: Axios (项目已有request封装)
- **类型系统**: TypeScript
- **构建工具**: Vite
- **样式方案**: UnoCSS (原子化CSS)

## 技术风险
1. **权限树性能问题**: 大量权限数据时的树形渲染和操作性能
   - 风险：高
   - 缓解：虚拟滚动、懒加载、分页加载、权限计算缓存
2. **权限状态复杂性**: 多级权限的状态计算和显示
   - 风险：高
   - 缓解：算法优化、状态缓存、增量更新
3. **权限分配实时性**: 大量权限变更时的实时更新性能
   - 风险：中
   - 缓解：防抖机制、批量操作、进度显示
4. **前端状态管理**: 复杂的权限分配状态管理
   - 风险：中
   - 缓解：合理的状态拆分、状态同步机制
5. **数据一致性**: 前后端权限数据同步
   - 风险：中
   - 缓解：乐观更新、错误回滚、状态重置

## 验收标准
1. 角色列表正确显示，支持CRUD操作
2. 权限分配功能完全正常，状态计算正确
3. 权限树正确展示，支持勾选和批量操作
4. 权限模板功能正常，模板应用正确
5. 实时预览和反馈功能完善
6. 搜索和筛选功能正常
7. 响应式设计，移动端可用
8. 性能满足要求（1000个权限节点流畅操作）
9. 与后端API集成无问题
10. 代码符合项目规范

## 时间估算
- 总计：4-5个工作日
- 架构设计和类型定义：0.5天
- 基础组件实现：1.5天
- 权限树和分配组件：2天
- 高级功能实现：1天
- 测试和优化：0.5-1天

## 与其他阶段集成
### 与阶段1-2（资源管理）的集成
- 复用资源管理的树形组件经验
- 依赖资源管理的API接口
- 权限树基于资源树构建

### 与阶段3（角色管理后端）的集成
- 完全依赖角色管理后端API
- 权限分配基于后端权限树接口
- 数据格式与后端保持一致

### 为阶段5-6（权限改造）准备
- 提供权限验证的前端基础
- 为路由权限认证提供数据支持
- 为权限组件和指令提供数据源

## 与后端API集成要点
1. **权限树API**: 确保权限树形数据的正确传输和解析
2. **权限分配API**: 确保权限分配的实时性和一致性
3. **角色管理API**: 确保角色CRUD操作的完整性
4. **错误处理**: 统一的错误码和错误提示处理
5. **性能优化**: 支持大量权限数据的分页和懒加载

## 用户体验设计
### 交互流程
1. 用户选择角色 → 权限分配区域更新
2. 用户勾选权限 → 实时反馈和统计更新
3. 用户保存分配 → 进度显示和结果反馈
4. 用户应用模板 → 确认对话框和执行结果

### 视觉设计
- 清晰的三栏布局
- 直观的权限树形展示
- 明确的权限状态标识
- 友好的操作反馈
- 一致的视觉风格

## 下阶段准备
1. 为阶段5后端权限改造提供前端权限验证需求
2. 为阶段6前端权限改造提供权限数据和接口
3. 设计权限认证守卫的权限验证逻辑
4. 准备权限组件和指令的数据源
5. 准备联调测试用例和测试数据

## 注意事项
- 保持与Naive Admin设计风格一致
- 关注用户体验，交互要直观流畅
- 确保权限分配的正确性和实时性
- 预留扩展性，支持未来的权限管理需求
- 代码规范遵循项目统一标准
- 充分的错误处理和用户反馈