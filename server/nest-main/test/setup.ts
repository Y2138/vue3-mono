/**
 * Vitest 全局设置文件
 * 用于单元测试的全局配置
 */

// 导入 reflect-metadata（必须在所有其他导入之前）
import 'reflect-metadata';

// 扩展 expect 断言（如果需要自定义断言）
// import { expect } from 'vitest'

// 设置测试环境变量
process.env.NODE_ENV = 'test'

// 如果需要全局模拟或设置，可以在这里添加
// 例如：模拟日期、随机数等

// 全局测试前钩子
beforeAll(() => {
  // 在所有测试运行前执行的设置
  console.log('🚀 Starting unit tests with Vitest')
})

// 全局测试后钩子
afterAll(() => {
  // 在所有测试运行后执行的清理
  console.log('✅ Unit tests completed')
})

// 每个测试前的设置
beforeEach(() => {
  // 每个测试前重置模拟等
})

// 每个测试后的清理
afterEach(() => {
  // 每个测试后清理
}) 