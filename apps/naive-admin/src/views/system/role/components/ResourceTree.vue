<template>
  <div class="resource-tree">
    <n-tree ref="treeRef" :data="treeData" :checked-keys="checkedKeys" :default-expand-all="defaultExpandAll" :block-line="true" cascade checkable @update:checked-keys="handleCheckChange" @update:expanded-keys="handleExpandChange" :node-props="nodeProps" :loading="loading">
      <template #default="item">
        <div class="tree-node-content">
          <div class="node-info">
            <div class="node-header">
              <div class="node-title">
                <Icon :icon="getNodeIcon(item.data.resource?.type)" width="16" height="16" />
                <span class="resource-name">{{ item.data.resource?.name || '未知资源' }}</span>
                <n-tag v-if="item.data.resource?.type" size="small" :type="getTagType(item.data.resource?.type)" round>
                  {{ getResourceTypeName(item.data.resource?.type) }}
                </n-tag>
              </div>
              <div class="node-actions">
                <n-button v-if="item.data.resource?.id" size="tiny" :type="getResourceButtonType(checkedKeys.includes(item.data.resource.id))" @click.stop="handleResourceClick(item)">
                  {{ getResourceButtonText(checkedKeys.includes(item.data.resource.id)) }}
                </n-button>
              </div>
            </div>

            <div v-if="item.data.resource?.description" class="node-description">
              {{ item.data.resource.description }}
            </div>

            <div class="node-meta">
              <div class="meta-left">
                <n-tag v-if="checkedKeys.includes(item.data.resource?.id)" size="small" type="success" round> 已分配 </n-tag>
              </div>
              <div class="meta-right">
                <n-text v-if="item.data.resource?.method" depth="3" class="method-tag">
                  {{ item.data.resource.method }}
                </n-text>
                <n-text v-if="item.data.resource?.path" depth="3" class="path-text">
                  {{ item.data.resource.path }}
                </n-text>
              </div>
            </div>
          </div>
        </div>
      </template>
    </n-tree>

    <!-- 资源详情模态框 -->
    <ResourceDetailModal :show="showResourceModal" @update:show="(val) => (showResourceModal = val)" :resource="selectedResource" :role-id="roleId" @confirm="handleResourceConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useMessage, NTree, NTag, NText } from 'naive-ui'
import type { TreeOptions } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { getResourceTree } from '@/request/api/resource'
import type { ResourceTree as ResourceTreeType } from '@/shared/resource'
import ResourceDetailModal from './ResourceDetailModal.vue'

// Props
interface Props {
  selectedResources?: string[]
  roleId?: string
  editable?: boolean
  defaultExpandAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedResources: () => [],
  roleId: '',
  editable: true,
  defaultExpandAll: true
})

// Emits
interface Emits {
  (e: 'update:checkedKeys', keys: string[]): void
  (e: 'update:selectedResources', keys: string[]): void
  (e: 'tree-change', treeData: any[], selectedIds: string[]): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const treeRef = ref<InstanceType<typeof NTree> | null>(null)
const loading = ref(false)
const treeData = ref<TreeOptions[]>([])
const checkedKeys = ref<string[]>(props.selectedResources)
const expandedKeys = ref<string[]>([])
const showResourceModal = ref(false)
const selectedResource = ref()
const message = useMessage()

// 同步资源变更到父组件
const handleCheckChange = (keys: string[]): void => {
  checkedKeys.value = keys
  emit('update:checkedKeys', keys)
  emit('update:selectedResources', keys)

  // 通知父组件树形数据变化
  emit('tree-change', treeData.value, keys)
}

// 处理节点展开变更
const handleExpandChange = (keys: string[]): void => {
  expandedKeys.value = keys
}

const handleResourceClick = (item: { data: any }) => {
  if (!props.editable) return

  selectedResource.value = item.data.resource
  showResourceModal.value = true
}

// 处理资源变更
const handleResourceConfirm = async (permissions: string[]): Promise<void> => {
  // 资源分配功能已整合到角色创建/更新接口中，不再需要单独的资源分配接口
  showResourceModal.value = false
  message.success('资源配置已保存到临时选择列表')
}

// 工具函数
const getNodeIcon = (type?: string): string => {
  const iconMap: Record<string, string> = {
    menu: 'mdi:menu',
    api: 'mdi:api',
    button: 'mdi:button-cursor',
    page: 'mdi:file-document-outline',
    resource: 'mdi:resource',
    default: 'mdi:file-tree'
  }
  return iconMap[type || 'default']
}

const getTagType = (type?: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
  const typeMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
    menu: 'primary',
    api: 'success',
    button: 'warning',
    page: 'default',
    resource: 'default',
    default: 'default'
  }
  return typeMap[type || 'default']
}

const getResourceTypeName = (type?: string) => {
  const typeNameMap: Record<string, string> = {
    menu: '菜单',
    api: 'API',
    button: '按钮',
    page: '页面',
    resource: '资源'
  }
  return typeNameMap[type || '资源']
}
// 获取按钮类型
const getResourceButtonType = (isAssigned?: boolean): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
  return isAssigned ? 'error' : 'success'
}

const getResourceButtonText = (isAssigned?: boolean) => {
  return isAssigned ? '已分配' : '分配资源'
}

// 节点属性配置
const nodeProps = (info: { option: any }) => {
  const resourceId = info.option.data?.resource?.id || ''
  return {
    class: {
      'tree-node': true,
      'node-checked': checkedKeys.value.includes(resourceId),
      'node-expanded': expandedKeys.value.includes(resourceId)
    }
  }
}

// 构建树形数据，直接转换ResourceTree为Tree组件所需结构
const buildTreeData = (nodes: ResourceTreeType[]): TreeOptions[] => {
  return nodes.map((node) => ({
    key: node.id,
    label: node.name,
    children: node.children && node.children.length > 0 ? buildTreeData(node.children) : undefined,
    data: {
      resource: node
    }
  }))
}

// 加载资源树
const loadResourceTree = async () => {
  loading.value = true
  const [response, err] = await getResourceTree()
  if (!err && response?.data) {
    // 直接转换资源树数据为Tree组件所需结构
    treeData.value = buildTreeData(response.data)

    // 自动展开前两级
    const expandInitialNodes = (nodes: ResourceTreeType[], level: number = 0) => {
      if (level >= 2) return
      nodes.forEach((node) => {
        if (node.id) {
          expandedKeys.value.push(node.id)
        }
        if (node.children && node.children.length > 0) {
          expandInitialNodes(node.children, level + 1)
        }
      })
    }
    expandInitialNodes(response.data)

    emit('tree-change', treeData.value, checkedKeys.value)
  }
  loading.value = false
}

// 选择所有节点
const selectAll = (): void => {
  const allKeys: string[] = []
  const traverse = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.key) {
        allKeys.push(node.key)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(treeData.value)
  checkedKeys.value = allKeys
  emit('update:checkedKeys', checkedKeys.value)
}

// 取消选择所有节点
const deselectAll = (): void => {
  checkedKeys.value = []
  emit('update:checkedKeys', checkedKeys.value)
}

// 监听 props 变化
// 监听selectedResources变化，更新选中项
watch(
  () => props.selectedResources,
  (newVal) => {
    checkedKeys.value = [...newVal]
  },
  { deep: true }
)

// 监听roleId变化，重新加载资源树
watch(
  () => props.roleId,
  async () => {
    await loadResourceTree()
  }
)

// 生命周期
// 初始化时加载资源树
onMounted(async () => {
  await loadResourceTree()
})
</script>

<!-- 样式已迁移到Tailwind CSS类 -->
