# Request 模块测试套件

> 完整的 API 适配器测试体系，确保代码质量和功能稳定性

## 📁 目录结构

```
src/request/tests/
├── 📖 README.md                 # 本文档
├── 📋 index.ts                  # 测试入口和配置
│
├── 🧪 unit/                     # 单元测试
│   └── api-adapter.test.ts      # API适配器核心功能测试
│
├── 🔄 integration/              # 集成测试
│   └── integration.test.ts      # 业务API完整流程测试
│
├── 🛠️ manual/                   # 手动验证
│   └── manual-test.ts           # 浏览器环境验证工具
│
└── 🎭 __mocks__/                # Mock 文件
    └── (保留用于特殊mock需求)
```

## 🚀 快速开始

### 运行所有测试
```bash
npm test
```

### 运行特定类型测试
```bash
# 单元测试
npm test -- unit

# 集成测试  
npm test -- integration

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

## 🧪 测试类型说明

### 1. 单元测试 (`unit/`)
**目标：** 测试 API 适配器的核心功能
**覆盖：** 16个测试用例

**测试内容：**
- ✅ 配置管理（环境变量、运行时配置、更新机制）
- ✅ API调用（端点解析、HTTP方法、认证头、数据处理）
- ✅ 错误处理（HTTP错误、网络错误、未知错误）
- ✅ 协议切换（gRPC降级、透明切换）
- ✅ 健康检查（系统状态、配置验证）
- ✅ 超时和选项（自定义配置、头部设置）

**运行方式：**
```bash
npm test -- unit/api-adapter.test.ts
```

### 2. 集成测试 (`integration/`)
**目标：** 测试业务 API 的完整流程
**覆盖：** 20+个测试用例

**测试内容：**
- ✅ **用户API测试**：登录、获取用户、用户列表
- ✅ **权限API测试**：权限列表、角色列表、权限检查
- ✅ **专栏API测试**：列表获取、创建操作
- ✅ **通用工具测试**：GET/POST请求、健康检查、工具函数
- ✅ **错误处理测试**：API错误、登录失败处理
- ✅ **类型安全测试**：TypeScript类型验证

**运行方式：**
```bash
npm test -- integration/integration.test.ts
```

### 3. 手动验证 (`manual/`)
**目标：** 浏览器环境的真实使用验证
**覆盖：** 7个验证步骤

**验证内容：**
- ✅ 配置管理功能验证
- ✅ 基础API调用测试
- ✅ 业务API功能验证
- ✅ 协议切换测试（HTTP/gRPC）
- ✅ 错误处理验证
- ✅ 性能对比测试
- ✅ 浏览器控制台验证

**使用方式：**
```typescript
// 在浏览器控制台中
import { runManualTests } from '@/request/tests/manual/manual-test'
await runManualTests()

// 或使用全局变量
window.apiAdapterTest.runManualTests()
```

## 📊 测试覆盖率目标

| 测试类型 | 文件数 | 测试用例 | 覆盖目标 |
|---------|--------|----------|----------|
| **单元测试** | 1个 | 16个 | 90%+ |
| **集成测试** | 1个 | 20+个 | 85%+ |
| **手动验证** | 1个 | 7步骤 | 实际使用 |
| **总计** | **3个** | **36+** | **全面覆盖** |

## 🛠️ 开发指南

### 添加新测试

#### 1. 单元测试
```typescript
// unit/new-feature.test.ts
import { describe, it, expect } from 'vitest'
import { newFeature } from '../../new-feature'

describe('New Feature', () => {
  it('should work correctly', () => {
    const result = newFeature()
    expect(result).toBeDefined()
  })
})
```

#### 2. 集成测试
```typescript
// integration/new-api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { newApiFunction } from '../../api/new-api'

vi.mock('../../api-adapter', () => ({
  apiCall: vi.fn()
}))

describe('New API Integration', () => {
  it('should integrate correctly', async () => {
    const [data, error] = await newApiFunction()
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

#### 3. 手动验证
```typescript
// manual/new-validation.ts
export async function validateNewFeature() {
  console.log('🧪 测试新功能...')
  // 实现验证逻辑
}
```

### 测试最佳实践

#### ✅ 好的测试
```typescript
// 描述性测试名称
it('should return user data when login with valid credentials', async () => {
  // 准备测试数据
  const mockResponse = { user: { id: '123' }, token: 'abc' }
  mockApiCall.mockResolvedValue([mockResponse, null])
  
  // 执行测试
  const [result, error] = await userLogin('valid@email.com', 'password')
  
  // 验证结果
  expect(error).toBeNull()
  expect(result).toEqual(mockResponse)
  expect(mockApiCall).toHaveBeenCalledWith('POST /auth/login', {
    email: 'valid@email.com',
    password: 'password'
  })
})
```

#### ❌ 避免的测试
```typescript
// 模糊的测试名称
it('test login', () => {
  // 没有明确的测试意图
  const result = userLogin()
  expect(result).toBeTruthy() // 模糊的断言
})
```

### Mock 使用指南

#### API Adapter Mock
```typescript
vi.mock('../../api-adapter', () => ({
  apiCall: vi.fn(),
  updateApiConfig: vi.fn(),
  getApiConfig: vi.fn().mockReturnValue({
    useGrpc: false,
    debug: false
  })
}))
```

#### 外部依赖 Mock
```typescript
vi.mock('axios', () => ({
  default: vi.fn(),
  isAxiosError: vi.fn()
}))
```

## 🔧 配置说明

### Vitest 配置更新
测试配置已更新以支持新的目录结构：

```typescript
// vitest.config.ts
include: [
  'src/**/*.{test,spec}.{js,ts}',
  'src/**/tests/**/*.{test,spec}.{js,ts}',
  'src/**/tests/**/*.test.ts'
]
```

### 路径映射
```typescript
alias: {
  '@': resolve(__dirname, './src'),
  '@/shared': resolve(__dirname, './src/shared'),
  '@/proto': resolve(__dirname, '../../protos')
}
```

## 📈 测试报告

### 运行测试报告
```bash
# 详细报告
npm test -- --reporter=verbose

# JSON报告
npm test -- --reporter=json --outputFile=test-results.json

# 覆盖率报告
npm run test:coverage
```

### CI/CD 集成
```yaml
# GitHub Actions 示例
- name: Run Tests
  run: |
    npm test
    npm run test:coverage
```

## 🐛 故障排除

### 常见问题

#### 1. 模块路径错误
```bash
Error: Cannot find module '../../api-adapter'
```
**解决：** 检查import路径是否正确，确保相对路径指向正确的文件

#### 2. Mock 不生效
```bash
TypeError: mockApiCall is not a function
```
**解决：** 确保mock在测试文件顶部正确定义

#### 3. 测试超时
```bash
Test timeout after 5000ms
```
**解决：** 检查异步操作是否正确等待，或增加超时时间

### 调试技巧

#### 1. 使用调试器
```typescript
it('debug test', () => {
  debugger // 浏览器会在此处暂停
  // 测试代码
})
```

#### 2. 控制台输出
```typescript
it('log test', () => {
  console.log('Debug info:', testData)
  // 在测试输出中查看信息
})
```

#### 3. 只运行特定测试
```typescript
it.only('focused test', () => {
  // 只运行这个测试
})
```

## 📞 技术支持

如遇问题请：
1. 查看本文档的故障排除部分
2. 检查测试文件的import路径
3. 确认vitest配置正确
4. 联系开发团队

---

💡 **提示**：新的测试目录结构更好地组织了不同类型的测试，便于维护和扩展。 