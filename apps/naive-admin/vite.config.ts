import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import UnoCSS from 'unocss/vite';
import path from 'path';
// import vitePluginMockProxy from 'vite-plugin-mock-proxy';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
    UnoCSS(),
    // vitePluginMockProxy({
    //   port: 6768,
    //   debug: true,
    //   include: ['/api/column/column/index'],
    // }),
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
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
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
    },
  },
});
