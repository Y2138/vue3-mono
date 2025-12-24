<template>
  <!-- 搜索区域 -->
  <div class="mb-4 flex items-center gap-2">
    <n-input v-model:value="searchText" placeholder="请输入资源名称" clearable @update:value="handleSearch" class="w-64" />
  </div>

  <!-- 资源树 -->
  <n-tree :data="treeNodes" :default-expanded-keys="expandedKeys" block-line :render-label="renderTreeLabel" :render-suffix="renderTreeSuffix" />
</template>

<script setup lang="tsx">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, useMessage, NDropdown, type TreeOption, type TreeProps, type DropdownOption } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { getResourceTree, deleteResource } from '@/request/api/resource'
import type { ResourceTree, GetResourcesRequest } from '@/shared/resource'
import { usePageLoading } from '@/hooks/usePageLoading'
import ResourceTypeTag from '../components/ResourceTypeTag.vue'

defineOptions({
  name: 'ResourceTree'
})

// 页面加载状态
usePageLoading()

// 消息提示
const message = useMessage()

// 路由
const router = useRouter()

// 搜索文本
const searchText = ref<string>('')

// 原始资源树数据
const resourceTreeData = ref<ResourceTree[]>([])

// 展开的节点ID列表
const expandedKeys = ref<string[]>([])

// 获取资源树数据
const fetchResourceTree = async () => {
  const [res, error] = await getResourceTree()
  if (error) {
    message.error(`获取资源树失败: ${error.message}`)
    return
  }

  if (res && res.data) {
    resourceTreeData.value = res.data
    // 初始化展开节点（默认展开所有页面节点）
    initExpandedKeys(res.data)
  }
}

// 初始化展开节点
const initExpandedKeys = (treeData: ResourceTree[]) => {
  const keys: string[] = []

  const traverse = (nodes: ResourceTree[]) => {
    for (const node of nodes) {
      // 页面类型（type=1）默认展开
      if (node.type === 1) {
        keys.push(node.id)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }

  traverse(treeData)
  expandedKeys.value = keys
}

// 处理搜索
const handleSearch = () => {
  // 搜索时会自动触发 treeNodes 的计算
}

// 将ResourceTree转换为TreeOption
const convertToTreeOption = (resourceTree: ResourceTree[]): TreeOption[] => {
  return resourceTree.map((node) => ({
    key: node.id,
    label: node.name,
    data: node,
    children: node.children && node.children.length > 0 ? convertToTreeOption(node.children) : undefined
  }))
}

// 递归过滤ResourceTree数据
const filterResourceTree = (treeData: ResourceTree[], searchText: string): ResourceTree[] => {
  if (!searchText) return treeData

  const result: ResourceTree[] = []

  for (const node of treeData) {
    // 检查当前节点是否匹配
    const nodeMatch = node.name.toLowerCase().includes(searchText.toLowerCase())

    // 递归检查子节点
    let filteredChildren: ResourceTree[] = []
    if (node.children && node.children.length > 0) {
      filteredChildren = filterResourceTree(node.children, searchText)
    }

    // 如果当前节点匹配或者有匹配的子节点，就保留该节点
    if (nodeMatch || filteredChildren.length > 0) {
      // 创建节点副本，避免修改原始数据
      const clonedNode: ResourceTree = {
        ...node,
        children: filteredChildren
      }
      result.push(clonedNode)
    }
  }

  return result
}

// 过滤后的ResourceTree数据
const filteredResourceTree = computed(() => {
  if (!searchText.value) {
    return resourceTreeData.value
  }
  return filterResourceTree([...resourceTreeData.value], searchText.value)
})

// 转换为N-Tree需要的节点格式
const treeNodes = computed(() => {
  return convertToTreeOption(filteredResourceTree.value)
})

// 渲染树节点标签
const renderTreeLabel: TreeProps['renderLabel'] = ({ option }: { option: TreeOption; checked: boolean; selected: boolean }) => {
  const resource = option.data as ResourceTree
  return (
    <div class="flex items-center flex-1 py-1 text-sm">
      {/* 资源名称 */}
      <span class="mr-2 truncate">{resource.name}</span>
      {/* 资源类型标签 */}
      <ResourceTypeTag type={resource.type} />
    </div>
  )
}

// 渲染树节点后缀（操作按钮 - 下拉菜单）
const renderTreeSuffix: TreeProps['renderSuffix'] = ({ option }: { option: TreeOption; checked: boolean; selected: boolean }) => {
  const resource = option.data as ResourceTree

  // 处理删除操作（带二次确认）
  const handleDeleteWithConfirm = () => {
    // 使用原生 confirm 实现二次确认
    if (window.confirm('确定删除该资源吗？')) {
      handleDelete(resource.id)
    }
  }

  // 下拉菜单选项
  const dropdownOptions: DropdownOption[] = [
    {
      key: 'edit',
      label: '编辑',
      icon: () => <Icon icon="ion:create" class="text-primary-600" width="16" height="16" />,
      props: {
        class: '!text-primary-600',
        onClick: () => handleEdit(resource)
      }
    },
    {
      key: 'add',
      label: '添加下级',
      icon: () => <Icon icon="ion:add" width="16" height="16" />,
      props: {
        onClick: () => handleAddChild(resource)
      }
    },
    {
      type: 'divider',
      key: 'divider'
    },
    {
      key: 'delete',
      label: '删除',
      icon: () => <Icon icon="ion:trash" class="text-red-500" width="16" height="16" />,
      props: {
        class: '!text-red-500',
        onClick: handleDeleteWithConfirm
      }
    }
  ]

  return (
    <NDropdown trigger="click" size="small" placement="bottom-end" options={dropdownOptions}>
      <NButton size="tiny" quaternary>
        <Icon icon="ion:ellipsis-vertical" width="16" height="16" />
      </NButton>
    </NDropdown>
  )
}

// 编辑资源
const handleEdit = (resource: ResourceTree) => {
  router.push(`/system-manage/resource/edit?id=${resource.id}`)
}

// 添加下级资源
const handleAddChild = (resource: ResourceTree) => {
  router.push(`/system-manage/resource/create?parentId=${resource.id}`)
}

// 删除资源
const handleDelete = async (id: string) => {
  const [, error] = await deleteResource(id)
  if (error) {
    message.error(`删除失败: ${error.message}`)
    return
  }

  message.success('删除成功')
  // 重新获取资源树数据
  await fetchResourceTree()
}

// 页面挂载时获取资源树数据
onMounted(() => {
  fetchResourceTree()
})
</script>
