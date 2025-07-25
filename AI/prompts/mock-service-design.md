# API中间层Mock服务设计文档

## 1. 项目概述

### 1.1 背景

在前端开发过程中，经常会遇到后端接口尚未完成或处于维护状态时，前端无法正常获取数据的情况。为解决这个问题，设计一个中间层服务，能够拦截404（或其他错误状态码）的接口请求，并返回符合接口定义的mock数据，从而使前端开发不受后端接口状态的阻碍。

### 1.2 目标

开发一个Node.js中间层服务，具有以下功能：
- 代理前端API请求到真实后端服务
- 拦截后端返回的错误响应（如404）
- 自动获取接口文档信息
- 根据接口定义自动生成符合规范的mock数据
- 将mock数据返回给前端，并标识这是mock数据

## 2. 系统架构

### 2.1 整体架构图

```
+-------------+       +-----------------+       +------------------+
|             |       |                 |       |                  |
| 前端应用    | <---> | Node.js中间层   | <---> | 真实后端服务     |
|             |       |                 |       |                  |
+-------------+       +-----------------+       +------------------+
                              ^
                              |
                              v
                      +-----------------+       +------------------+
                      |                 |       |                  |
                      | 接口文档服务    | <---> | AI服务           |
                      |                 |       |                  |
                      +-----------------+       +------------------+
```

### 2.2 工作流程

1. 前端发送API请求到Node.js中间层
2. 中间层使用原始请求头和请求体转发请求到真实后端服务
3. 如果后端服务响应正常（非配置的错误码），直接将响应返回给前端
4. 如果后端服务响应错误（如404），则：
   - 从接口文档服务获取该接口的定义信息
   - 根据接口定义自动生成mock数据（可选择使用AI服务增强）
   - 将mock数据返回给前端，并添加特殊标识

## 3. 技术选型

### 3.1 核心技术栈

| 组件 | 技术选择 | 说明 |
|------|----------|------|
| 服务框架 | Express.js/Koa.js | 成熟稳定的Node.js Web框架 |
| 代理中间件 | http-proxy-middleware | 功能完善的HTTP代理中间件 |
| 接口文档规范 | OpenAPI/Swagger | 广泛使用的API文档标准 |
| Mock数据生成 | Mockjs + 自定义逻辑 | 灵活的mock数据生成工具 |
| AI服务集成 | OpenAI API/自定义AI服务 | 提供更智能的mock数据生成 |

### 3.2 辅助工具

- TypeScript：提供类型安全
- Jest：单元测试
- Winston：日志记录
- dotenv：环境变量管理
- Axios：HTTP客户端

## 4. 详细设计

### 4.1 代理服务模块

负责接收前端请求并转发到真实后端服务，同时处理响应。

```typescript
// app.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getMockData } from './mockService';
import type { Request, Response, NextFunction } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_API = process.env.TARGET_API || 'https://example.com';
const ERROR_CODES = (process.env.ERROR_CODES || '404').split(',').map(Number);

// 代理中间件配置
const apiProxy = createProxyMiddleware({
  target: TARGET_API,
  changeOrigin: true,
  selfHandleResponse: true, // 自己处理响应
  onProxyRes: async (proxyRes, req, res) => {
    // 检查响应状态
    if (!ERROR_CODES.includes(proxyRes.statusCode || 0)) {
      // 非错误状态，直接转发
      proxyRes.pipe(res);
      return;
    }
    
    try {
      // 获取原始请求路径
      const path = req.url || '';
      
      // 获取 mock 数据
      const mockData = await getMockData(path, req.method, req.headers);
      
      // 设置响应头
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Mock-Data', 'true'); // 标识这是 mock 数据
      
      // 返回 mock 数据
      res.status(200).json(mockData);
    } catch (error) {
      // 错误处理
      res.status(500).json({
        error: '生成 mock 数据失败',
        message: error instanceof Error ? error.message : '未知错误',
        isMockError: true
      });
    }
  }
});

// 使用代理中间件处理所有请求
app.use('/', apiProxy);

// 启动服务器
app.listen(PORT, () => {
  console.log(`中间层服务运行在 http://localhost:${PORT}`);
});
```

### 4.2 Mock服务模块

负责从接口文档获取信息并生成mock数据。

```typescript
// mockService.ts
import axios from 'axios';
import { parseOpenAPISpec, generateMockFromSchema } from './openApiUtils';
import { logger } from './logger';
import { cacheService } from './cacheService';

