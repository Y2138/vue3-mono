# 数据转换器（Transformers）

## 概述

`transformers` 文件夹包含了一系列用于在不同数据格式之间进行转换的工具函数。主要用于处理以下数据转换场景：

1. **数据库实体（Entity）与 Protobuf 消息格式的相互转换**
2. **请求验证和数据清洗**
3. **通用数据转换和格式化**

这些转换器是系统中数据层与通信层之间的桥梁，确保数据在不同层之间传递时保持一致性和类型安全。

## 文件结构

- `index.ts` - 导出所有转换器，提供统一的访问点
- `common.transformer.ts` - 通用数据转换工具
- `rbac.transformer.ts` - 角色和权限数据转换器
- `user.transformer.ts` - 用户数据转换器

## 主要功能

### 通用转换器 (common.transformer.ts)

提供基础数据类型的转换功能：

- **TimestampTransformer**: 日期/时间戳转换
- **PaginationTransformer**: 分页数据处理
- **ResponseStatusTransformer**: 响应状态格式化
- **ArrayTransformer**: 数组数据处理
- **StringTransformer**: 字符串处理与验证
- **NumberTransformer**: 数字类型转换与验证

### RBAC 转换器 (rbac.transformer.ts)

处理角色和权限数据的转换：

- **PermissionTransformer**: 权限数据转换
- **RoleTransformer**: 角色数据转换
- **RbacTransformer**: RBAC 通用功能

### 用户转换器 (user.transformer.ts)

处理用户相关数据的转换：

- 用户实体与 Protobuf 消息的转换
- 登录/注册请求的验证和处理
- 认证响应的创建

## 使用方式

```typescript
// 导入特定转换器
import { TimestampTransformer } from './common/transformers';

// 或者导入分组转换器
import { CommonTransformers, UserTransformer, RbacTransformers } from './common/transformers';

// 使用示例
const timestamp = TimestampTransformer.toProtobuf(new Date());
```

## 设计原则

1. **职责单一**: 每个转换器只负责一种类型的数据转换
2. **无副作用**: 转换函数不应修改输入参数，而是返回新的数据对象
3. **类型安全**: 利用 TypeScript 类型系统确保转换的类型安全
4. **数据验证**: 在转换过程中进行必要的数据验证和清洗
5. **错误处理**: 对无效输入提供明确的错误信息

## 扩展指南

添加新的转换器时，请遵循以下步骤：

1. 创建新的转换器文件，命名为 `{domain}.transformer.ts`
2. 实现必要的转换函数，确保添加适当的注释和类型定义
3. 在 `index.ts` 中导出新的转换器
4. 更新此 README 文件，添加新转换器的说明
