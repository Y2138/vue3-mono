<template>
  <div class="resource-tree-container">
    <div class="tree-header">
      <h3 class="tree-title">资源树</h3>
      <div class="tree-actions">
        <n-button size="small" text @click="handleExpandAll">
          <template #icon>
            <n-icon><Icon icon="ion:arrow-down-circle" /></n-icon>
          </template>
          展开全部
        </n-button>
        <n-button size="small" text @click="handleCollapseAll">
          <template #icon>
            <n-icon><Icon icon="ion:arrow-up-circle" /></n-icon>
          </template>
          收起全部
        </n-button>
      </div>
    </div>
    <div class="tree-content">
      <n-tree ref="treeRef" :data="treeData" key-field="id" label-field="name" :default-expanded-keys="defaultExpandedKeys" :node-key="(node) => node.id" :render-node="renderTreeNode" @update:expanded-keys="handleExpandChange" @select="handleNodeSelect"></n-tree>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, computed, onMounted, watch, nextTick, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { getResourceTree, deleteResource } from '@/request/api/resource'
import { Resource } from '@/shared/resource'

const router = useRouter()
const nMessage = useMessage()

// 定义组件属性
const props = defineProps<{
  // 外部传入的资源列表，用于构建树
  resources?: Resource[]
  // 默认展开的节点ID
  defaultExpandedIds?: string[]
}>()

// 定义事件
const emit = defineEmits<{
  // 节点点击事件
  'node-click': [resource: Resource]
  // 节点添加事件
  'node-add': [parentId: string]
  // 节点编辑事件
  'node-edit': [resource: Resource]
  // 节点删除事件
  'node-delete': [resource: Resource]
}>()

// 树引用
const treeRef = ref()
// 树数据
const treeData = ref<Resource[]>([])
// 加载状态
const treeLoading = ref(true)
// 默认展开的节点
const defaultExpandedKeys = ref<string[]>([])
// 展开的节点
const expandedKeys = ref<string[]>([])

// 渲染树节点
const renderTreeNode = (option: any) => {
  const resource = option.data as Resource
  // 根据资源类型选择图标
  const icon = getResourceIcon(resource.type)
  // 资源类型文本
  const typeText = getResourceTypeText(resource.type)
  // 类型样式类
  const typeClass = `resource-type-${resource.type.toLowerCase()}`

  return (
    <div class="tree-node-content">
      <n-icon>
        <Icon icon={icon} />
      </n-icon>
      <span class="resource-name">{resource.name}</span>
      <n-tag size="small" class={`resource-type-tag ${typeClass}`}>
        {typeText}
      </n-tag>
      <div class="tree-node-actions">
        <n-button
          size="tiny"
          text
          type="primary"
          onClick={() => handleAddChild(resource.id)}
          icon={
            <n-icon>
              <Icon icon="ion:add-circle" />
            </n-icon>
          }
        ></n-button>
        <n-button
          size="tiny"
          text
          type="info"
          onClick={() => handleEditNode(resource)}
          icon={
            <n-icon>
              <Icon icon="ion:pencil" />
            </n-icon>
          }
        ></n-button>
        <n-button
          size="tiny"
          text
          type="danger"
          onClick={() => handleDeleteNode(resource)}
          icon={
            <n-icon>
              <Icon icon="ion:trash" />
            </n-icon>
          }
        ></n-button>
      </div>
    </div>
  )
}

// 根据资源类型获取图标
const getResourceIcon = (type: string) => {
  switch (type) {
    case 'PAGE':
      return 'ion:folder'
    case 'API':
      return 'ion:aperture'
    case 'BUTTON':
      return 'ion:button'
    default:
      return 'ion:folder'
  }
}

// 根据资源类型获取文本
const getResourceTypeText = (type: string) => {
  switch (type) {
    case 'PAGE':
      return '页面'
    case 'API':
      return '接口'
    case 'BUTTON':
      return '按钮'
    default:
      return type
  }
}

// 获取资源树数据
const fetchResourceTree = async () => {
  treeLoading.value = true
  try {
    const [res, error] = await getResourceTree({})
    if (res) {
      treeData.value = res.data
    } else {
      nMessage.error(error?.message || '获取资源树失败')
    }
  } catch (error: any) {
    nMessage.error('获取资源树失败: ' + error.message)
  } finally {
    treeLoading.value = false
  }
}

// 处理节点展开/折叠变化
const handleExpandChange = (keys: string[]) => {
  expandedKeys.value = keys
}

// 处理节点选择
const handleNodeSelect = (keys: string[], selectedNodes: any[]) => {
  if (selectedNodes[0]) {
    emit('node-click', selectedNodes[0].data as Resource)
  }
}

// 展开全部
const handleExpandAll = () => {
  if (treeRef.value) {
    treeRef.value.expandAll()
  }
}

// 折叠全部
const handleCollapseAll = () => {
  if (treeRef.value) {
    treeRef.value.collapseAll()
  }
}

// 处理添加子节点
const handleAddChild = (parentId: string) => {
  emit('node-add', parentId)
}

// 处理编辑节点
const handleEditNode = (resource: Resource) => {
  emit('node-edit', resource)
}

// 处理删除节点
const handleDeleteNode = async (resource: Resource) => {
  try {
    // 调用删除API
    const [response, error] = await deleteResource(resource.id)
    if (response?.code === 200) {
      nMessage.success('资源删除成功')
      // 重新获取树数据
      fetchResourceTree()
      // 触发删除事件
      emit('node-delete', resource)
    } else {
      nMessage.error(error?.message || '资源删除失败')
    }
  } catch (error: any) {
    nMessage.error('资源删除失败: ' + error.message)
  }
}

// 监听外部传入的资源列表变化
watch(
  () => props.resources,
  (newVal) => {
    if (newVal) {
      // 如果外部传入了资源列表，直接使用它构建树
      treeData.value = newVal
    }
  },
  { deep: true }
)

// 监听外部传入的默认展开节点变化
watch(
  () => props.defaultExpandedIds,
  (newVal) => {
    if (newVal) {
      defaultExpandedKeys.value = newVal
    }
  },
  { deep: true }
)

// 页面加载时获取数据
onMounted(async () => {
  // 如果外部没有传入资源列表，则调用API获取
  if (!props.resources || props.resources.length === 0) {
    fetchResourceTree()
  } else {
    treeData.value = props.resources
  }
  // 如果外部没有传入默认展开节点，则使用空数组
  if (!props.defaultExpandedIds) {
    defaultExpandedKeys.value = []
  }
})
</script>

<style scoped>
.resource-tree-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
}

.tree-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.tree-actions {
  display: flex;
  gap: 8px;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-actions {
  display: none;
  gap: 4px;
  margin-left: 8px;
}

.tree-node-content:hover .tree-node-actions {
  display: flex;
}

.resource-type-tag {
  margin-left: auto;
}

.resource-type-page {
  background-color: #e6f7ff;
  color: #1890ff;
}

.resource-type-api {
  background-color: #f6ffed;
  color: #52c41a;
}

.resource-type-button {
  background-color: #fffbe6;
  color: #faad14;
}
</style>