interface ApiDocInfo {
  path: string;
  method: string;
  responseSchema: any;
}

// 获取 Mock 数据
export async function getMockData(path: string, method: string = 'GET', headers: Record<string, any> = {}): Promise<any> {
  try {
    // 检查缓存
    const cacheKey = `${method}:${path}`;
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      logger.info(`Using cached mock data for ${method} ${path}`);
      return cachedData;
    }
    
    // 1. 获取接口文档信息
    const apiDocInfo = await getApiDocInfo(path, method);
    
    if (!apiDocInfo) {
      throw new Error(`找不到接口 ${method} ${path} 的文档信息`);
    }
    
    // 2. 生成 mock 数据
    const mockData = await generateMockData(apiDocInfo);
    
    // 3. 缓存结果
    cacheService.set(cacheKey, mockData);
    
    return mockData;
  } catch (error) {
    logger.error('获取 mock 数据失败:', error);
    throw error;
  }
}

// 获取 API 文档信息
async function getApiDocInfo(path: string, method: string): Promise<ApiDocInfo | null> {
  try {
    // 这里调用 API MCP 服务获取接口文档
    const apiDocResponse = await axios.get(`${process.env.API_MCP_URL}/api-docs`, {
      params: { path, method }
    });
    
    if (!apiDocResponse.data) {
      return null;
    }
    
    // 解析 OpenAPI 规范
    return parseOpenAPISpec(apiDocResponse.data, path, method);
  } catch (error) {
    logger.error('获取 API 文档失败:', error);
    return null;
  }
}

// 生成 mock 数据
async function generateMockData(apiDocInfo: ApiDocInfo): Promise<any> {
  try {
    // 1. 先尝试使用本地 mock 工具
    const mockedData = generateMockFromSchema(apiDocInfo.responseSchema);
    
    // 2. 如果配置了使用AI服务，则调用AI服务优化mock数据
    if (process.env.USE_AI_SERVICE === 'true') {
      try {
        const aiMockedData = await axios.post(`${process.env.AI_SERVICE_URL}/generate-mock`, {
          schema: apiDocInfo.responseSchema,
          path: apiDocInfo.path,
          method: apiDocInfo.method,
          basicMockedData: mockedData
        });
        return aiMockedData.data;
      } catch (aiError) {
        logger.warn('AI服务生成失败，使用基本mock数据', aiError);
        return mockedData;
      }
    }
    
    return mockedData;
  } catch (error) {
    logger.error('生成 mock 数据失败:', error);
    throw error;
  }
}
```

### 4.3 OpenAPI解析模块

负责解析OpenAPI/Swagger规范，提取接口定义。

```typescript
// openApiUtils.ts
import { OpenAPIV3 } from 'openapi-types';

export function parseOpenAPISpec(
  apiDoc: any, 
  path: string, 
  method: string
): { path: string; method: string; responseSchema: any } | null {
  try {
    // 清理路径，移除查询参数
    const cleanPath = path.split('?')[0];
    
    // 标准化方法名称为小写
    const normalizedMethod = method.toLowerCase();
    
    // 在OpenAPI文档中查找路径
    const pathItem = findPathInOpenAPI(apiDoc.paths, cleanPath);
    if (!pathItem) return null;
    
    // 查找指定方法
    const operation = pathItem[normalizedMethod];
    if (!operation) return null;
    
    // 提取成功响应的Schema
    const responseSchema = extractResponseSchema(operation.responses);
    if (!responseSchema) return null;
    
    return {
      path: cleanPath,
      method: normalizedMethod,
      responseSchema
    };
  } catch (error) {
    console.error('解析OpenAPI规范失败:', error);
    return null;
  }
}

