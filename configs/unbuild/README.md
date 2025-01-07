## unbuild
提供一套 `unbuild` 的打包配置，`unbuild` 通常用来开发工具库
`unbuild`: 基于 `rollup` 的打包工具
- 内置ts支持
- 集成 `jiti` ,开发

## 使用unbuild

### 安装unbuild
使用此配置说明你打算使用 `unbuild` 来打包你的工具库
需要安装：`pnpm add unbuild`
将 `build` 命令添加至 `scripts` 中
```json
{
    "scripts": {
        "build": "unbuild"
    }
}
```

### 使用配置
`pnpm add @mono-configs/unbuild`
在根目录的 `build.config.ts` 中添加以下配置
```js
import libBuildConfig from '@mono-configs/unbuild/lib'

export default libBuildConfig(/* YourOptions */)
```
也可以利用 `unbuild` 的 `preset` 配置
```js
import { defineBuildConfig } from 'unbuild'
import { presetConfig } from '@mono-configs/unbuild/lib'

export default defineBuildConfig({
    // YourOptions
    preset: {
        ...presetConfig
    }
})
```
