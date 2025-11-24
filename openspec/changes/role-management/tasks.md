# 角色模块开发任务清单

## 代码清理和准备

### 0. 清理和精简

- [x] **0.1 清理 RBAC 残留代码**

  - 移除 monitoring.service.ts 中的 PermissionService/RoleService 引用
  - 检查并清理其他 RBAC 相关残留代码
  - 验证清理效果

- [x] **0.2 精简 role.proto 接口**
  - 保留核心功能：角色 CRUD、用户分配、资源权限分配
  - 移除不必要的高级功能接口
  - 更新接口文档

## 后端角色模块开发

### 1. 角色服务层实现

- [x] **1.1 创建 RoleService 基础结构**

  - 角色 CRUD 操作（create, findOne, findAll, update, delete）
  - 角色用户关联管理（assignUsers, removeUsers, getRoleUsers）
  - 角色 Resource 权限关联管理（assignResources, removeResources, getRoleResources）
  - 基础权限验证（checkRoleExists, validateRoleData）
  - 基础统计信息（getRoleStatistics）

- [x] **1.2 实现角色权限树服务**
  - 基于 Resource 模型的权限树构建
  - 权限分配状态计算（is_assigned, is_indeterminate）
  - 权限树节点操作（展开/收起、懒加载）

### 2. 角色控制器实现

- [x] **2.1 创建 RoleController HTTP 接口（精简版）**
  - GET /api/roles/list - 角色列表查询
  - POST /api/roles/create - 创建角色
  - POST /api/roles/update - 更新角色
  - POST /api/roles/delete - 删除角色
  - GET /api/roles/:id/detail - 角色详情
  - POST /api/roles/:id/users - 分配用户
  - GET /api/roles/:id/tree - 权限树（基于 Resource）
  - GET /api/roles/statistics - 基础统计信息

### 3. 模块配置和依赖

- [x] **3.1 创建 RoleModule**

  - 依赖注入配置
  - 与 ResourceModule、UserModule 的依赖关系
  - Prisma 关系配置

- [x] **3.2 更新应用模块**
  - 在 app.module.ts 中注册 RoleModule
  - 配置全局管道和过滤器

## 前端角色模块开发

### 4. 基础角色管理界面（第一阶段）

- [ ] **4.1 创建系统管理路由配置**

  - 在 router/modules/ 下创建 system-manage.ts
  - 配置 system-manage/role 相关路由
  - 权限控制和菜单配置

- [ ] **4.2 创建角色列表页面**

  - views/RoleList.vue - 角色列表主界面（system-manage/role/index）
  - 支持搜索、筛选、分页
  - 批量操作功能

- [ ] **4.3 创建角色表单组件**

  - components/RoleForm.vue - 角色创建/编辑表单
  - 表单验证和错误处理
  - 成功/失败反馈

- [ ] **4.4 创建角色用户管理界面**
  - views/RoleUsers.vue - 角色用户分配界面（system-manage/role/users）
  - 用户搜索和选择
  - 批量分配/移除用户

### 5. 角色权限管理界面（第二阶段）

- [ ] **5.1 创建权限树组件**

  - components/ResourcePermissionTree.vue - 基于 Resource 的权限树
  - 支持多选、部分选中状态
  - 懒加载和虚拟滚动

- [ ] **5.2 创建权限管理界面**
  - views/RolePermissions.vue - 角色权限分配界面（system-manage/role/permissions）
  - 集成 ResourcePermissionTree 组件
  - 权限保存和更新功能

### 6. 状态管理和 API

- [ ] **6.1 角色状态管理**

  - store/modules/role.ts - Pinia store
  - 角色列表、当前角色、权限状态
  - 异步操作状态管理

- [ ] **6.2 API 请求封装**
  - request/api/role.ts - 角色 API 函数
  - 统一错误处理和拦截器
  - TypeScript 类型支持

## 测试数据准备

### 7. 准备测试数据

- [ ] **7.1 创建基础测试角色**

  - 管理员角色（admin）- 全部权限
  - 普通用户角色（user）- 基础权限
  - 查看者角色（viewer）- 只读权限
  - 自定义测试角色（test-role-1, test-role-2）

- [ ] **7.2 准备测试数据脚本**
  - SQL 脚本：插入测试角色数据
  - Seed 脚本：Prisma 数据库种子数据
  - 清理脚本：清理测试数据

## 集成和测试

### 8. 前后端联调验证

- [ ] **8.1 基础功能测试**

  - 角色 CRUD 操作测试
  - 用户分配/移除测试
  - 前后端数据格式验证

- [ ] **8.2 权限管理测试**
  - Resource 权限树获取测试
  - 角色 Resource 权限分配测试
  - 权限状态计算验证

### 9. 用户体验优化

- [ ] **9.1 性能优化**

  - 权限树懒加载实现
  - 大数据量分页优化
  - 缓存策略实现

- [ ] **9.2 交互优化**
  - 加载状态和骨架屏
  - 操作确认和反馈
  - 表单验证和错误提示

## 最终集成

### 10. 用户 s.proto 补充和验证

- [ ] **10.1 补充 users.proto role_ids 字段**

  - 更新用户信息接口
  - 集成角色信息的用户查询

- [ ] **10.2 整体验证测试**
  - 完整功能流程测试
  - 数据一致性验证
  - 性能和稳定性测试

## 任务优先级

### 高优先级（必须完成）

1. 清理 RBAC 残留代码
2. 精简 role.proto 接口
3. RoleService 基础实现
4. RoleController 核心接口
5. 角色列表页面（system-manage/role）
6. 前后端基础联调

### 中优先级（重要功能）

1. 角色用户管理界面
2. 权限树组件和权限管理
3. 测试数据准备
4. 性能和交互优化

### 低优先级（增强功能）

1. 高级搜索和筛选
2. 角色权限预览
3. 操作日志和审计
4. 批量操作优化

## 依赖关系

- **后端服务** 依赖于清理后的 Prisma Schema 和精简的 Proto 定义
- **前端组件** 依赖于后端 API 和 system-manage 路由架构
- **权限树** 依赖于 Resource 模块的树形结构
- **用户管理** 依赖于 User 模块的数据结构

## 验证标准

每个任务完成后应满足：

- 代码符合项目规范（Oxlint, TypeScript）
- 功能测试通过
- 前后端接口验证通过
- 用户体验符合预期（system-manage/role 路由）
- 性能指标满足要求
