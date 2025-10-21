# Proto 类型同步报告

**生成时间**: 2025-10-21 10:44:08

## 📁 目录结构

```
protos/
├── common.proto      # 通用类型定义
├── users.proto       # 用户相关类型
├── rbac.proto        # 权限管理类型
└── README.md         # Proto 文档

server/nest-main/src/shared/     [后端 - 完整版]
├── common.ts         # 通用类型 (包含 gRPC)
├── users.ts          # 用户类型 (包含 gRPC)
├── rbac.ts           # 权限类型 (包含 gRPC)
└── index.ts          # 导出文件

apps/naive-admin/src/shared/     [前端 - 纯净版]
├── common.ts         # 通用类型 (纯 TypeScript)
├── users.ts          # 用户类型 (纯 TypeScript)
├── rbac.ts           # 权限类型 (纯 TypeScript)
└── index.ts          # 导出文件
```

## 📊 统计信息

- **后端类型**:        4 个文件, 812 行代码 (包含 gRPC 相关代码)
- **前端类型**:        5 个文件, 464 行代码 (纯净 TypeScript 接口)

## 🔄 同步流程

1. **Proto 定义** → `protos/*.proto`
2. **后端类型生成** → `server/nest-main/src/shared/*.ts` (完整版，包含 gRPC)
3. **前端类型生成** → `apps/naive-admin/src/shared/*.ts` (纯净版，仅接口)
4. **前后端使用** → 确保接口类型一致性

## 📝 使用说明

### 后端使用 (包含 gRPC 功能)
```typescript
import { User, LoginRequest, AuthResponse } from '../../shared/users'
import { Permission, Role } from '../../shared/rbac'
// 可以使用 gRPC 相关功能
```

### 前端使用 (纯净 TypeScript 接口)
```typescript
import { User, LoginRequest, AuthResponse } from '@/shared/users'
import { Permission, Role } from '@/shared/rbac'
// 仅包含类型定义，无 gRPC 依赖
```

## ⚠️ 注意事项

1. **不要手动修改** `shared/` 目录下的文件，它们是自动生成的
2. **修改接口定义** 请编辑 `protos/*.proto` 文件
3. **重新生成类型** 运行 `./scripts/sync-proto-types.sh`
4. **后端 vs 前端**:
   - 后端：完整的 proto 生成文件，支持 gRPC
   - 前端：纯净的 TypeScript 接口，无外部依赖
5. **保持同步** 前后端开发时确保使用相同版本的类型定义

## 🎯 优势

- **类型一致性**: 前后端使用相同的接口定义
- **无依赖冲突**: 前端类型文件无 gRPC 依赖
- **开发效率**: 自动化生成，减少手动维护
- **类型安全**: 编译时发现接口不匹配问题

---
*此报告由 sync-proto-types.sh 脚本自动生成*
