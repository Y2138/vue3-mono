import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/rspack';
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack'
import { presetIcons, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  plugins: [
    pluginVue(),
  ],
  tools: {
    rspack: {
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
            ['shadow-rs', { 'box-shadow': '0 1px 4px #00152914' } ]
          ],
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
