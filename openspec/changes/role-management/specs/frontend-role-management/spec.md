# 前端角色管理规范

## 概述

前端角色管理基于 Vue 3.5.22、Naive UI、Pinia 等技术栈，实现完整的基于 Resource 的角色管理界面，替代原有的 RBAC 权限管理方案。页面路由为 system-manage/role 子模块形式。

## ADDED Requirements

### Requirement: 基础角色管理界面 MUST

系统 MUST 提供完整的角色管理界面，支持角色的增删改查操作。

#### Scenario: 角色列表展示

- **GIVEN** 用户具有角色管理权限
- **WHEN** 访问角色管理页面
- **THEN** 显示分页的角色列表，包含角色信息和操作按钮

#### Scenario: 创建新角色

- **GIVEN** 用户在角色列表页面点击创建按钮
- **WHEN** 填写角色信息并提交
- **THEN** 创建新角色并更新列表显示

#### Scenario: 编辑角色信息

- **GIVEN** 用户在角色列表中选择编辑操作
- **WHEN** 修改角色信息并保存
- **THEN** 更新角色信息并反映在列表中

#### Scenario: 删除角色

- **GIVEN** 用户选择要删除的角色
- **WHEN** 确认删除操作
- **THEN** 删除角色并从列表中移除

### Requirement: 基于 Resource 的权限管理界面 MUST

角色权限分配 MUST 通过 Resource 树形界面进行操作。

#### Scenario: 权限树展示

- **GIVEN** 管理员访问角色权限分配页面
- **WHEN** 页面加载完成
- **THEN** 显示基于 Resource 的树形权限结构，包含选中状态

#### Scenario: 批量权限分配

- **GIVEN** 管理员在权限树中选择多个资源
- **WHEN** 保存权限设置
- **THEN** 系统保存角色与选中资源的关联关系

#### Scenario: 权限状态同步

- **GIVEN** 角色已分配部分权限
- **WHEN** 加载权限管理页面
- **THEN** 权限树正确显示已分配的权限状态

### Requirement: 角色用户关联管理 MUST

用户与角色的关联关系 MUST 可在前端界面中管理。

#### Scenario: 查看角色用户

- **GIVEN** 管理员选择查看特定角色的用户
- **WHEN** 打开角色用户管理弹窗
- **THEN** 显示该角色下的用户列表，支持分页

#### Scenario: 为角色分配用户

- **GIVEN** 管理员在角色用户管理页面
- **WHEN** 选择用户并分配给角色
- **THEN** 建立用户-角色关联关系并在列表中更新显示

#### Scenario: 移除用户角色

- **GIVEN** 用户已在角色的用户列表中
- **WHEN** 管理员移除该用户
- **THEN** 删除用户-角色关联关系并更新显示

## MODIFIED Requirements

### Requirement: 角色管理路由结构调整 MUST

角色管理 MUST 集成到 system-manage 模块的子路由中。

#### Scenario: 角色管理路由重构

- **GIVEN** 系统采用模块化路由结构
- **WHEN** 访问角色管理功能
- **THEN** 路由正确指向 system-manage/role 路径，显示角色管理界面

#### Scenario: 页面布局适配

- **GIVEN** 角色管理页面作为独立页面
- **WHEN** 调整为系统管理子模块
- **THEN** 页面布局适配系统管理的整体布局风格，保持一致性

### Requirement: API 接口适配 Resource 权限 MUST

前端 API 调用 MUST 适配后端基于 Resource 的权限管理接口。

#### Scenario: 权限管理 API 重构

- **GIVEN** 现有的基于 Permission 的 API 接口
- **WHEN** 重构为基于 Resource 的 API 调用
- **THEN** 前端调用 assignResources/removeResources 等新的 API 方法

#### Scenario: 权限树数据处理

- **GIVEN** PermissionTreeNode 数据结构
- **WHEN** 处理 Resource 权限树数据
- **THEN** 组件正确处理 Resource 树形结构，显示资源层级关系

### Requirement: 状态管理架构优化 MUST

角色管理状态管理 MUST 适配新的 Resource 权限模型。

#### Scenario: Store 结构精简

