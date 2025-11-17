# 阶段2：资源管理前端功能开发执行计划

## 任务描述
实现完整的资源管理前端功能，包括资源列表（树形结构）、资源增删改操作，以及与后端API的功能联调。

## 背景分析
- 阶段1后端已完成资源管理API接口
- 前端需要实现直观的树形资源管理界面
- 需要支持资源的增删改查操作
- 重点是使用n-tree组件实现资源树形展示
- 界面需要符合Naive Admin的设计风格

## 核心需求
1. 实现资源树形展示（使用n-tree组件）
2. 实现资源列表、分页、搜索功能
3. 实现资源创建、编辑、删除功能
4. 实现资源的拖拽排序功能
5. 实现批量操作（启用/禁用、删除）
6. 与后端API完整集成
7. 响应式设计，支持移动端

## 详细实施计划

### 1. 目录结构和模块设计
**目标**: 设计清晰的目录结构和模块架构

**具体任务**:
- [ ] 创建resources模块目录结构
- [ ] 设计组件层级关系
- [ ] 设计状态管理方案
- [ ] 设计路由配置

**目录结构**:
```
apps/naive-admin/src/views/resources/
├── index.vue                    # 资源管理主页
├── components/
│   ├── ResourceTree.vue         # 资源树组件
│   ├── ResourceForm.vue         # 资源表单组件
│   ├── ResourceToolbar.vue      # 操作工具栏
│   └── ResourceInfo.vue         # 资源详情组件
├── hooks/
│   ├── useResource.ts           # 资源管理组合式函数
│   └── useResourceTree.ts       # 树形结构组合式函数
├── store/
│   └── resource.store.ts        # 资源状态管理
├── api/
│   └── resource.api.ts          # 资源API接口
└── types/
    └── resource.types.ts        # 资源类型定义
```

### 2. 类型定义和接口设计
**目标**: 定义完整的TypeScript类型和接口

**具体任务**:
- [ ] 定义Resource接口类型
- [ ] 定义ResourceTreeNode树形节点类型
- [ ] 定义ResourceFormData表单数据类型
- [ ] 定义API响应类型
- [ ] 定义查询参数类型

**类型设计**:
```typescript
// 资源基础类型
interface Resource {
  id: string
  name: string
  type: 'PAGE' | 'API' | 'BUTTON'
  url?: string
  icon?: string
  parent_id?: string
  whole_id: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Resource[]
}

// 树形节点类型
interface ResourceTreeNode {
  key: string
  label: string
  icon?: string
  type: string
  children?: ResourceTreeNode[]
  raw: Resource
  disabled?: boolean
  isLeaf?: boolean
}
```

### 3. API接口层实现
**目标**: 实现前端API接口封装

**具体任务**:
- [ ] 在 `src/request/api` 目录下创建资源管理相关API
- [ ] 实现所有资源CRUD操作API
- [ ] 实现资源树获取API
- [ ] 实现资源路径生成API
- [ ] 实现批量操作API
- [ ] 实现导出/导入API
- [ ] 实现API错误处理
- [ ] 实现API请求拦截器

**⚠️ 重要：proto文件类型依赖要求**
- 所有API类型定义必须依赖 `protos/rbac.proto` 生成的类型
- 前端类型文件从共享类型文件 `src/shared/` 引入，禁止手动定义
- 前端API接口与后端RPC服务完全对应
- 禁止使用 any 类型，所有请求响应必须有类型定义

**API设计**:
```typescript
// 资源管理API - 类型完全依赖 proto 文件生成
export const resourceApi = {
  // 获取资源树 - 对应 proto 中的 GetResourceTreeRequest/Response
  getResourceTree: (params?: { parentId?: string }) => 
    get<SharedTypes.GetResourceTreeResponse>('/api/resources/tree', params),

  // 创建资源 - 对应 proto 中的 CreateResourceRequest/Response
  createResource: (data: SharedTypes.CreateResourceRequest) => 
    post<SharedTypes.ResourceResponse>('/api/resources', data),

  // 更新资源 - 对应 proto 中的 UpdateResourceRequest/Response
  updateResource: (id: string, data: SharedTypes.UpdateResourceRequest) => 
    put<SharedTypes.ResourceResponse>(`/api/resources/${id}`, data),

  // 删除资源 - 对应 proto 中的 DeleteResourceRequest/Response
  deleteResource: (id: string) => 
    delete<SharedTypes.ResponseStatus>(`/api/resources/${id}`),

  // 批量删除 - 对应 proto 中的 BatchDeleteResourcesRequest/Response
  batchDelete: (ids: string[]) => 
    delete<SharedTypes.ResponseStatus>('/api/resources/batch', { ids }),

  // 获取资源详情 - 对应 proto 中的 GetResourceRequest/Response
  getResource: (id: string) => 
    get<SharedTypes.ResourceResponse>(`/api/resources/${id}`),

  // 获取子资源 - 对应 proto 中的 GetResourceChildrenRequest/Response
  getResourceChildren: (id: string) => 
    get<SharedTypes.GetResourceTreeResponse>(`/api/resources/${id}/children`),

  // 启用/禁用资源 - 对应 proto 中的 ToggleResourceRequest/Response
  toggleResource: (id: string, isActive: boolean) => 
    patch<SharedTypes.ResponseStatus>(`/api/resources/${id}/toggle`, { isActive }),

  // 移动资源 - 对应 proto 中的 MoveResourceRequest/Response
  moveResource: (id: string, targetId: string, position: 'before' | 'after' | 'child') => 
    patch<SharedTypes.ResponseStatus>(`/api/resources/${id}/move`, { targetId, position }),

  // 导出资源 - 对应 proto 中的 ExportResourcesRequest/Response
  exportResource: (params?: { format?: 'json' | 'csv' | 'excel' }) => 
    get<Blob>('/api/resources/export', params, { responseType: 'blob' }),

  // 导入资源 - 对应 proto 中的 ImportResourcesRequest/Response
  importResource: (file: File) => 
    post<SharedTypes.ImportResponse>('/api/resources/import', createFormData(file)),
}
```