// 查找路径，支持路径参数
function findPathInOpenAPI(paths: Record<string, any>, targetPath: string): any {
  // 直接匹配
  if (paths[targetPath]) return paths[targetPath];
  
  // 处理路径参数（如 /users/{id} 匹配 /users/123）
  const targetSegments = targetPath.split('/').filter(Boolean);
  
  for (const [pathKey, pathValue] of Object.entries(paths)) {
    const pathSegments = pathKey.split('/').filter(Boolean);
    
    if (pathSegments.length !== targetSegments.length) continue;
    
    let isMatch = true;
    for (let i = 0; i < pathSegments.length; i++) {
      // 如果是路径参数 (形如 {param})，则认为匹配
      if (pathSegments[i].startsWith('{') && pathSegments[i].endsWith('}')) {
        continue;
      }
      
      // 否则必须完全相等
      if (pathSegments[i] !== targetSegments[i]) {
        isMatch = false;
        break;
      }
    }
    
    if (isMatch) return pathValue;
  }
  
  return null;
}

// 提取成功响应的Schema
function extractResponseSchema(responses: Record<string, any>): any {
  // 尝试获取标准的成功响应码 (200, 201, 等)
  const successResponses = ['200', '201', 'default'];
  
  for (const code of successResponses) {
    if (responses[code]) {
      const response = responses[code];
      
      // 处理不同版本的OpenAPI规范
      if (response.content && response.content['application/json']) {
        return response.content['application/json'].schema;
      }
      
      // 兼容旧版本
      if (response.schema) {
        return response.schema;
      }
    }
  }
  
  return null;
}

// 从Schema生成mock数据
export function generateMockFromSchema(schema: any): any {
  if (!schema) return null;
  
  // 处理引用
  if (schema.$ref) {
    // 这里需要解析引用，实际实现需要处理
    // 简化处理，返回一个空对象
    return {};
  }
  
  // 根据类型生成数据
  switch (schema.type) {
    case 'object':
      return generateMockObject(schema);
    case 'array':
      return generateMockArray(schema);
    case 'string':
      return generateMockString(schema);
    case 'number':
    case 'integer':
      return generateMockNumber(schema);
    case 'boolean':
      return generateMockBoolean(schema);
    case 'null':
      return null;
    default:
      // 如果没有type，但有properties，当作object处理
      if (schema.properties) {
        return generateMockObject(schema);
      }
      // 默认返回null
      return null;
  }
}

function generateMockObject(schema: any): Record<string, any> {
  const result: Record<string, any> = {};
  
  if (!schema.properties) return result;
  
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    result[propName] = generateMockFromSchema(propSchema);
  }
  
  return result;
}

function generateMockArray(schema: any): any[] {
  // 默认生成2-5个元素
  const count = Math.floor(Math.random() * 4) + 2;
  const result = [];
  
  for (let i = 0; i < count; i++) {
    result.push(generateMockFromSchema(schema.items));
  }
  
  return result;
}

function generateMockString(schema: any): string {
  // 处理特殊格式
  if (schema.format === 'date') {
    return new Date().toISOString().split('T')[0];
  }
  if (schema.format === 'date-time') {
    return new Date().toISOString();
  }
  if (schema.format === 'email') {
    return 'user@example.com';
  }
  if (schema.format === 'uri' || schema.format === 'url') {
    return 'https://example.com';
  }
  
  // 使用enum或示例值
  if (schema.enum && schema.enum.length > 0) {
    const index = Math.floor(Math.random() * schema.enum.length);
    return schema.enum[index];
  }
  if (schema.example) {
    return schema.example;
  }
  
  // 默认生成随机字符串
  return `mock-string-${Math.random().toString(36).substring(2, 10)}`;
}

function generateMockNumber(schema: any): number {
  // 使用范围或示例
  if (typeof schema.minimum === 'number' && typeof schema.maximum === 'number') {
    return Math.floor(Math.random() * (schema.maximum - schema.minimum + 1)) + schema.minimum;
  }
  if (schema.example && typeof schema.example === 'number') {
    return schema.example;
  }
  
  // 默认返回随机数字
  return Math.floor(Math.random() * 1000);
}

