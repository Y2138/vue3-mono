# 开发文档模板 - AI 协作增量开发版（架构优先）

> **AI 协作提示**: 此模板用于生成前端页面开发文档。请根据实际需求替换所有 `[AI_FILL]` 标记的内容。此模板专为 AI 辅助开发设计，采用增量模块化开发模式。
>
> **架构优先原则**: 专注于架构设计和实现指导，具体代码实现使用 TODO 标记，避免生成过多具体代码细节。
>
> **按开发计划阶段顺序，每个阶段完成后等待用户确认再继续下一步**
>
> **生成说明**: 输出最终文档时，仅保留 `[结果]` 部分内容，隐藏所有 `[指引]` 标记的内容。
>
> **重要**: 本项目正在从 GraphQL 迁移到 gRPC + REST 双协议架构，使用基于 Protobuf 的混合 API 客户端调用接口。

## 📋 项目概述与配置

### 需求&页面概述

**[AI_FILL: 页面功能描述]**

<!-- 示例: "用户管理"页面，用于展示和管理系统用户信息。该页面采用筛选+列表+操作的标准后台管理布局，支持用户的增删改查操作。 -->

### 初始化配置

**页面文件**: `[MANUAL_FILL: 页面文件完整路径]`
**路由文件**: `[MANUAL_FILL: 路由文件路径]`

---

## 🎯 开发目标拆解

**[AI_FILL: 页面功能描述]**

### 核心模块与接口

**[AI_FILL: 根据需求识别主要功能和接口]**
**[Attention: 请先从项目的 Protobuf 定义中寻找功能对应的接口，若无法找到则从后端 Controller 中查找]**

| 功能模块          | 接口方法                                           | 优先级              |
| ----------------- | -------------------------------------------------- | ------------------- |
| [AI_FILL: 模块名] | `apiClient.[AI_FILL: 方法名]`         | [AI_FILL: 高/中/低] |
| [AI_FILL: 模块名] | `[MANUAL_FILL: gRPC或REST接口路径]` | [AI_FILL: 高/中/低] |

**接口调用方式说明**：
- 使用 axios 封装的请求方法：`post`, `get`, `patch` 等
- 类型安全：基于 Protobuf 自动生成的类型
- API 模块：统一在 `@/request/api/[模块名].ts` 中定义
- 响应处理：统一使用 `[result, error]` 格式

**API 模块示例**：
```typescript
export const getUserList = async (params: GetUsersRequest) => {
  return get<void, GetUsersResponse>('/api/users/list', { params })
}
```

**枚举接口字段说明: [AI_FILL: 对于识别出的枚举接口列出枚举接口下的字段说明]**

**Global Store 数据获取方式**：

-   全局选项数据通过 `useGlobalStore().globalData` 获取
-   各组件直接从对应的 Pinia store 中获取枚举数据
-   支持 gRPC 实时数据推送和缓存策略
-   无需频繁调用接口，提高性能和用户体验

---

## 🔄 增量开发计划

#### 🏗️ 阶段一：基础框架

-   **A0**: 页面结构与路由（非必须，仅新页面） → **A1**: 组件选型设计 → **A2**: 布局实现

#### ⚙️ 阶段二：核心功能

-   **B1**: 筛选+列表+操作等核心功能 → **B2**: 表单弹窗组件 → **Bn**: xxx 组件

#### 🚀 阶段三：集成优化

-   **C1**: 功能集成联调 → **C2**: 性能优化完善

### 🔧 执行规则

1. **按序执行**: 严格按模块顺序，不可跳跃
2. **确认机制**: 每阶段完成后等待用户确认再继续下一模块
3. **阶段二根据需求大小拆分多个步骤**
4. **实施清单要求**: 使用精炼语言，避免过度拆分，每个清单项应为一个完整的功能单元

---

## 📦 模块详细设计

### 模块 A0: 页面结构与路由配置（[AI_ATTENTION: 新页面时需要该模块]）

#### [指引] 目标与实施要点

创建页面文件结构，配置路由信息，建立基本页面框架。

**组件结构设计（符合项目规范）**:

```
src/views/system/
└── [功能模块名]/           # 功能模块目录
    ├── [列表页面].vue        # 主列表页面
    ├── [弹窗组件].vue        # 创建/编辑弹窗组件
    └── [详情页面].vue        # 详情页面
```

**示例**：
```
src/views/system/person/
├── list.vue                 # 人员列表页面
├── CreateUserModal.vue      # 创建用户弹窗
└── detail.vue               # 人员详情页面
```

