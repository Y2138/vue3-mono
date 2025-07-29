import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import UnoCSS from 'unocss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { protobufPlugin } from './vite-plugins/protobuf';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    UnoCSS(), // UnoCSS 插件
    Components({
      resolvers: [NaiveUiResolver()],
    }),
    // 添加 Protobuf 插件
    protobufPlugin({
      protoDir: path.resolve(__dirname, '../../protos'),
      outputDir: path.resolve(__dirname, './src/shared'),
      protoFiles: ['common.proto', 'health.proto', 'rbac.proto', 'users.proto'],
      watch: true, // 开发模式下监听文件变化
      debug: process.env.NODE_ENV === 'development', // 开发模式下显示调试信息
      protocOptions: [] // 可以添加额外的 protoc 选项
    }),
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      /* 开发环境启用sw */
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^index.html$/]
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/proto': path.resolve(__dirname, '../../protos')
    }
  },
  define: {
    // 注入环境变量
    __GRPC_ENDPOINT__: JSON.stringify(process.env.VITE_GRPC_ENDPOINT || 'http://localhost:3000'),
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000'),
    __PREFER_GRPC__: JSON.stringify(process.env.VITE_PREFER_GRPC === 'true'),
    __PROTO_DEBUG__: JSON.stringify(process.env.VITE_PROTO_DEBUG === 'true'),
  },
  server: {
    port: 6767,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 添加 gRPC-Web 代理支持
      '/grpc': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // 支持 WebSocket
      },
    },
  },
  optimizeDeps: {
    include: [
      'google-protobuf',
      'grpc-web',
      '@grpc/grpc-js',
      '@grpc/proto-loader'
    ]
  },
  // 构建选项
  build: {
    // 确保构建时也生成 protobuf 类型
    rollupOptions: {
      // 可以在这里添加额外的配置
    }
  }
});