function generateMockBoolean(schema: any): boolean {
  if (schema.example !== undefined && typeof schema.example === 'boolean') {
    return schema.example;
  }
  return Math.random() > 0.5;
}
```

### 4.4 缓存服务模块

提供内存缓存，提高性能。

```typescript
// cacheService.ts
import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;
  
  constructor(ttlSeconds: number = 3600) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
    });
  }
  
  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }
  
  public set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }
  
  public del(key: string): number {
    return this.cache.del(key);
  }
  
  public flush(): void {
    this.cache.flushAll();
  }
}

export const cacheService = new CacheService();
```

### 4.5 日志服务模块

记录系统运行日志。

```typescript
// logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export { logger };
```

## 5. 配置管理

使用环境变量管理配置，示例如下：

```
# .env 文件示例
PORT=3000
TARGET_API=https://example.com
ERROR_CODES=404,500
API_MCP_URL=https://your-api-mcp-service
AI_SERVICE_URL=https://your-ai-service
USE_AI_SERVICE=true
LOG_LEVEL=info
CACHE_TTL=3600
```

## 6. 错误处理策略

### 6.1 接口文档获取失败

- 记录详细错误日志，包含请求路径和方法
- 尝试使用缓存的文档信息（如果有）
- 返回标准化的错误响应，状态码500

### 6.2 Mock数据生成失败

- 记录错误和请求信息
- 尝试使用简化的默认mock数据
- 如果有自定义的fallback mock定义，则使用它

### 6.3 代理请求失败

- 实现请求重试机制（最多3次）
- 设置适当的超时处理
- 记录详细的错误信息

## 7. 优化和扩展

### 7.1 性能优化

#### 7.1.1 缓存机制

- 缓存接口文档信息，避免重复请求
- 缓存生成的mock数据，提高响应速度
- 支持设置缓存过期时间

#### 7.1.2 批处理

- 支持批量预热缓存
- 定时更新热门接口的缓存

### 7.2 功能扩展

#### 7.2.1 自定义配置

- 提供配置文件定制特定接口的mock规则
- 支持通过API动态更新配置
- 提供Web界面管理配置

```typescript
// 自定义配置示例 (config/mock-rules.json)
{
  "rules": [
    {
      "path": "/api/users/{id}",
      "method": "GET",
      "response": {
        "id": "{id}",
        "name": "Custom User",
        "email": "user@example.com"
      }
    }
  ]
}
```

#### 7.2.2 监控与统计

- 记录被mock的接口调用情况
- 提供API查询统计数据
- 支持Prometheus指标导出

#### 7.2.3 Web管理界面

- 查看和编辑mock配置
- 查看mock统计和日志
- 手动刷新缓存

#### 7.2.4 Mock数据持久化

- 将生成的mock数据持久化到数据库
- 支持手动编辑和调整持久化的mock数据

### 7.3 部署与扩展

#### 7.3.1 容器化部署

- 提供Docker镜像和docker-compose配置
- 支持Kubernetes部署

#### 7.3.2 水平扩展

- 支持多实例部署
- 使用Redis等共享缓存解决方案

## 8. 项目实施计划

### 8.1 开发阶段

1. **基础框架搭建** (1周)
   - 代理服务模块实现
   - 基本配置管理

2. **核心功能开发** (2周)
   - OpenAPI解析模块
   - Mock数据生成
   - 缓存服务实现

3. **辅助功能开发** (1周)
   - 日志服务
   - 错误处理
   - 监控统计

4. **测试与优化** (1周)
   - 单元测试
   - 集成测试
   - 性能测试和优化

### 8.2 部署和维护

1. **部署方案**
   - 开发环境: Docker Compose
   - 生产环境: Kubernetes

2. **监控与维护**
   - 使用Prometheus + Grafana监控
   - 定期回顾和优化

## 9. 总结

本设计文档描述了一个可行的API中间层Mock服务解决方案，该服务能够拦截404等错误接口请求，并生成符合接口规范的mock数据返回给前端。通过这种方式，前端开发可以不受后端接口状态的影响，提高开发效率。

该解决方案具有良好的扩展性和可维护性，可以根据实际需求进行定制和优化。随着项目的发展，可以逐步添加更多高级功能，如Web管理界面、更智能的mock数据生成等。 