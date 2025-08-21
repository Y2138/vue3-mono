# Proto 文件路径修复

## 问题描述

在启动 NestJS 应用程序时，遇到以下错误：

```
ERROR [Server] ENOENT: no such file or directory, open '/Users/staff/Documents/my-tools/vue3-mono/server/nest-main/dist/protos/users.proto'
Error: The invalid .proto definition (file at "/Users/staff/Documents/my-tools/vue3-mono/server/nest-main/dist/protos/users.proto" not found)
```

这个错误表明 NestJS 无法找到 gRPC 服务所需的 proto 文件。

## 问题分析

通过检查代码和项目结构，发现以下问题：

1. **路径配置不正确**：在 main.ts 文件中，proto 文件的路径配置为 `join(__dirname, '../protos/users.proto')`，这意味着系统会在 `server/nest-main/dist/protos/` 目录下查找 proto 文件
2. **实际文件位置**：proto 文件实际位于项目根目录的 protos 文件夹中（`vue3-mono/protos/`），而不是 server/nest-main 目录下

## 解决方案

修改 main.ts 文件中的 gRPC 配置，调整 proto 文件的路径：

```diff
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.GRPC,
  options: {
    package: ['users', 'rbac', 'common'],
    protoPath: [
-      join(__dirname, '../protos/users.proto'),
-      join(__dirname, '../protos/rbac.proto'),
-      join(__dirname, '../protos/common.proto'),
+      join(__dirname, '../../protos/users.proto'),
+      join(__dirname, '../../protos/rbac.proto'),
+      join(__dirname, '../../protos/common.proto'),
    ],
    url: `0.0.0.0:${grpcPort}`,
    // ... 其他配置
  },
});
```

## 修复原理

1. **路径调整**：
   - 原来的路径 `../protos/` 是相对于 `dist` 目录的，指向 `server/nest-main/protos/`
   - 修改后的路径 `../../protos/` 是相对于 `dist` 目录的，指向项目根目录的 `protos/` 文件夹
   - 这样 NestJS 就能正确找到 proto 文件

2. **编译后路径**：
   - 需要注意的是，`__dirname` 在编译后指向的是 `dist` 目录
   - 因此需要使用 `../../` 来引用项目根目录中的文件

## 建议

1. **统一文件位置**：
   - 考虑将 proto 文件移动到 `server/nest-main/protos/` 目录下，使其与服务在同一目录结构中
   - 或者在构建过程中复制 proto 文件到编译输出目录

2. **使用环境变量**：
   - 考虑使用环境变量来配置 proto 文件的路径，这样可以更灵活地适应不同的部署环境

3. **添加构建脚本**：
   - 在 package.json 中添加构建脚本，确保 proto 文件被正确复制到编译输出目录

通过这些修改，应用程序现在可以正确加载 proto 文件，gRPC 服务可以正常启动。
