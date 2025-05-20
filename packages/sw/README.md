# @mono-packages/sw

一个简单易用的 Service Worker 工具库，提供页面缓存和资源更新能力模版。

## 功能特点

- 🚀 **自动更新**：检测并通知前端新版本可用
- 💾 **智能缓存**：对静态资源和 CDN 资源采用合理的缓存策略
- 🔄 **版本控制**：自动处理不同版本 Service Worker 的切换
- 📦 **预缓存支持**：支持预先缓存关键资源，提供离线访问能力
- 🛠️ **灵活配置**：提供丰富的配置选项满足不同需求

## 快速开始
### Vite 集成

使用 `vite-plugin-pwa` 的 `injectManifest` 模式来使用该 sw.ts 文件

*在 src/ 目录下新建一个 sw.ts 文件，将本项目的 `src/sw.ts` 复制过去即可*

安装 `vite-plugin-pwa` 和 `workbox` 依赖
`pnpm add vite-plugin-pwa`
`pnpm add workbox-core workbox-routing workbox-strategies workbox-expiration workbox-precaching -D`

```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    /* ... */
    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
      },
      /* 开发环境启用sw */
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^index.html$/]
      },
    }),
  ]
})
```

### Webpack 集成(暂未尝试)

对于 Webpack, 可以结合 `copy-webpack-plugin` 使用:

```js
// webpack.config.js
const { generateSWFile } = require('@mono-packages/sw');
const path = require('path');
const fs = require('fs');

class ServiceWorkerPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('ServiceWorkerPlugin', (compilation) => {
      const outputPath = compiler.outputPath;
      const swPath = path.join(outputPath, 'sw.js');
      
      generateSWFile({
        cachePrefix: 'myapp',
        cdnDomains: ['cdn.example.com'],
      }, swPath);
    });
  }
}

module.exports = {
  // webpack配置
  plugins: [
    new ServiceWorkerPlugin()
  ]
};
``` 