**类型文件依赖**:
```typescript
// src/shared/ 目录下的类型文件
// 这些类型完全从 protos/rbac.proto 生成
import type {
  Resource,
  ResourceTreeNode,
  CreateResourceRequest,
  UpdateResourceRequest,
  GetResourceTreeResponse,
  ResourceResponse,
  ResponseStatus,
  ImportResponse
} from './rbac-types'

// 前端API函数返回值类型
export type ResourceApiReturn<T> = Promise<[ResResult<T>, null] | [null, any]>
```

### 4. 状态管理设计
**目标**: 使用Pinia管理资源数据状态

**具体任务**:
- [ ] 设计resource store状态结构
- [ ] 实现action方法：fetchResources、createResource等
- [ ] 实现getter方法：filteredResources、resourceTree等
- [ ] 实现状态持久化（可选）
- [ ] 实现缓存机制

**状态管理方案**:
- 资源列表缓存
- 当前选中的资源
- 树形结构状态
- 加载状态和错误状态
- 表单数据状态

### 5. 资源管理主页面
**目标**: 实现主要的资源管理界面

**具体任务**:
- [ ] 设计页面布局结构
- [ ] 实现左右分栏布局（树形 + 详情）
- [ ] 实现工具栏组件
- [ ] 实现搜索和筛选功能
- [ ] 实现分页组件

**布局设计**:
```
┌─────────────────────────────────────┐
│           工具栏 (搜索、按钮)            │
├─────────────┬───────────────────────┤
│             │                       │
│   资源树     │      资源详情/编辑      │
│  (n-tree)   │      (表单/信息)        │
│             │                       │
│             │                       │
└─────────────┴───────────────────────┘
```

### 6. 资源树组件实现
**目标**: 使用n-tree实现树形资源展示

**具体任务**:
- [ ] 集成Naive UI n-tree组件
- [ ] 实现树形数据转换（Resource -> TreeNode）
- [ ] 实现树形节点交互（选择、展开、折叠）
- [ ] 实现节点拖拽排序功能
- [ ] 实现右键菜单功能
- [ ] 实现节点图标显示

**n-tree配置要点**:
- 支持虚拟滚动（大量数据）
- 支持可选择、可拖拽
- 支持懒加载（可选）
- 支持节点过滤和搜索
- 响应式设计

**交互功能**:
- 点击节点显示详情
- 右键菜单：新增、编辑、删除、禁用
- 拖拽节点改变层级和排序
- 键盘快捷键支持

### 7. 资源表单组件
**目标**: 实现资源的创建和编辑功能

**具体任务**:
- [ ] 设计表单布局和字段
- [ ] 实现表单验证逻辑
- [ ] 实现父级资源选择器
- [ ] 实现资源类型切换（PAGE/API/BUTTON）
- [ ] 实现图标选择器
- [ ] 实现表单重置和提交

**表单字段**:
- 资源名称（必填）
- 资源类型（PAGE/API/BUTTON）
- 资源路径/URL
- 资源图标
- 父级资源（下拉选择）
- 排序号
- 是否启用

**验证规则**:
- 资源名称：必填、长度1-50字符
- 资源类型：必选
- URL：类型为PAGE或API时必填，格式验证
- 父级资源：不能选择自己或子级
- 排序号：数字类型

### 8. 资源详情组件
**目标**: 实现资源信息的展示功能

**具体任务**:
- [ ] 实现资源基本信息展示
- [ ] 实现层级关系展示
- [ ] 实现资源操作历史（可选）
- [ ] 实现相关资源列表
- [ ] 实现权限预览功能