```
src/views/[页面路径]/
├── index.vue                    # 主页面
├── components/                  # 业务组件目录
│   └── [业务组件].vue           # 复杂业务组件
└── types/
    └── index.ts                # 类型定义（基于Protobuf）
```

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 页面结构选择和理由]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 5 个]

**技术框架**:

```typescript
// TODO: 路由配置框架
// TODO: 页面基础结构
```

**验收标准**:

-   [ ] 页面正常访问，无路由错误
-   [ ] 显示基本框架结构

**完成标识**: `[MODULE_A0_COMPLETED]`

---

### 模块 A1: 组件选型与架构设计

#### [指引] 目标与实施要点

分析页面复杂度，选择合适的组件实现方案，确定架构策略。

**核心组件库选择**:

1. **优先级 1**: `Naive UI` - 主要 UI 组件库（项目主要使用）
2. **优先级 2**: 项目自定义组件 - `src/components/` 目录下的业务组件
   - `dForm` - 动态表单组件
   - `searchPanel` - 搜索面板组件
   - `overflowDecorate` - 溢出装饰组件
   - `wrapRow` - 行包装组件
3. **优先级 3**: 自定义封装 - 仅在必要时使用

**参考示例文件**:

-   **表单页**: `src/views/formDemo.vue` - 标准表单实现
-   **列表页**: `src/views/listDemo.vue` - 标准筛选+列表实现
-   **动态表单**: `src/components/dForm/root.vue` - 动态表单根组件
-   **搜索面板**: `src/components/searchPanel/index.vue` - 搜索筛选实现

**架构核心策略**:

-   **使用 Naive UI + 自定义组件**: 结合项目现有组件体系
-   **基于 Protobuf 的类型安全**: 所有数据类型从 Protobuf 自动生成
-   **混合 API 调用**: 智能选择 gRPC 或 REST 协议
-   **组件化拆分**: 基于项目现有组件架构，合理拆分业务组件
-   **架构优先**: 专注于设计决策和实现指导，避免过多具体代码

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 统一组件/模块化选择及理由]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 4 个]

**技术框架**:

```typescript
// TODO: 组件选型和架构方案
// TODO: 数据流设计（基于gRPC + Pinia）
```

**验收标准**:

-   [ ] 选型决策有明确理由
-   [ ] 数据流设计合理

**完成标识**: `[MODULE_A1_COMPLETED]`

---

### 模块 A2: 基础组件引入与布局

#### [指引] 目标与实施要点

根据 A1 选型结果引入组件，搭建页面布局结构。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 布局方案选择]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 4 个]

**技术框架**:

```vue
<template>
    <div class="[AI_FILL: 页面类名]">
        <!-- TODO: 根据A1选型方案引入主要组件 -->
        <!-- TODO: 配置组件基础属性 -->
        <!-- TODO: 添加弹窗/抽屉组件占位 -->
    </div>
</template>

<script setup lang="ts">
// TODO: 导入必要的组件和hooks
// TODO: 导入Protobuf生成的类型
// TODO: 设置组件名称
// TODO: 建立基础的响应式数据结构
</script>
```

**验收标准**:

-   [ ] 布局结构完整显示
-   [ ] 响应式布局正常

**完成标识**: `[MODULE_A2_COMPLETED]`

---

### 模块 B1: 核心功能实现

#### [指引] 目标与实施要点

根据 A1 选型结果实现筛选+列表+操作完整流程。

**实现指引**:

-   **使用项目现有组件**: 参考 `SearchPanel` + `Naive UI DataTable` 方案
-   **API 调用**: 使用 axios 封装的请求方法
-   **表格分页**: 使用 `useTablePage` Hook 统一处理分页逻辑
-   **枚举值**: 使用 `useEnums` Hook 获取枚举数据

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 核心功能实现方案]

**实施清单**:

1. [ ] 配置 SearchPanel 组件实现筛选功能
2. [ ] 使用 NDataTable 实现列表展示
3. [ ] 集成 useTablePage Hook 处理分页
4. [ ] 实现 CRUD 操作方法
5. [ ] 添加错误处理和用户反馈

**技术框架**:

