# 后端角色服务规范

## 概述

后端角色服务基于现有的 Prisma 数据模型和精简的 Proto 定义，实现完整的基于 Resource 的角色管理功能，替代原有的 RBAC 权限管理方案。

## ADDED Requirements

### Requirement: 角色基础 CRUD 功能 MUST

系统 MUST 提供角色的创建、查询、更新和删除功能。

#### Scenario: 创建新角色

- **GIVEN** 有效的角色数据（名称、描述、资源权限）
- **WHEN** 管理员提交创建请求
- **THEN** 系统创建新角色并返回完整角色信息

#### Scenario: 查询角色列表

- **GIVEN** 用户具有角色查看权限
- **WHEN** 请求获取角色列表
- **THEN** 返回分页的角色列表和总数

#### Scenario: 更新角色信息

- **GIVEN** 存在的角色记录
- **WHEN** 管理员提交更新请求
- **THEN** 系统更新角色信息并返回更新后的结果

#### Scenario: 删除角色

- **GIVEN** 存在的角色记录且未被用户使用
- **WHEN** 管理员提交删除请求
- **THEN** 系统删除角色并返回成功状态

### Requirement: 基于 Resource 的权限管理 MUST

角色权限分配 MUST 基于 Resource 而非 Permission。

#### Scenario: 分配资源权限给角色

- **GIVEN** 存在的角色和资源列表
- **WHEN** 管理员为角色分配资源权限
- **THEN** 系统建立角色-资源关联关系

#### Scenario: 移除角色资源权限

- **GIVEN** 已存在的角色-资源关联
- **WHEN** 管理员移除特定资源权限
- **THEN** 系统删除对应的关联关系

### Requirement: 用户角色关联管理 MUST

用户与角色的关联关系 MUST 可被管理。

#### Scenario: 为用户分配角色

- **GIVEN** 存在的用户和角色
- **WHEN** 管理员为用户分配角色
- **THEN** 系统建立用户-角色关联关系

#### Scenario: 移除用户角色

- **GIVEN** 已存在的用户-角色关联
- **WHEN** 管理员移除用户角色
- **THEN** 系统删除对应的关联关系

### Requirement: 权限验证和统计 MUST

系统 MUST 提供角色权限验证和统计功能。

#### Scenario: 验证用户角色权限

- **GIVEN** 用户 ID 和可选的角色 ID
- **WHEN** 调用角色权限验证接口
- **THEN** 返回用户的角色信息或指定角色的验证结果

#### Scenario: 获取角色统计信息

- **GIVEN** 用户具备查看统计的权限
- **WHEN** 调用角色统计接口
- **THEN** 返回角色相关的统计数据，如总数量、活跃数量等

## MODIFIED Requirements

### Requirement: 角色数据模型调整 MUST

角色数据模型 MUST 基于 Resource 而非 Permission 进行重构。

#### Scenario: 角色关联资源权限

- **GIVEN** 基于 Resource 的角色权限模型
- **WHEN** 查询角色的权限信息
- **THEN** 返回基于 Resource 的权限结构，不包含 Permission 相关信息

### Requirement: Service 接口精简 MUST

RoleService 接口 MUST 移除 Permission 相关方法。

#### Scenario: 权限分配接口调整

- **GIVEN** 管理员需要分配权限给角色
- **WHEN** 调用权限分配方法
- **THEN** 系统基于 Resource 进行权限分配，不涉及 Permission 操作

### Requirement: HTTP 接口 RESTful 化 MUST

角色管理 API 接口 MUST 符合 RESTful 规范。

#### Scenario: 角色 CRUD 接口

- **GIVEN** 标准 RESTful API 需求
- **WHEN** 使用 HTTP 方法访问角色接口
- **THEN** 返回符合 RESTful 规范的响应格式

## REMOVED Requirements

### Requirement: 移除基于 Permission 的 API 接口

基于 Permission 的 API 接口 MUST 被完全移除。

- **Reason**: 转向基于 Resource 的权限模型
- **Migration**: 使用基于 Resource 的权限管理 API 替代

### Requirement: 清理 Role 数据模型 Permission 关联

Role 模型中的 Permission 关联关系 MUST 被移除。

- **Reason**: 简化数据模型，基于 Resource 进行权限管理
- **Migration**: 移除 role_permissions 关联，仅保留 role_resources 关联

### Requirement: 移除 PermissionService 支持

PermissionService MUST 不再支持 Role 模块功能。

- **Reason**: 权限模型重构，减少模块耦合
- **Migration**: Role 权限管理独立实现，不依赖 PermissionService

### Requirement: 清理权限树服务 Permission 逻辑

权限树服务中的 Permission 相关逻辑 MUST 被移除。

- **Reason**: 权限树完全基于 Resource 构建
- **Migration**: 重写权限树构建逻辑，仅使用 Resource 层级关系

### Requirement: 移除 proto 中的 Permission 定义

role.proto 中的 Permission 相关定义 MUST 被清理。

- **Reason**: 精简 proto 定义，专注于 Resource-based 权限
- **Migration**: 移除 Permission 相关的消息类型和 RPC 接口

### Requirement: 清理权限检查逻辑

系统中基于 Permission 的权限检查逻辑 MUST 被移除。

- **Reason**: 统一使用基于 Resource 的权限检查
- **Migration**: 重写所有权限检查逻辑，完全基于 Resource

## 技术约束

1. **数据一致性**: 使用 Prisma 事务确保角色、资源、用户关联的一致性
2. **性能优化**: 避免 N+1 查询，使用适当的索引和预加载
3. **错误处理**: 提供清晰的错误信息和状态码
4. **类型安全**: 遵循 TypeScript 严格模式，确保类型安全
5. **安全验证**: 实施权限验证和数据访问控制

## 依赖关系

- **Prisma Schema**: 基于现有的 Role, UserRole, RoleResource 模型
- **Resource 模块**: 依赖 Resource 服务的树形结构
- **精简的 proto 定义**: 基于更新后的 role.proto 消息类型
