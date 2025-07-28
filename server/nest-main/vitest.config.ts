import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // 启用全局API，这样就不需要在每个测试文件中导入 describe, it, expect
    globals: true,
    
    // 设置测试环境为 Node.js (适合 NestJS 后端项目)
    environment: 'node',
    
    // 测试文件匹配模式
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'test/**/*.{test,spec}.{js,ts}'
    ],
    
    // 排除文件
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.git/**'
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
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/*.interface.ts',
        '**/types/**',
        'src/main.ts', // 排除应用入口文件
        '**/*.spec.ts',
        '**/*.test.ts'
      ],
      reportsDirectory: './coverage',
      // 设置覆盖率阈值
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // 设置文件
    setupFiles: ['./test/setup.ts'],
    
    // 支持路径映射（对应 tsconfig.json 的 paths）
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './test')
    },
    
    // 并发配置
    maxConcurrency: 5,
    
    // 慢测试阈值（毫秒）
    slowTestThreshold: 1000,
    
    // 静默输出（减少日志）
    silent: false,
    
    // 监听模式配置
    watch: {
      // 忽略文件变化的目录
      ignored: ['**/node_modules/**', '**/dist/**']
    },
    
    // 序列化配置
    sequence: {
      hooks: 'list' // 使hooks按顺序执行，类似Jest行为
    },
    
    // 快照配置
    snapshotFormat: {
      printBasicPrototype: true // 使输出格式更接近Jest
    }
  },
  
  // Vite 配置（用于模块解析等）
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './test')
    }
  }
}) 