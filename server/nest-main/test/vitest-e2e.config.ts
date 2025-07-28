import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // 启用全局API
    globals: true,
    
    // E2E测试环境
    environment: 'node',
    
    // E2E测试文件匹配模式
    include: ['**/*.e2e-spec.{js,ts}'],
    
    // 排除文件
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    
    // 根目录为test文件夹
    root: './',
    
    // E2E测试需要更长的超时时间
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // E2E测试通常需要顺序执行，避免端口冲突等问题
    maxConcurrency: 1,
    
    // 设置文件
    setupFiles: ['./test/setup-e2e.ts'],
    
    // 支持路径映射
    alias: {
      '@': resolve(__dirname, '../src'),
      '@test': resolve(__dirname, './')
    },
    
    // 慢测试阈值（E2E测试通常更慢）
    slowTestThreshold: 5000,
    
    // 序列化配置
    sequence: {
      hooks: 'list'
    },
    
    // 快照配置
    snapshotFormat: {
      printBasicPrototype: true
    }
  },
  
  // Vite 配置
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@test': resolve(__dirname, './')
    }
  }
}) 