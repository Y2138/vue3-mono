## 项目结构介绍

- packages 所有包
- tsconfig.base.json 基础 tsconfig 配置，子包可以继承此配置

## packages 介绍

- share: 共享包 提供公共 js 方法、公共静态文件（css、svg/image、fonts）、公共utils文件、公共hooks等
- app1: vue2 + ts 项目；引用了 share
- components: 公共组件
- docs: 组件库
- configs: 配置相关

## pnpm 命令
- `pnpm add xxx -w` 为工作区根目录添加依赖
- `pnpm add a --workspace -F b` 将a包作为b包的依赖安装
