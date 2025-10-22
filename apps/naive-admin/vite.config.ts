import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import UnoCSS from 'unocss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { protobufPlugin } from './vite-plugins/protobuf'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      vueJsx(),
      UnoCSS(), // UnoCSS 插件
      Components({
        resolvers: [NaiveUiResolver()]
      }),
      // 添加 Protobuf 插件 - 用于生成前端类型定义
      protobufPlugin({
        protoDir: path.resolve(__dirname, '../../protos'),
        outputDir: path.resolve(__dirname, './src/shared'),
        protoFiles: ['common.proto', 'health.proto', 'rbac.proto', 'users.proto'],
        watch: true, // 开发模式下监听文件变化
        debug: process.env.NODE_ENV === 'development', // 开发模式下显示调试信息
        protocOptions: [] // 可以添加额外的 protoc 选项
      }),
      process.env.NODE_ENV === 'production'
        ? VitePWA({
            injectRegister: 'auto',
            registerType: 'prompt',
            workbox: {
              swDest: `dist/sw.js`,
              cleanupOutdatedCaches: true, // 自动清理过期缓存
              globPatterns: [], // 要预先缓存的资源
              navigateFallback: null,
              runtimeCaching: [
                // 运行时缓存
                {
                  urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'assets-images-cache',
                    expiration: {
                      // 最多30个图
                      maxEntries: 30
                    }
                  }
                },
                {
                  urlPattern: /.*\.js$/,
                  handler: 'CacheFirst', // 因为 资源 hash总会变, 所以这种方式即可
                  options: {
                    cacheName: 'project-js-cache',
                    expiration: {
                      maxEntries: 30, // 最多缓存30个，超过的按照LRU原则删除
                      maxAgeSeconds: 7 * 24 * 60 * 60
                    },
                    cacheableResponse: {
                      statuses: [200]
                    }
                  }
                },
                {
                  urlPattern: /.*\.css.*/,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'project-css-cache',
                    expiration: {
                      maxEntries: 20,
                      maxAgeSeconds: 7 * 24 * 60 * 60
                    },
                    cacheableResponse: {
                      statuses: [200]
                    }
                  }
                },
                {
                  // 只匹配 HTML 页面，不匹配 API 接口
                  urlPattern: ({ request }) => {
                    // 只缓存导航请求（HTML页面）
                    return request.mode === 'navigate' || request.destination === 'document' || (request.url.includes(location.origin) && !request.url.includes('/api/') && !request.url.includes('.json') && request.headers.get('accept')?.includes('text/html'))
                  },
                  handler: 'NetworkFirst', // 网络优先
                  options: {
                    cacheName: 'project-html-cache',
                    cacheableResponse: {
                      statuses: [200],
                      headers: {
                        'Content-Type': 'text/html; charset=UTF-8'
                      }
                    }
                  }
                }
              ]
            },
            /* 开发环境启用sw */
            devOptions: {
              enabled: false,
              navigateFallbackAllowlist: [/^index.html$/]
            }
          })
        : null
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/proto': path.resolve(__dirname, '../../protos')
      }
    },
    define: {
      __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3030'),
      __PROTO_DEBUG__: JSON.stringify(process.env.VITE_PROTO_DEBUG === 'true')
    },
    server: {
      port: 6767,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3030',
          changeOrigin: true,
          secure: false
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    // 构建选项
    build: {
      // 确保构建时也生成 protobuf 类型
      rollupOptions: {
        // 可以在这里添加额外的配置
      }
    }
  }
})
