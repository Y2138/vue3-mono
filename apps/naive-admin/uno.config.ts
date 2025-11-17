import { defineConfig, presetAttributify } from 'unocss'
import presetWind3 from '@unocss/preset-wind3'

export default defineConfig({
  // 预设
  presets: [
    presetWind3(), // 默认预设，包含 Tailwind CSS 兼容类
    presetAttributify() // 属性化模式支持
    // presetIcons({
    //   scale: 1.2,
    //   warn: false, // 关闭图标警告，避免误识别
    //   collections: {
    //     // 只启用实际需要的图标集
    //     // carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
    //     // mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default),
    //   }
    // })
  ],

  // 自定义规则
  rules: [
    // 动画相关
    ['animate-keyframes-spin', { animation: 'spin 1s linear infinite' }]
  ],

  // 快捷方式 - 定义项目中使用的自定义组合类
  shortcuts: {
    // 布局相关
    'flex-center': 'flex items-center justify-center',
    'flex-start': 'flex items-center justify-start',
    'flex-between': 'flex items-center justify-between',
    'flex-around': 'flex items-center justify-around',

    // 尺寸相关
    'w-100%': 'w-full',
    'h-100%': 'h-full',

    // 阴影相关 - 定义项目中使用的自定义阴影
    'shadow-rs': 'shadow-[0_2px_6px_-1px_rgba(0,0,0,0.08)]',

    // 文本相关
    'text-6': 'text-xl', // text-6 -> text-xl
    'font-600': 'font-semibold', // font-600 -> font-semibold

    // 按钮相关
    'btn-primary': 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors',
    'btn-secondary': 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors'
  },

  // 主题配置
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      }
    },
    breakpoints: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }
  },

  // 内容匹配
  content: {
    pipeline: {
      include: [
        // 默认
        /\.(vue|svelte|[jt]sx?|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // 包含其他可能包含类名的文件
        'src/**/*.{vue,js,ts,jsx,tsx}'
      ]
    }
  },

  // CSS 层级
  layers: {
    components: -1,
    default: 1,
    utilities: 2,
    shortcuts: 3
  },

  // 安全列表 - 确保某些类名总是被包含
  safelist: ['flex-center', 'flex-start', 'shadow-rs', 'animate-keyframes-spin', 'transform-rotate-180']
})
