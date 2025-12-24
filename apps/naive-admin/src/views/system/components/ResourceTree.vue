<template>
  <div class="resource-tree">
    <div class="tree-toolbar flex items-center justify-between mb-3">
      <n-input v-model:value="searchText" placeholder="搜索资源名称/路径/编码" clearable class="w-64" />
    </div>
    <n-tree ref="treeRef" :data="displayTree" :checkable="isEdit" :cascade="cascade" :checked-keys="checkedKeys" :expanded-keys="expandedKeys" @update:expanded-keys="handleExpandChange" @update:checked-keys="handleCheckedChange" @select="handleSelect" :render-label="renderLabel" block-line />
  </div>
</template>

<script setup lang="tsx">
import { ref, computed, watch } from 'vue'
import { NTree, NInput, NButton, NIcon, NTag } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { Icon } from '@iconify/vue'
import type { ResourceTree as ResourceTreeType } from '@/shared/resource'
import ResourceTypeTag from './ResourceTypeTag.vue'

interface Props {
  mode?: 'view' | 'edit'
  resources: ResourceTreeType[]
  selectedIds?: string[]
  defaultExpandedIds?: string[]
  expandAll?: boolean
  cascade?: boolean
  disabledIds?: string[]
  iconMap?: Record<number, string>
  typeTextMap?: Record<number, string>
  filterKeys?: Array<'name' | 'path' | 'resCode'>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'view',
  selectedIds: () => [],
  defaultExpandedIds: () => [],
  expandAll: false,
  cascade: true,
  disabledIds: () => [],
  iconMap: () => ({ 1: 'ion:folder', 2: 'icon-park-outline:page', 3: 'ion:aperture', 4: 'ion:cube' }),
  filterKeys: () => ['name', 'path', 'resCode']
})

interface Emits {
  (e: 'update:selected-ids', ids: string[]): void
  (e: 'change:checked', ids: string[], meta?: any): void
  (e: 'node-click', resource: ResourceTreeType): void
}

const emit = defineEmits<Emits>()

const treeRef = ref<InstanceType<typeof NTree> | null>(null)
const searchText = ref('')
const isEdit = computed(() => props.mode === 'edit')
const checkedKeys = ref<string[]>([...props.selectedIds])
const expandedKeys = ref<string[]>([...props.defaultExpandedIds])

const isDisabled = (id: string) => props.disabledIds.includes(id)

const adapt = (nodes: ResourceTreeType[]): TreeOption[] => {
  return nodes.map((n) => ({
    key: n.id,
    label: n.name,
    disabled: isDisabled(n.id),
    children: n.children && n.children.length > 0 ? adapt(n.children) : undefined,
    raw: n
  }))
}

const originalTree = computed<TreeOption[]>(() => adapt(props.resources))

const matchNode = (node: ResourceTreeType, kw: string) => {
  const k = kw.trim().toLowerCase()
  if (!k) return true
  const values = [node.name || '', node.path || '', node.resCode || '']
  return values.some((v) => String(v).toLowerCase().includes(k))
}

const filterTree = (nodes: TreeOption[], kw: string): TreeOption[] => {
  const result: TreeOption[] = []
  for (const node of nodes) {
    const raw = (node as any).raw as ResourceTreeType
    const children = node.children ? filterTree(node.children as TreeOption[], kw) : []
    if (matchNode(raw, kw) || children.length) {
      result.push({ ...node, children: children.length ? children : undefined })
    }
  }
  return result
}

const displayTree = computed<TreeOption[]>(() => {
  const kw = searchText.value
  if (!kw) return originalTree.value
  return filterTree(originalTree.value, kw)
})

watch(
  () => props.selectedIds,
  (v) => {
    checkedKeys.value = [...v]
  },
  { deep: true }
)

watch(
  () => props.resources,
  () => {
    expandedKeys.value = [...props.defaultExpandedIds]
  },
  { deep: true }
)

watch(searchText, (v) => {
  if (!v) {
    expandedKeys.value = [...props.defaultExpandedIds]
    return
  }
  const keys: string[] = []
  const collect = (nodes: TreeOption[]) => {
    for (const n of nodes) {
      keys.push(String(n.key))
      if (n.children) collect(n.children as TreeOption[])
    }
  }
  collect(displayTree.value)
  expandedKeys.value = keys
})

const handleCheckedChange = (keys: string[]) => {
  checkedKeys.value = keys
  emit('update:selected-ids', keys)
  emit('change:checked', keys)
}

const handleExpandChange = (keys: string[]) => {
  expandedKeys.value = keys
}

const handleSelect = (_keys: string[], selectedNodes: any[]) => {
  const node = selectedNodes?.[0]
  if (node?.raw) emit('node-click', node.raw as ResourceTreeType)
}

const renderLabel = (info: { option: TreeOption }) => {
  const raw = (info.option as any).raw as ResourceTreeType
  const icon = props.iconMap[raw.type] || 'ion:folder'
  return (
    <div class="flex items-center gap-2">
      <n-icon>
        <Icon icon={icon} />
      </n-icon>
      <span class="resource-name">{raw.name}</span>
      <ResourceTypeTag type={raw.type} />
      <slot name="suffix" />
    </div>
  )
}
</script>

<style scoped>
.resource-tree {
  width: 100%;
}
</style>
