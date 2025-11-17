<template>
  <SearchPanel :cols="4" labelWidth="80" :formModel="formModel" :searchLoading="loading" searchOnUpdate @search="refresh" @reset="handleReset">
    <template #top>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">资源管理</h2>
        <n-button type="primary" @click="handleAddResource">
          <template #icon>
            <Icon icon="ion:add" width="16" height="16" />
          </template>
          新增资源
        </n-button>
      </div>
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

  <n-data-table class="mt-4" :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />
</template>

<script setup lang="tsx">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useTablePage from '@/hooks/useTablePage'
import { getResources, deleteResource, getResourceEnums } from '@/request/api/resource'
import type { DataTableColumns } from 'naive-ui'
import { Resource } from '@/shared/resource'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useEnums } from '@/hooks/useEnums'
import { EnumItem } from '@/shared/common'

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
  isActive: boolean | null
}

const formModel = ref<IFormModel>({
  name: '',
  type: null,
  path: '',
  isActive: null
})

// 获取资源枚举数据
const { data: enumsData } = useEnums<Record<string, EnumItem[]>>({
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
  refresh: true
})

// 资源类型枚举选项
const resourceEnums = computed(() => {
  return enumsData.value?.resourceType || []
})

// 状态枚举选项
const statusOptions = computed(() => {
  return enumsData.value?.isActive || []
})

// 处理搜索重置
function handleReset() {
  formModel.value.name = ''
  formModel.value.type = null
  formModel.value.path = ''
  formModel.value.isActive = null
  refresh(true)
}

// 请求参数类型
interface IResourceListRequest {
  page: number
  pageSize: number
  name?: string
  type?: number
  path?: string
  isActive?: boolean
}

// 请求函数适配器
const requestFn = async (params: IResourceListRequest): Promise<[ResResult<IPaginationResData<Resource[]>>, null] | [null, any]> => {
  const requestParams = {
    page: params.page,
    pageSize: params.pageSize,
    name: params.name || undefined,
    type: params.type || undefined,
    path: params.path || undefined,
    isActive: params.isActive || undefined
  }

  const [res, error] = await getResources(requestParams)

  if (error) {
    return [null, error]
  }

  // 适配返回数据格式
  const adaptedData: ResResult<IPaginationResData<Resource[]>> = {
    data: {
      tableData: res?.data || [],
      pageData: {
        count: res?.data?.length || 0, // 临时数据，需要后端提供总数
        page: params.page,
        pageSize: params.pageSize
      }
    }
  }

  return [adaptedData, null]
}

// 处理请求参数
const dealParams = (): IResourceListRequest => {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
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
    width: 180,
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
        0: { label: '页面', color: 'blue' },
        1: { label: '接口', color: 'green' },
        2: { label: '按钮', color: 'orange' }
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
    title: '资源路径',
    key: 'path',
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
    width: 160
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
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
const { pagination, tableColumns, tableData, loading, refresh } = useTablePage<IResourceListRequest, Resource>(requestFn, dealParams, {
  returnHeader: false,
  immediate: true
})

// 设置自定义表格列
tableColumns.value = customColumns

// 操作函数
function handleAddResource() {
  router.push('/resource/create')
}

function handleEdit(resource: Resource) {
  router.push(`/resource/edit/${resource.id}`)
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

<style scoped>
.resource-management {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #f5f5f5;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.resource-container {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow: hidden;
}

.resource-tree-panel {
  width: 320px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.resource-list-panel {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
}
</style>
