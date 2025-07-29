/**
 * Request 模块测试入口
 * 
 * 提供统一的测试管理和执行入口
 */

// 单元测试
export * from './unit/api-adapter.test'

// 集成测试  
export * from './integration/integration.test'

// 手动测试工具
export * from './manual/manual-test'

/**
 * 测试套件说明
 */
export const testSuites = {
  unit: {
    name: '单元测试',
    description: 'API适配器核心功能测试',
    files: ['unit/api-adapter.test.ts'],
    command: 'npm test -- unit'
  },
  integration: {
    name: '集成测试', 
    description: '业务API完整流程测试',
    files: ['integration/integration.test.ts'],
    command: 'npm test -- integration'
  },
  manual: {
    name: '手动验证',
    description: '浏览器环境验证工具',
    files: ['manual/manual-test.ts'],
    usage: '在浏览器中导入并运行验证脚本'
  }
}

/**
 * 测试运行指南
 */
export const testGuide = {
  quickStart: [
    '🧪 运行所有测试: npm test',
    '⚡ 运行单元测试: npm test -- unit',
    '🔄 运行集成测试: npm test -- integration', 
    '👀 监听模式: npm run test:watch',
    '📊 覆盖率报告: npm run test:coverage'
  ],
  
  development: [
    '💻 开发模式: npm run test:watch',
    '🔍 调试测试: 在测试文件中添加 debugger',
    '📝 新增测试: 在对应目录下创建 *.test.ts 文件'
  ],

  manual: [
    '🌐 浏览器验证: 运行 npm run dev，打开浏览器控制台',
    '📋 导入测试: import { runManualTests } from "@/request/tests/manual/manual-test"',
    '▶️ 执行验证: await runManualTests()'
  ]
}

// 导出测试统计信息
export const testStats = {
  totalSuites: 3,
  totalTestFiles: 3,
  coverage: {
    unit: '16 测试用例',
    integration: '20+ 测试用例', 
    manual: '7 验证步骤'
  }
} 