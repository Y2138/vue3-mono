import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginVueJsx } from '@rsbuild/plugin-vue-jsx';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSass } from '@rsbuild/plugin-sass';
import ElementPlus from 'unplugin-element-plus/webpack'

export default defineConfig({
  plugins: [
    pluginVue(), pluginVueJsx(), pluginSass(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/
    })
  ],
  tools: {
    rspack: {
      plugins: [ElementPlus()]
    }
  }
});
