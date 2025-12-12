## 目标与范围
- 抽取通用组件至 `apps/naive-admin/src/views/system/components/ResourceTree.vue`
- 仅使用外部传入的资源树数据；不内置自动拉取与懒加载
- 保留两种模式：`view` 与 `edit`；增加内置“一键展开/收起 + 搜索”工具栏

## 现有使用场景映射
- 角色表单页：原组件内拉取数据，需改为父组件调用 `getResourceTree()` 并传入
- 人员分配预览：已传入 `resources` 数据，直接替换为通用组件
- 资源管理页操作按钮：由父组件通过插槽扩展，不内置增删改事件

## Props（最终版）
- `mode: 'view' | 'edit'`（默认 `'view'`）
- `resources: ResourceTree[]`（必填，外部提供完整树）
- `selectedIds?: string[]`（仅 `mode='edit'`；支持 `v-model:selected-ids`）
- `defaultExpandedIds?: string[]`、`expandAll?: boolean`（默认展开行为）
- `cascade?: boolean`（默认 true；级联勾选）
- `disabledIds?: string[]`（编辑模式禁选节点）
- `iconMap?: Record<number, string>`、`typeTextMap?: Record<number, string>`（类型展示映射，可覆盖）
- `filterKeys?: Array<'name' | 'path' | 'resCode'>`（搜索字段，默认 `['name', 'path', 'resCode']`）

## Emits（最终版）
- `update:selected-ids`（编辑模式双向绑定）
- `change:checked`（返回最新 `selectedIds` 与变更源信息）
- `node-click`（节点点击）

## 插槽（扩展）
- `#label`：自定义标签区（文本 + 标签）
- `#prefix`：自定义前缀（图标）
- `#suffix`：自定义后缀（操作区）

## 内置工具栏
- 展开/收起：顶部按钮 `展开全部 / 收起全部`，调用 `treeRef.expandAll()/collapseAll()`
- 搜索：输入框实时过滤，匹配 `filterKeys` 字段；空值时还原全树
- 高亮（可选）：匹配内容加轻量高亮效果（不影响性能的前提下实现）

## 行为与实现
- 使用 `n-tree` + 原始树数据（`key-field='id'`、`label-field='name'`）
- `mode='edit'`：开启 `checkable` 与 `cascade`；更新选中触发 `update:selected-ids`、`change:checked`
- `mode='view'`：关闭勾选，仅保留 `node-click` 与展示插槽
- 搜索实现：
  - 预处理生成“过滤后的树”（保留匹配节点及其祖先）
  - 支持对 `name/path/resCode` 的包含匹配（可配置）
  - 搜索时可自动展开匹配分支；清空时恢复 `defaultExpandedIds`
- 类型映射：以数字枚举（1=PAGE、2=API、3=MODULE）为主，并提供可覆盖的 `iconMap/typeTextMap`

## 迁移与替换
- 角色表单页 `RoleForm.vue`：
  - 父组件新增资源树数据加载：调用 `getResourceTree()` 后传入 `resources`
  - 使用：`<ResourceTree mode="edit" :resources="resourceTree" v-model:selected-ids="selectedResources" />`
- 人员分配预览 `RoleAssignment.vue`：
  - 使用：`<ResourceTree mode="view" :resources="resourceTree" :default-expanded-ids="[]" />`
- 资源管理页：如需操作按钮，通过 `#suffix` 插槽渲染增改删按钮（API 由父组件调用）
- 移除旧实现：逐步替换并删除 `role/components/ResourceTree.vue` 与 `resources/components/resource-tree.vue`

## 测试与验证
- 搜索：空值、精确匹配、祖先/子孙匹配保留、性能基本盘
- 勾选：级联勾选、禁用节点不可变、双向绑定正确
- 展开：顶部一键展开/收起、搜索态自动展开匹配分支
- 集成：角色提交 `resourceIds` 正确（保存链路）、人员预览加载正确

## 编码 Checklist
1. 实现通用组件 UI/交互（模式、工具栏、过滤）
2. 角色表单页：父组件拉取树并传入、替换引用
3. 人员分配预览：替换引用并验证展示
4. 资源管理页：通过插槽接入操作按钮（保留在父层）
5. 清理旧组件与引用，验证无回归