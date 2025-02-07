import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify({
      prefix: 'uc-',
    }),
    // 使用css图标
    presetIcons(),
  ],
  safelist: [
    'transition-transform-1000',
    // (context) => {
    //   let arr: number[] = [], i = 3
    //   while (i < 60) {
    //     arr.push(i * 50)
    //   }
    //   return arr.map(v => `transition-transform-${v}`)
    // }
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
