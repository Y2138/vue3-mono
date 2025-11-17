# 阶段1：资源管理后端功能开发执行计划

## 任务描述
实现完整的资源管理后端功能，包括资源列表（树形结构）、资源增删改查等功能，为后续角色权限分配提供资源基础。

## 背景分析
- 现有项目中存在一个基础的RBAC模块实现，需要完全删除并重新实现
- 根据设计文档，资源管理是整个权限系统的基础，为角色权限分配提供资源实体
- 需要实现树形结构资源管理，支持页面资源、API资源等多种类型

## 核心需求
1. 删除现有rbac模块实现
2. 重新设计并实现资源管理模块
3. 实现资源树形结构CRUD操作
4. 支持多种资源类型（页面、API、按钮等）
5. 实现层级关系管理（whole_id字段）
6. 提供完整的RESTful API接口

## 详细实施计划

### 1. 数据库设计和迁移
**目标**: 更新Prisma数据模型，定义完整的资源管理数据结构

**具体任务**:
- [ ] 更新prisma/schema.prisma，定义Resource模型
- [ ] 设计Resource模型字段：id, name, type, url, icon, parent_id, whole_id, sort_order, is_active, created_at, updated_at
- [ ] 添加Resource模型索引优化
- [ ] 创建数据库迁移文件
- [ ] 执行数据库迁移

**技术要点**:
- Resource.type枚举：PAGE（页面）、API（接口）、BUTTON（按钮）
- whole_id字段用于记录完整的层级关系，格式如：root.child.grandchild
- parent_id字段用于快速查询直接父节点
- sort_order字段控制同层级排序

### 2. 删除现有RBAC模块
**目标**: 清理现有实现，为新实现让路

**具体任务**:
- [ ] 删除server/nest-main/src/modules/rbac/整个目录
- [ ] 从app.module.ts中移除RbacModule引用
- [ ] 清理相关的导入和依赖

**技术要点**:
- 确保删除后不影响其他模块的正常启动
- 检查是否有其他模块依赖RBAC模块

### 3. 资源管理模块重构
**目标**: 创建全新的资源管理模块

**具体任务**:
- [ ] 创建新的resources模块目录结构
- [ ] 设计资源管理模块架构
- [ ] 实现资源管理服务类
- [ ] 实现资源管理HTTP控制器
- [ ] 配置模块依赖和导出

**模块结构**:
```
src/modules/resources/
├── dto/
│   ├── create-resource.dto.ts
│   ├── update-resource.dto.ts
│   └── query-resource.dto.ts
├── entities/
│   └── resource.entity.ts
├── services/
│   └── resource.service.ts
├── controllers/
│   └── resource.controller.ts
├── resources.module.ts
└── types/
    └── resource.types.ts
```

### 4. 资源实体和DTO设计
**目标**: 定义完整的数据传输对象

**具体任务**:
- [ ] 创建CreateResourceDto（创建资源）
- [ ] 创建UpdateResourceDto（更新资源）
- [ ] 创建QueryResourceDto（查询资源）
- [ ] 定义Resource类型枚举
- [ ] 定义树形结构响应类型

**字段设计**:
- name: 资源名称（必填）
- type: 资源类型（PAGE/API/BUTTON）
- url: 资源地址（PAGE类型为路由，API类型为接口路径）
- icon: 资源图标（主要用于PAGE类型）
- parent_id: 父级资源ID（可选，顶级资源为null）
- sort_order: 排序号（默认0）
- is_active: 是否激活（默认true）

### 5. 资源服务层实现
**目标**: 实现资源的核心业务逻辑

**具体任务**:
- [ ] 实现ResourceService核心方法
- [ ] 实现资源树形结构管理
- [ ] 实现资源层级关系处理
- [ ] 实现资源路径生成逻辑
- [ ] 实现资源权限码自动生成
- [ ] 实现资源缓存管理
- [ ] 实现资源事件触发机制

**⚠️ 重要：proto文件接口定义要求**
- 所有新接口必须先在 `protos/rbac.proto` 中定义
- 前后端类型定义完全依赖 proto 文件机制
- 不允许手动定义接口类型，所有类型从 proto 文件生成
- 后端服务实现需要遵循 proto 中定义的RPC接口规范