```vue
<template>
    <SearchPanel :cols="4" labelWidth="60" :formModel="formModel" searchOnUpdate @search="refresh" @reset="handleReset">
        <!-- TODO: 配置搜索表单字段 -->
    </SearchPanel>

    <n-data-table class="mt-4" :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />

    <!-- TODO: 配置弹窗组件 -->
</template>

<script setup lang="tsx">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NTag, NPopconfirm, useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useTablePage from '@/hooks/useTablePage'
import { getUserList, deleteUser, type UserInfo } from '@/request/api/users'
import { useEnums } from '@/hooks/useEnums'
import type { DataTableColumns } from 'naive-ui'
import { usePageLoading } from '@/hooks/usePageLoading'
import CreateUserModal from './CreateUserModal.vue'

// 页面加载状态
usePageLoading()

// 消息提示
const message = useMessage()

// 路由
const router = useRouter()

// 新增人员弹窗状态
const showCreateModal = ref(false)

// 搜索表单模型
interface IFormModel {
    // TODO: 定义表单字段类型
}

const formModel = ref<IFormModel>({
    // TODO: 初始化表单字段
})

// 使用 useEnums hook 获取枚举数据
const { data: userEnums } = useEnums<Record<string, EnumItem[]>>({...})

// 请求参数类型
interface IListRequest extends IPaginationRequest {
    // TODO: 定义请求参数类型
}

// 请求函数适配器
const requestFn = async (params: IListRequest): Promise<[ResResult<IPaginationResData<UserInfo[]>>, null] | [null, any]> => {
    // TODO: 实现请求参数转换和API调用
}

// 处理请求参数
const dealParams = (): IListRequest => {
    // TODO: 实现请求参数处理
}

// 自定义表格列
const customColumns: DataTableColumns<UserInfo> = [
    // TODO: 配置表格列
]

// 使用表格分页 hook
const { pagination, tableColumns, tableData, loading, refresh } = useTablePage<IListRequest, UserInfo>(requestFn, dealParams, {
    returnHeader: false,
    immediate: true
})

// 设置自定义表格列
tableColumns.value = customColumns

// 操作函数
function handleCreate() {
    showCreateModal.value = true
}

function handleCreateSuccess(user: UserInfo) {
    message.success(`[AI_FILL: 成功提示]`)
    refresh() // 刷新列表
}

// TODO: 实现其他CRUD操作方法
</script>
```

**验收标准**:

-   [ ] 筛选、列表、操作功能正常
-   [ ] API 接口调用正常
-   [ ] 数据加载和分页正常

**完成标识**: `[MODULE_B1_COMPLETED]`

---

### 模块 B2: 表单弹窗组件开发

#### [指引] 目标与实施要点

实现表单弹窗，支持新增和编辑模式，基于项目的 dForm 组件。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 弹窗组件设计方案]

**实施清单**:

1. [ ] 配置 NModal 组件实现弹窗结构
2. [ ] 使用 dForm 组件实现表单
3. [ ] 实现表单验证逻辑
4. [ ] 实现 API 提交逻辑

**技术框架**:

```vue
<!-- CreateUserModal.vue -->
<template>
    <n-modal v-model:show="visible" preset="dialog" title="[AI_FILL: 弹窗标题]" class="w-120">
        <d-form-root ref="formRef" class="pt-4" v-model:formModel="formModel" :formConfigs="formConfigs" :selectOptions="{}" label-placement="left" label-width="80" :disabled="loading" />

        <template #action>
            <div class="flex justify-end space-x-2">
                <n-button @click="handleCancel" :disabled="loading"> 取消 </n-button>
                <n-button type="primary" @click="handleSubmit" :loading="loading"> 确定 </n-button>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue'
import { NModal, NButton, NAlert, useMessage } from 'naive-ui'
import DFormRoot from '@/components/dForm/root.vue'
import type { IFormConfig, DFormRootInst } from '@/components/dForm/types'
import { createUserForm, type UserInfo } from '@/request/api/users'

// Props
interface Props {
    visible: boolean
}

// Emits
interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success', user: UserInfo): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
})

const message = useMessage()
const formRef = useTemplateRef<DFormRootInst>('formRef')
const loading = ref(false)

// 表单数据
const formModel = ref<Record<string, unknown>>({}) 

// dForm 表单配置
const formConfigs: IFormConfig[] = [
    // TODO: 配置表单字段
]

// 重置表单
const resetForm = () => {
    formModel.value = {}
    formRef.value?.restoreValidation()
}

// 监听弹窗显示状态，重置表单
watch(visible, (newVisible) => {
    if (newVisible) {
        resetForm()
    }
})

// 处理取消
const handleCancel = () => {
    visible.value = false
}

// 处理提交
const handleSubmit = async () => {
    try {
        // 表单验证
        const validateResult = await formRef.value?.validate()
        if (validateResult?.warnings) {
            return
        }

        loading.value = true

        // 转换表单数据
        const formData = {
            // TODO: 转换表单数据
        }

        // 调用创建用户接口
        const [result, error] = await createUserForm(formData)
        if (error) {
            message.error(error.message || '操作失败')
            return
        }

        if (result?.data) {
            message.success('[AI_FILL: 成功提示]')
            emit('success', result.data)
            visible.value = false
        } else {
            message.error('操作失败：返回数据异常')
        }
    } catch (error) {
        console.error('[AI_FILL: 错误提示]', error)
        message.error('[AI_FILL: 错误提示]')
    } finally {
        loading.value = false
    }
}
</script>
```