**展示内容**:
- 资源基础信息
- 层级路径显示
- 创建和更新时间
- 相关子资源数量
- 权限分配状态

### 9. 高级功能实现
**目标**: 实现增强用户体验的功能

**具体任务**:
- [ ] 实现资源搜索功能（支持名称、类型筛选）
- [ ] 实现批量选择和操作
- [ ] 实现资源导入/导出功能（可选）
- [ ] 实现资源回收站功能（软删除）
- [ ] 实现资源权限预览

**搜索功能**:
- 实时搜索
- 高级筛选（类型、状态、层级）
- 搜索结果高亮
- 搜索历史记录

**批量操作**:
- 批量启用/禁用
- 批量删除
- 批量移动
- 批量修改属性

### 10. 响应式设计和移动端适配
**目标**: 确保在不同设备上的良好体验

**具体任务**:
- [ ] 实现移动端适配
- [ ] 实现触摸手势支持
- [ ] 优化移动端交互
- [ ] 实现暗色模式支持
- [ ] 无障碍功能实现

**响应式断点**:
- 手机：< 768px
- 平板：768px - 1024px
- 桌面：> 1024px

### 11. 性能优化
**目标**: 确保大量数据时的流畅体验

**具体任务**:
- [ ] 实现虚拟滚动
- [ ] 实现懒加载
- [ ] 实现数据缓存
- [ ] 实现防抖搜索
- [ ] 优化组件渲染

**优化策略**:
- 树形数据分页加载
- 组件懒加载
- 合理的状态管理
- 图片和图标优化

### 12. 测试和联调
**目标**: 确保功能完整性和稳定性

**具体任务**:
- [ ] 单元测试编写
- [ ] 集成测试编写
- [ ] 与后端API联调
- [ ] 性能测试
- [ ] 兼容性测试

**测试场景**:
- 正常业务流程测试
- 异常情况处理测试
- 边界条件测试
- 性能压力测试
- 跨浏览器兼容性测试

## 实施清单
1. [ ] 设计前端模块架构和目录结构
2. [ ] 定义TypeScript类型和接口
3. [ ] 实现API接口层
4. [ ] 实现Pinia状态管理
5. [ ] 实现资源管理主页面布局
6. [ ] 实现n-tree资源树组件
7. [ ] 实现资源表单组件
8. [ ] 实现资源详情组件
9. [ ] 实现高级功能（搜索、批量操作等）
10. [ ] 实现响应式设计和移动端适配
11. [ ] 实现性能优化
12. [ ] 完整测试和后端联调

## 技术栈
- **UI组件库**: Naive UI (n-tree, n-form, n-input, n-button等)
- **状态管理**: Pinia
- **HTTP客户端**: Axios (项目已有request封装)
- **类型系统**: TypeScript
- **构建工具**: Vite
- **样式方案**: UnoCSS (原子化CSS)

## 技术风险
1. **n-tree性能问题**: 大量资源数据时树形渲染性能
   - 风险：高
   - 缓解：虚拟滚动、懒加载、数据分页
2. **树形结构复杂操作**: 节点的拖拽、层级变更
   - 风险：中
   - 缓解：使用防抖、确认提示、撤销功能
3. **表单验证复杂性**: 资源类型切换时的动态验证
   - 风险：中
   - 缓解：分步骤验证、实时反馈
4. **移动端体验**: 触摸操作和复杂交互
   - 风险：中
   - 缓解：响应式设计、触摸优化

## 验收标准
1. 资源树正确显示，支持展开/折叠
2. 资源的增删改操作完全正常
3. 拖拽排序功能正常工作
4. 表单验证完善，错误提示清晰
5. 搜索和筛选功能正常
6. 批量操作功能正常
7. 响应式设计，移动端可用
8. 性能满足要求（1000个节点流畅操作）
9. 与后端API集成无问题
10. 代码符合项目规范

## 时间估算
- 总计：3-4个工作日
- 架构设计和类型定义：0.5天
- 基础组件实现：1天
- 树形组件和交互：1天
- 表单和高级功能：1天
- 测试和优化：0.5-1天

## 与后端集成要点
1. **API接口一致性**: 确保前后端接口格式一致
2. **错误处理**: 统一错误码和错误提示
3. **数据格式**: 树形数据的传输和解析
4. **性能优化**: 大量数据的分页和懒加载
5. **安全考虑**: XSS防护、权限验证

## 下阶段准备
1. 为阶段3角色管理后端开发提供资源API
2. 准备资源权限分配的数据结构
3. 设计角色权限管理的界面需求
4. 准备联调测试数据和测试用例

## 注意事项
- 保持与Naive Admin设计风格一致
- 关注用户体验，交互要直观流畅
- 确保代码可维护性和可扩展性
- 预留后续角色权限分配功能扩展点
- 代码规范遵循项目统一标准