**核心方法**:
```typescript
@Injectable()
export class ResourceService {
  constructor(
    @Inject(PrismaService) private prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
  ) {}

  /**
   * 创建资源
   * 对应 proto 文件中定义的 CreateResourceRequest/Response 接口
   */
  async createResource(data: CreateResourceDto): Promise<Resource> {
    // TODO: 资源创建逻辑实现
    // 1. 检查父资源是否存在
    // 2. 生成完整路径
    // 3. 创建资源
    // 4. 清除相关缓存
  }

  /**
   * 获取资源树
   * 对应 proto 文件中定义的 GetResourceTreeRequest/Response 接口
   */
  async getResourceTree(parentId?: string): Promise<ResourceTreeNode[]> {
    // TODO: 资源树查询逻辑实现
    // 1. 检查缓存
    // 2. 查询资源树
    // 3. 缓存结果
  }

  /**
   * 生成权限码
   */
  private generatePermissionCode(url: string, method: string): string {
    const action = this.getActionByMethod(method);
    const resource = this.normalizeUrl(url);
    return `${action}:${resource}`;
  }

  /**
   * 根据HTTP方法获取操作类型
   */
  private getActionByMethod(method: string): string {
    const actionMap: Record<string, string> = {
      'GET': 'VIEW',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };
    return actionMap[method.toUpperCase()] || 'VIEW';
  }

  /**
   * 标准化URL
   */
  private normalizeUrl(url: string): string {
    const urlObj = new URL(url, 'http://localhost');
    let path = urlObj.pathname;
    
    // 移除尾部斜杠
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    return path;
  }

  /**
   * 生成资源路径
   */
  private async generateResourcePath(parentId: string | null, name: string): Promise<string> {
    if (!parentId) {
      return `/${name}`;
    }

    const parent = await this.prismaService.resource.findUnique({
      where: { id: parentId }
    });

    if (!parent) {
      throw new NotFoundException('父资源不存在');
    }

    return `${parent.path}/${name}`;
  }

  /**
   * 清除资源缓存
   */
  private async clearResourceCache(): Promise<void> {
    const cacheKeys = await this.cacheManager.store.keys('resource:*');
    await Promise.all(cacheKeys.map(key => this.cacheManager.del(key)));
  }
}
```

### 6. 资源控制器实现
**目标**: 提供RESTful API接口

**具体任务**:
- [ ] 实现GET /api/resources（获取资源列表/树）
- [ ] 实现GET /api/resources/:id（获取单个资源）
- [ ] 实现POST /api/resources（创建资源）
- [ ] 实现PUT /api/resources/:id（更新资源）
- [ ] 实现DELETE /api/resources/:id（删除资源）
- [ ] 实现POST /api/resources/batch-toggle（批量启用/禁用）

**API设计原则**:
- 统一的响应格式
- 完善的错误处理
- 数据验证和权限检查
- 支持查询参数：type、is_active、search等

### 7. 树形结构算法优化
**目标**: 实现高效的树形结构构建

**具体任务**:
- [ ] 实现递归转换为树形结构算法
- [ ] 实现扁平化树形结构算法
- [ ] 实现whole_id生成和更新逻辑
- [ ] 实现批量whole_id更新机制

**算法要点**:
- 使用whole_id字段直接构建树，避免递归查询
- 资源移动时自动更新whole_id
- 支持资源的拖拽排序

### 8. 数据初始化
**目标**: 提供基础资源数据

**具体任务**:
- [ ] 创建基础页面资源（用户管理、角色管理等）
- [ ] 创建基础API资源（用户相关接口、角色相关接口等）
- [ ] 创建系统资源（首页、设置等）
- [ ] 实现资源数据seed脚本

**初始化数据**:
- 根级资源：系统管理
- 页面资源：用户管理、角色管理、权限管理
- API资源：/api/users/*, /api/roles/*, /api/permissions/*
- 按钮资源：新增、编辑、删除、查看等

### 9. 测试和验证
**目标**: 确保功能完整性和稳定性

**具体任务**:
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 验证CRUD操作
- [ ] 验证树形结构功能
- [ ] 性能测试（大量资源数据）

**测试覆盖**:
- 正常业务流程测试
- 异常情况处理测试
- 边界条件测试
- 并发操作测试

## 实施清单
1. [ ] 清理现有RBAC模块
2. [ ] 设计并实现Resource数据模型
3. [ ] 创建资源管理模块结构
4. [ ] 实现资源服务层核心逻辑
5. [ ] 实现资源控制器API接口
6. [ ] 优化树形结构算法
7. [ ] 创建基础数据初始化
8. [ ] 编写完整测试用例
9. [ ] 文档编写和代码审查

## 技术风险
1. **whole_id更新复杂度**: 资源移动时需要更新所有子资源的whole_id
   - 风险：高
   - 缓解：使用事务操作，优化更新算法
2. **树形结构性能**: 大量资源数据时树形查询性能
   - 风险：中
   - 缓解：添加索引，使用分页查询
3. **数据一致性**: 层级关系数据一致性维护
   - 风险：中
   - 缓解：使用数据库约束，添加校验逻辑

## 验收标准
1. 资源CRUD操作完全正常
2. 树形结构正确显示
3. 基础数据初始化成功
4. API接口响应格式统一
5. 错误处理完善
6. 测试用例通过率100%
7. 性能满足要求（1000个资源节点查询<1秒）

## 时间估算
- 总计：3-4个工作日
- 数据库设计和迁移：0.5天
- 模块重构：1天
- 服务层实现：1.5天
- 控制器和API：0.5天
- 测试和优化：0.5-1天

## 下阶段准备
1. 为阶段2前端开发提供API文档
2. 确定前端树形组件使用方案
3. 准备联调测试用例
4. 提供基础数据用于前端测试

## 注意事项
- 保持与设计文档的一致性
- 关注性能优化，特别是树形结构查询
- 预留扩展性，支持未来的权限管理需求
- 代码规范遵循项目统一标准