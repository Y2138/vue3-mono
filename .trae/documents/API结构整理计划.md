# API结构整理计划

## 问题分析
1. **重复接口**：`getRoles` 函数在 `resource.ts` 和 `role.ts` 中都有定义，实现不同但路径相同
2. **职责不清**：`resource.ts` 包含资源、权限和角色管理接口，需要分离
3. **类型定义混乱**：各文件中存在重复的类型定义

## 整理方案

### 1. 调整 resource.ts 文件
- 保留资源管理相关接口和类型
- 删除与角色管理相关的接口（如 `getRoles`）
- 删除权限管理相关的类型定义（如 `PermissionInfo`、`RoleInfo` 等）

### 2. 完善 role.ts 文件
- 确保角色管理相关接口完整
- 保留已有的 `getRoles`、`getRole`、`createRole`、`updateRole`、`deleteRole`、`previewPermissionsByRoleIds` 接口

### 3. 检查 users.ts 文件
- 确保用户管理和认证相关接口完整
- 检查是否有重复或未使用的接口

### 4. 优化 common.ts 文件
- 保留通用类型定义
- 确保其他文件正确引用

## 具体步骤
1. 检查并删除 `resource.ts` 中未使用的 `getRoles` 函数
2. 删除 `resource.ts` 中与权限、角色相关的类型定义
3. 确保 `resource.ts` 只包含资源管理相关接口
4. 检查 `role.ts` 中角色管理接口的完整性
5. 验证所有接口的使用情况，确保没有删除被使用的函数
6. 测试调整后的API结构，确保功能正常

## 预期结果
- API文件按模块职责清晰划分
- 没有重复的接口定义
- 所有接口都被正确使用
- 代码结构简洁清晰