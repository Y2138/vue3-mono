import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 启用全局API，这样就不需要在每个测试文件中导入 describe, it, expect
    globals: true,
    
    // 设置测试环境为 jsdom (适合 Vue.js 前端项目)
    environment: 'jsdom',
    
    // 测试文件匹配模式 - 更新为新的目录结构
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'src/**/*.{test,spec}.{vue}',
      'src/**/tests/**/*.{test,spec}.{js,ts}',
      'src/**/tests/**/*.test.ts'
    ],
    
    // 排除文件
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.git/**',
      '**/tests/__mocks__/**'
    ],
    
    // 根目录设置
    root: './',
    
    // 设置测试超时时间
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 代码覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{js,ts}',
        '!src/**/*.{spec,test}.{js,ts}',
        '!src/**/*.d.ts',
        '!src/**/tests/**'
      ],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'src/main.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/tests/**'
      ],
      reportsDirectory: './coverage'
    },
    
    // 设置文件（移除了复杂的 mocks 设置）
    // setupFiles: [],
    
    // 支持路径映射（对应 tsconfig.json 的 paths）
    alias: {
      '@': resolve(__dirname, './src'),
      '@/shared': resolve(__dirname, './src/shared'),
      '@/proto': resolve(__dirname, '../../protos')
    },
    
    // 并发配置
    maxConcurrency: 5,
    
    // 慢测试阈值（毫秒）
    slowTestThreshold: 1000,
    
    // 静默输出（减少日志）
    silent: false,
    
    // 序列化配置
    sequence: {
      hooks: 'list'
    }
  },
  
  // Vite 配置（用于模块解析等）
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/shared': resolve(__dirname, './src/shared'),
      '@/proto': resolve(__dirname, '../../protos')
    }
  }
}) 