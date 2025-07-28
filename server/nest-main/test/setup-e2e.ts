/**
 * Vitest E2E 测试设置文件
 * 用于端到端测试的全局配置
 */

// 导入 reflect-metadata（必须在所有其他导入之前）
import 'reflect-metadata';

// 设置测试环境变量
process.env.NODE_ENV = 'test'

// E2E测试可能需要的环境变量
process.env.APP_PORT = '3001' // 使用不同的端口避免冲突
process.env.GRPC_PORT = '50052' // 使用不同的gRPC端口

// 全局测试前钩子
beforeAll(async () => {
  console.log('🚀 Starting E2E tests with Vitest')
  
  // 这里可以添加数据库初始化、测试数据准备等
  // 例如：
  // await setupTestDatabase()
  // await seedTestData()
})

// 全局测试后钩子
afterAll(async () => {
  console.log('✅ E2E tests completed')
  
  // 这里可以添加清理工作
  // 例如：
  // await cleanupTestDatabase()
  // await closeConnections()
})

// 每个测试前的设置
beforeEach(async () => {
  // E2E测试前的准备工作
  // 例如：重置数据库状态等
})

// 每个测试后的清理
afterEach(async () => {
  // E2E测试后的清理工作
})

// 导出一些测试工具函数（如果需要）
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const waitForServer = async (url: string, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {
      // 服务器还没准备好，继续等待
    }
    await delay(1000)
  }
  throw new Error(`Server at ${url} did not start within ${maxAttempts} seconds`)
} 