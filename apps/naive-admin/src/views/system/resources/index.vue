<template>
  <SearchPanel :cols="4" labelWidth="80" :formModel="formModel" :searchLoading="loading" searchOnUpdate @search="refresh" @reset="handleReset">
    <template #btn-suffix>
      <n-button class="ml-2" type="primary" @click="handleAddResource">
        <template #icon>
          <Icon icon="ion:add" width="16" height="16" />
        </template>
        新增资源
      </n-button>
    </template>

    <WrapCol label="资源名称">
      <n-input v-model:value="formModel.name" placeholder="请输入资源名称" clearable />
    </WrapCol>

    <WrapCol label="资源类型">
      <n-select v-model:value="formModel.type" :options="resourceEnums" placeholder="请选择资源类型" clearable />
    </WrapCol>

    <WrapCol label="资源路径">
      <n-input v-model:value="formModel.path" placeholder="请输入资源路径" clearable />
    </WrapCol>

    <WrapCol label="状态">
      <n-select v-model:value="formModel.isActive" :options="statusOptions" placeholder="请选择状态" clearable />
    </WrapCol>
  </SearchPanel>

  <n-data-table class="mt-4" scroll-x="100%" :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />
</template>

<script setup lang="tsx">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useTablePage from '@/hooks/useTablePage'
import { getResources, deleteResource, getResourceEnums } from '@/request/api/resource'
import type { GetResourcesRequest } from '@/shared/resource'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { Resource } from '@/shared/resource'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useEnums } from '@/hooks/useEnums'

// 页面加载状态
usePageLoading()

// 消息提示
const message = useMessage()

// 路由
const router = useRouter()

// 搜索表单模型
interface IFormModel {
  name: string
  type: number | null
  path: string
  isActive: number | null
}

const formModel = ref<IFormModel>({
  name: '',
  type: null,
  path: '',
  isActive: null
})

// 获取资源枚举数据
const { data: enumsData } = useEnums<Record<string, SelectOption[]>>({
  api: async () => {
    const [res] = await getResourceEnums()
    if (res) {
      return res
    }
    return {
      data: {}
    }
  },
  key: 'resource-enums',
  autoRefresh: true
})

// 资源类型枚举选项
const resourceEnums = computed(() => {
  return enumsData.value?.resourceType || []
})

// 状态枚举选项
const statusOptions = computed(() => {
  return enumsData.value?.resourceStatus || []
})

// 处理搜索重置
function handleReset() {
  formModel.value.name = ''
  formModel.value.type = null
  formModel.value.path = ''
  formModel.value.isActive = null
  refresh(true)
}

// 处理请求参数
const dealParams = (): GetResourcesRequest & Required<Pick<GetResourcesRequest, 'pagination'>> => {
  return {
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize
    },
    name: formModel.value.name || undefined,
    type: formModel.value.type || undefined,
    path: formModel.value.path || undefined,
    isActive: formModel.value.isActive || undefined
  }
}

// 自定义表格列
const customColumns: DataTableColumns<Resource> = [
  {
    title: '资源名称',
    key: 'name',
    width: 160,
    fixed: 'left',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '资源类型',
    key: 'type',
    width: 100,
    render: (row) => {
      const typeMap: Record<number, { label: string; color: string }> = {
        1: { label: '页面', color: 'info' },
        2: { label: '接口', color: 'success' },
        3: { label: '模块', color: 'warning' }
      }
      const typeInfo = typeMap[row.type] || { label: '未知', color: 'default' }
      return (
        <NTag type={typeInfo.color as any} size="small">
          {typeInfo.label}
        </NTag>
      )
    }
  },
  {
    title: '资源编码',
    key: 'resCode',
    width: 160,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '资源路径',
    key: 'path',
    width: 160,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '状态',
    key: 'isActive',
    width: 80,
    render: (row) => {
      return (
        <NTag type={row.isActive ? 'success' : 'error'} size="small">
          {row.isActive ? '启用' : '禁用'}
        </NTag>
      )
    }
  },
  {
    title: '排序',
    key: 'sortOrder',
    width: 80
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 165
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render: (row) => {
      return (
        <div class="flex items-center flex-wrap gap-1">
          {/* 编辑按钮 */}
          <NButton size="small" type="primary" quaternary onClick={() => handleEdit(row)}>
            {{ default: () => '编辑' }}
          </NButton>

          {/* 删除按钮 */}
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              trigger: () => (
                <NButton size="small" type="error" quaternary>
                  {{ default: () => '删除' }}
                </NButton>
              ),
              default: () => '确定删除该资源吗？'
            }}
          </NPopconfirm>
        </div>
      )
    }
  }
]

// 使用表格分页 hook，不返回 header，使用自定义列
const { pagination, tableColumns, tableData, loading, refresh } = useTablePage<GetResourcesRequest & IPaginationRequest, Resource>(getResources, dealParams, {
  returnHeader: false,
  immediate: true
})

// 设置自定义表格列
tableColumns.value = customColumns

// 操作函数
function handleAddResource() {
  router.push('/system-manage/resource/create')
}

function handleEdit(resource: Resource) {
  router.push(`/system-manage/resource/edit?id=${resource.id}`)
}

async function handleDelete(id: string) {
  const [, error] = await deleteResource(id)
  if (error) {
    message.error(`删除失败: ${error.message}`)
    return
  }

  message.success('删除成功')
  refresh() // 刷新列表
}

// 首次加载资源列表
refresh()
</script>

<!-- 样式已迁移到Tailwind CSS类 -->
