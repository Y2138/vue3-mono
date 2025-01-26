import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginVueJsx } from '@rsbuild/plugin-vue-jsx';
import { pluginBabel } from '@rsbuild/plugin-babel'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/rspack';
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack'
import { presetIcons, presetUno, presetAttributify } from 'unocss'
// import markdownLoader

export default defineConfig({
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/
    }),
    pluginVue(),
    pluginVueJsx()
  ],
  source: {
    exclude: ['node_modules/@vicons/ionicons5/README.md'],
  },
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'https://guanli-platform.qimao.com',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': '',
        },
      },
    }
  },
  tools: {
    rspack: {
      loader: {

      },
      plugins: [
        Components({
          resolvers: [NaiveUiResolver()],
        }),
        UnoCSSRspackPlugin({
          presets: [
            presetUno(),
            presetAttributify({
              prefix: 'uc-',
            }),
            presetIcons(),
          ],
          rules: [
            ['shadow-rs', { 'box-shadow': '0 1px 4px #00152914' }],
          ],
          theme: {
            colors: {
              primary: 'var(--n-link-text-color-active)',
              // success: 'var(',
              // warning: '#faad14',
              // error: '#f5222d',
              // info: '#1890ff',
            },
          },
          // rules: [{
          //   /fz-/
          // }],
          shortcuts: {
            'flex-center': 'flex items-center justify-center',
            'flex-start': 'flex items-center justify-start',
            'flex-between': 'flex items-center justify-between',
            'flex-around': 'flex items-center justify-around',
          },
        })
      ]
    }
  }
});