**验收标准**:

-   [ ] 弹窗正常开关，表单验证正常
-   [ ] 新增编辑模式功能正常
-   [ ] API 提交接口正常

**完成标识**: `[MODULE_B2_COMPLETED]`

---

### 模块 C1: 功能集成与联调

#### [指引] 目标与实施要点

整合各功能模块，完善数据流交互，优化用户体验。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 功能集成策略]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 5 个]

**技术框架**:

```vue
<!-- 主页面完整集成 -->
<template>
    <div class="page-container">
        <!-- TODO: 集成所有功能组件 -->
    </div>
</template>

<script setup lang="ts">
// TODO: 导入所有子组件
// TODO: 导入Protobuf类型和API客户端
// TODO: 创建组件引用
// TODO: 实现Pinia状态管理
// TODO: 集成所有gRPC操作方法
// TODO: 实现统一的成功和错误处理
// TODO: 添加用户反馈提示
</script>

<style scoped>
/* TODO: 添加页面样式 */
</style>
```

**验收标准**:

-   [ ] 所有功能模块协同工作正常
-   [ ] gRPC + REST 混合调用正常
-   [ ] 用户操作流程顺畅

**完成标识**: `[MODULE_C1_COMPLETED]`

---

### 模块 C2: 性能优化与完善

#### [指引] 目标与实施要点

性能优化处理，代码质量提升，最终测试验收。

#### [结果] 架构决策与实施清单

**架构决策**: [AI_FILL: 优化策略]

**实施清单**:

1. [ ] [AI_FILL: 精炼的实施步骤，不超过 4 个]

**技术框架**:

**1. 性能优化**

```typescript
// TODO: gRPC连接池优化
// TODO: Protobuf序列化优化
// TODO: 组件懒加载优化
```

**2. 用户体验优化**

```vue
<template>
    <!-- TODO: 添加加载状态优化 -->
    <!-- TODO: 添加空状态优化 -->
    <!-- TODO: 添加操作确认优化 -->
</template>
```

**2. 代码优化**

```typescript
// TODO: 优化Protobuf类型安全
// TODO: 提取gRPC调用常量配置
// TODO: 提取工具函数
// TODO: 代码规范检查
```

**验收标准**:

-   [ ] 页面响应速度满足要求（< 2s）
-   [ ] gRPC 连接稳定，降级机制正常
-   [ ] 大数据量场景下性能良好
-   [ ] 用户体验流畅，操作反馈及时
-   [ ] 错误处理完善，异常情况可恢复
-   [ ] 代码质量符合规范，无明显缺陷
-   [ ] 所有功能验收通过

**完成标识**: `[MODULE_C2_COMPLETED]`

---

## 🚀 执行控制流程

### AI 执行协议

**模块开始**: `[AI_START_MODULE: XX]` → **模块完成**: `[MODULE_XX_COMPLETED]` → **等待用户确认继续下一模块**

**执行过程**: AI 按清单逐项完成，每完成一项标记 ✅，遇到问题详细说明

### 技术要求与验收标准

-   **框架**: Vue 3 + TypeScript + Composition API
-   **组件库**: `Naive UI` + 项目自定义组件
-   **接口调用**: 使用 gRPC + REST 混合 API 客户端
-   **类型安全**: 基于 Protobuf 自动生成的类型
-   **状态管理**: Pinia Store
-   **质量标准**: 无语法错误，TypeScript 类型检查通过，符合 ESLint 规范
-   **性能标准**: 页面加载正常，gRPC 调用稳定，交互响应及时，错误处理完善

---

> **使用说明**:
>
> -   **AI 开发者**: 按模块顺序执行，完成后输出标识等待用户确认
> -   **项目开发者**: 填写 `[MANUAL_FILL]` 标记内容
> -   **生成时**: 仅保留 `[结果]` 部分，隐藏 `[指引]` 部分
> -   **实施清单**: 使用精炼语言，避免过度拆分
> -   **接口调用**: 优先使用 gRPC，自动降级到 REST

---
