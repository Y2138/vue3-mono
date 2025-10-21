# 协议定义文件（已废弃）

⚠️ **注意：本目录中的 Protocol Buffers 文件已不再使用**

项目已从 gRPC 双协议架构迁移到纯 HTTP RESTful API 架构。这些 proto 文件保留仅作为历史记录。

## 📁 文件结构

```
protos/
├── common.proto      # 通用类型定义（已废弃）
├── users.proto       # 用户服务契约定义（已废弃）
├── rbac.proto        # 权限管理服务契约定义（已废弃）
├── health.proto      # 健康检查服务定义（已废弃）
└── README.md         # 本说明文档
```

## 🔄 架构变更说明

### 变更原因

- 简化架构复杂度
- 统一前后端通信协议
- 降低维护成本
- 提高开发效率

### 当前架构

项目现在使用：

- **后端**：NestJS HTTP RESTful API
- **前端**：基于 HTTP 的 API 调用
- **数据格式**：JSON
- **认证方式**：JWT Token

### 数据类型定义

原本在 proto 文件中定义的数据类型现在通过以下方式管理：

- **后端**：TypeScript 接口和 DTO 类
- **前端**：TypeScript 类型定义
- **共享类型**：通过 `packages/share` 包统一管理

## 📚 相关文档

- [后端 API 文档](../server/nest-main/README.md)
- [前端开发指南](../apps/naive-admin/README.md)
- [共享类型定义](../packages/share/README.md)

---

_如需了解当前的 API 接口定义，请参考后端项目的 OpenAPI 文档或控制器代码。_
