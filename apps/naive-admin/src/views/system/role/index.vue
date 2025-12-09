<template>
  <SearchPanel :cols="4" labelWidth="80" :formModel="formModel" :searchLoading="loading" searchOnUpdate @search="refresh" @reset="handleReset">
    <template #top>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">角色管理</h2>
        <n-button type="primary" @click="handleAddRole">
          <template #icon>
            <Icon icon="ion:add" width="16" height="16" />
          </template>
          新增角色
        </n-button>
      </div>
    </template>

    <WrapCol label="角色名称">
      <n-input v-model:value="formModel.name" placeholder="请输入角色名称" clearable />
    </WrapCol>
  </SearchPanel>

  <n-data-table class="mt-4" scroll-x="100%" :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />
</template>

<script setup lang="tsx">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NTag, NPopconfirm, useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useTablePage from '@/hooks/useTablePage'
import { getRoles, deleteRole } from '@/request/api/role'
import type { RoleInfo } from '@/request/api/resource'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useEnums } from '@/hooks/useEnums'
import type { GetRolesRequest } from '@/shared/role'

// 页面加载状态
usePageLoading()

// 消息提示
const message = useMessage()

// 路由
const router = useRouter()

// 搜索表单模型
interface IFormModel {
  name: string
  isActive: number | null
  isSuperAdmin: number | null
}

const formModel = ref<IFormModel>({
  name: '',
  isActive: null,
  isSuperAdmin: null
})

// 获取角色枚举数据 - 由于没有专用API，使用默认枚举
const { data: enumsData } = useEnums<Record<string, SelectOption[]>>({
  api: async () => {
    // 模拟获取角色枚举（如果后端有专门的枚举接口，可以替换这里）
    return {
      data: {
        roleStatus: [
          { label: '全部', value: null },
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 }
        ]
      }
    }
  },
  key: 'role-enums',
  autoRefresh: true
})

// 状态枚举选项
const statusOptions = computed(() => {
  return enumsData.value?.roleStatus || []
})

// 处理搜索重置
function handleReset() {
  formModel.value.name = ''
  formModel.value.isActive = null
  formModel.value.isSuperAdmin = null
  refresh(true)
}

// 处理请求参数
const dealParams = (): GetRolesRequest => {
  return {
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize
    },
    search: formModel.value.name || undefined
  }
}

// 自定义表格列
const customColumns: DataTableColumns<RoleInfo> = [
  {
    title: '角色名称',
    key: 'name',
    width: 180,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 160
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
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
              default: () => '确定删除该角色吗？'
            }}
          </NPopconfirm>
        </div>
      )
    }
  }
]

// 使用表格分页 hook，不返回 header，使用自定义列
const { pagination, tableColumns, tableData, loading, refresh } = useTablePage<GetRolesRequest, RoleInfo>(getRoles, dealParams, {
  returnHeader: false,
  immediate: true
})

// 设置自定义表格列
tableColumns.value = customColumns

// 操作函数
function handleAddRole() {
  router.push('/system-manage/role/create')
}

function handleEdit(role: RoleInfo) {
  router.push(`/system-manage/role/edit?id=${role.id}`)
}

function handleAssignPermissions(role: RoleInfo) {
  router.push(`/system-manage/role/permissions?id=${role.id}`)
}

async function handleDelete(id: string) {
  const [, error] = await deleteRole({ id })
  if (error) {
    message.error(`删除失败: ${error.message}`)
    return
  }

  message.success('删除成功')
  refresh() // 刷新列表
}

// 首次加载角色列表
refresh()
</script>

<!-- 样式已迁移到Tailwind CSS类 -->