- **GIVEN** 复杂的权限相关状态
- **WHEN** 简化状态管理逻辑
- **THEN** 移除 Permission 相关状态，保留 Resource 权限管理状态

#### Scenario: 类型定义更新

- **GIVEN** 现有的类型定义
- **WHEN** 更新类型定义以适应 Resource 权限模型
- **THEN** 类型定义与后端精简的 proto 定义保持一致

## REMOVED Requirements

### Requirement: 移除 PermissionTree 组件 MUST

基于 Permission 的权限树组件 MUST 被移除。

- **Reason**: 转向基于 Resource 的权限树实现
- **Migration**: 使用 ResourcePermissionTree 组件替代

### Requirement: 清理 Permission 相关 Store MUST

权限管理 Store 中的 Permission 相关逻辑 MUST 被清理。

- **Reason**: 简化状态管理，专注于 Resource 权限
- **Migration**: 重构 Store 逻辑，移除 Permission 相关方法和状态

### Requirement: 移除过时的权限检查组件 MUST

前端基于 Permission 的权限检查逻辑 MUST 被移除。

- **Reason**: 统一使用基于 Resource 的权限检查
- **Migration**: 重写权限检查逻辑，完全基于 Resource 实现

### Requirement: 清理权限相关类型定义 MUST

TypeScript 类型定义中的 Permission 相关内容 MUST 被移除。

- **Reason**: 保持类型定义与新架构的一致性
- **Migration**: 更新类型定义，移除 Permission 相关类型，保留 Resource 类型

### Requirement: 移除独立路由配置 MUST

独立的角色管理路由配置 MUST 被移除。

- **Reason**: 统一系统管理模块的路由结构
- **Migration**: 调整为 system-manage 子模块路由配置

## 技术约束

1. **Vue 3 Composition API**: 使用 `<script setup>` 语法和 Composition API
2. **Naive UI 组件库**: 统一使用 Naive UI 组件库进行界面开发
3. **TypeScript 严格模式**: 遵循 TypeScript 严格模式，禁止使用 any 类型
4. **响应式状态管理**: 使用 Pinia 进行状态管理，确保响应式数据更新
5. **路由懒加载**: 使用 Vue Router 的动态导入实现路由懒加载
6. **组件化开发**: 遵循项目组件分层规范，合理拆分业务组件

## 依赖关系

- **后端 API**: 依赖精简后的角色管理 API 接口
- **Resource 模块**: 依赖 Resource 模块的树形结构数据
- **共享类型**: 依赖更新后的 Proto 生成的 TypeScript 类型定义
- **系统管理模块**: 作为 system-manage 的子模块存在

## 性能要求

1. **懒加载**: 权限树和其他大数据量组件使用懒加载
2. **缓存策略**: 合理缓存角色列表和权限树数据
3. **分页支持**: 大数据量场景下使用分页加载
4. **防抖搜索**: 搜索功能使用防抖优化性能 redirect: '/system-manage/role/list', meta: { title: '角色管理', icon: 'material-symbols:security', permission: 'role:read' }, children: [ { path: 'list', name: 'RoleList', component: () => import('@/views/role/index.vue'), meta: { title: '角色列表', permission: 'role:read' } }, { path: 'create', name: 'RoleCreate', component: () => import('@/views/role/components/RoleForm.vue'), meta: { title: '创建角色', permission: 'role:create', hidden: true } }, { path: ':id/edit', name: 'RoleEdit', component: () => import('@/views/role/components/RoleForm.vue'), meta: { title: '编辑角色', permission: 'role:update', hidden: true } }, { path: ':id/permissions', name: 'RolePermissions', component: () => import('@/views/role/components/PermissionAssign.vue'), meta: { title: '角色权限', permission: 'role:permission', hidden: true } } ] }

````

## 国际化规范

### 1. 多语言支持

