## tsconfig配置
定义了一套通用的ts配置
- base.json 通用的规则，默认排除了 `node_modules`、`dist`、`.turbo` 等文件
- 

## 使用
安装：`pnpm add @mono-configs/tsconfig`
在项目目录下新增 tsconfig.json
增加 `"extends": "@mono-configs/tsconfig/base.json"`