```typescript
// i18n/zh-CN/role.ts
export default {
  role: {
    title: '角色管理',
    list: '角色列表',
    create: '创建角色',
    edit: '编辑角色',
    delete: '删除角色',
    permission: '权限分配',
    users: '用户分配',

    fields: {
      name: '角色名称',
      description: '角色描述',
      status: '状态',
      isActive: '是否启用',
      isSuperAdmin: '是否超级管理员',
      userCount: '用户数量',
      permissionCount: '权限数量',
      createdAt: '创建时间',
      updatedAt: '更新时间'
    },

    status: {
      active: '启用',
      inactive: '禁用',
      superAdmin: '超级管理员'
    },

    actions: {
      create: '创建角色',
      edit: '编辑',
      delete: '删除',
      assignPermissions: '分配权限',
      assignUsers: '分配用户',
      viewDetails: '查看详情'
    },

    confirm: {
      delete: '确定要删除该角色吗？此操作不可恢复。',
      deleteTitle: '删除角色'
    },

    messages: {
      createSuccess: '角色创建成功',
      updateSuccess: '角色更新成功',
      deleteSuccess: '角色删除成功',
      permissionAssignSuccess: '权限分配成功',
      userAssignSuccess: '用户分配成功'
    }
  }
}
````

## 性能优化规范

### 1. 虚拟滚动

```typescript
// 大量数据的虚拟滚动处理
import { VirtualList } from 'vueuc'

<VirtualList
  :items="filteredRoles"
  :item-size="60"
  :container-height="400"
>
  <template #default="{ item }">
    <RoleListItem :role="item" />
  </template>
</VirtualList>
```

### 2. 懒加载

```typescript
// 权限树懒加载
const loadChildren = async (parentId: string) => {
  const children = await fetchResourceChildren(parentId)
  return children.map((child) => ({
    ...child,
    loading: false,
    children: []
  }))
}
```

### 3. 缓存策略

```typescript
// 权限树缓存
const permissionCache = new Map<string, RolePermissionTreeNode[]>()

const getCachedPermissionTree = (roleId: string) => {
  const cached = permissionCache.get(roleId)
  if (cached && !isCacheExpired(cached)) {
    return cached
  }
  return fetchAndCachePermissionTree(roleId)
}
```

## 响应式设计规范

### 1. 移动端适配

```vue
<template>
  <div class="role-management" :class="{ mobile: isMobile }">
    <!-- 移动端适配的布局 -->
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')
</script>
```

## 错误处理规范

### 1. 统一错误处理

```typescript
// request/role.ts
import { message } from 'naive-ui'

export const handleRoleError = (error: any) => {
  if (error.code === 'ROLE_NOT_FOUND') {
    message.error('角色不存在')
  } else if (error.code === 'ROLE_NAME_EXISTS') {
    message.error('角色名称已存在')
  } else if (error.code === 'PERMISSION_DENIED') {
    message.error('没有权限执行此操作')
  } else {
    message.error(error.message || '操作失败')
  }
}
```

## 测试规范

### 1. 单元测试

```typescript
// tests/role-store.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { useRoleStore } from '@/store/modules/role'

describe('RoleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should create role', async () => {
    const roleStore = useRoleStore()

    const roleData = {
      name: 'Test Role',
      description: 'Test Description',
      isActive: true,
      isSuperAdmin: false
    }

    await roleStore.createRole(roleData)

    expect(roleStore.roles).toHaveLength(1)
    expect(roleStore.roles[0].name).toBe('Test Role')
  })
})
```

### 2. E2E 测试

```typescript
// tests/e2e/role.cy.ts
describe('Role Management', () => {
  it('should create a new role', () => {
    cy.visit('/role/list')
    cy.get('[data-testid="create-role-button"]').click()
    cy.get('[data-testid="role-name-input"]').type('New Role')
    cy.get('[data-testid="role-description-input"]').type('Role Description')
    cy.get('[data-testid="submit-button"]').click()
    cy.contains('角色创建成功').should('be.visible')
  })
})
```

## 规范约束

1. **组件设计**: 遵循单一职责原则，组件职责明确
2. **状态管理**: 使用 Pinia 进行状态管理，避免全局状态污染
3. **类型安全**: 全面使用 TypeScript，确保类型安全
4. **性能优化**: 实现虚拟滚动、懒加载等性能优化措施
5. **用户体验**: 提供加载状态、错误处理、成功反馈
6. **可访问性**: 遵循 WCAG 规范，支持键盘导航和屏幕阅读器
7. **测试覆盖**: 提供单元测试和 E2E 测试覆盖
8. **代码规范**: 遵循项目 ESLint 和 Prettier 配置
