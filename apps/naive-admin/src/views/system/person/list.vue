<template>
  <SearchPanel :cols="4" labelWidth="80" :formModel="formModel" :searchLoading="loading" searchOnUpdate @search="refresh" @reset="handleReset">
    <template #top>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">人员管理</h2>
        <n-button type="primary" @click="handleCreate">
          <template #icon>
            <Icon icon="ion:add" width="16" height="16" />
          </template>
          新增人员
        </n-button>
      </div>
    </template>

    <WrapCol label="手机号">
      <n-input v-model:value="formModel.phone" placeholder="请输入手机号" clearable />
    </WrapCol>

    <WrapCol label="用户名">
      <n-input v-model:value="formModel.username" placeholder="请输入用户名" clearable />
    </WrapCol>

    <WrapCol label="状态">
      <n-select v-model:value="formModel.isActive" :options="statusOptions" placeholder="请选择状态" clearable />
    </WrapCol>

    <WrapCol label="角色">
      <n-select v-model:value="formModel.roleId" :options="roleOptions" placeholder="请选择角色" clearable />
    </WrapCol>
  </SearchPanel>

  <n-data-table class="mt-4" :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { NButton, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useTablePage from '@/hooks/useTablePage'
import { getUserList, deleteUser, type UserInfo } from '@/request/api/users'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import type { DataTableColumns } from 'naive-ui'
import { usePageLoading } from '@/hooks/usePageLoading'

// 页面加载状态
usePageLoading()

// 消息提示
const message = useMessage()

// 图标组件定义
const EditIcon = () => h(Icon, { icon: 'ion:create-outline', width: 16, height: 16 })
const DeleteIcon = () => h(Icon, { icon: 'ion:trash-outline', width: 16, height: 16 })

// 搜索表单模型
interface IFormModel {
  phone: string
  username: string
  isActive: boolean | null
  roleId: string | null
}

const formModel = ref<IFormModel>({
  phone: '',
  username: '',
  isActive: null,
  roleId: null
})

// 状态选项
const statusOptions = ref<SelectMixedOption[]>([
  { label: '全部', value: null },
  { label: '激活', value: true },
  { label: '未激活', value: false }
])

// 角色选项（这里可以从角色管理API获取）
const roleOptions = ref<SelectMixedOption[]>([
  { label: '全部', value: null },
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' }
])

// 请求参数类型
interface IUserListRequest extends IPaginationRequest {
  phone?: string
  username?: string
  isActive?: boolean
  roleId?: string
}

// 处理搜索重置
function handleReset() {
  formModel.value.phone = ''
  formModel.value.username = ''
  formModel.value.isActive = null
  formModel.value.roleId = null
  refresh(true)
}

// 请求函数适配器
const requestFn = async (params: IUserListRequest) => {
  const requestParams = {
    page: params.page,
    pageSize: params.pageSize,
    keyword: params.phone || params.username || undefined,
    isActive: params.isActive
  }

  const [data, error] = await getUserList(requestParams)

  if (error) {
    return [null, error]
  }

  // 适配返回数据格式
  const adaptedData = {
    data: {
      tableData: data?.items || [],
      pageData: {
        count: data?.pagination?.total || 0,
        page: data?.pagination?.page || 1,
        pageSize: data?.pagination?.pageSize || 30
      }
    }
  }

  return [adaptedData, null]
}

// 处理请求参数
const dealParams = (): IUserListRequest => {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    phone: formModel.value.phone || undefined,
    username: formModel.value.username || undefined,
    isActive: formModel.value.isActive,
    roleId: formModel.value.roleId || undefined
  }
}

// 自定义表格列
const customColumns: DataTableColumns<UserInfo> = [
  {
    title: '手机号',
    key: 'phone',
    width: 120,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '用户名',
    key: 'username',
    width: 120,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '状态',
    key: 'isActive',
    width: 80,
    render: (row) => {
      return h(
        NTag,
        {
          type: row.isActive ? 'success' : 'error',
          size: 'small'
        },
        {
          default: () => (row.isActive ? '激活' : '未激活')
        }
      )
    }
  },
  {
    title: '角色',
    key: 'roleIds',
    width: 150,
    render: (row) => {
      if (!row.roleIds || row.roleIds.length === 0) {
        return h(NTag, { type: 'default', size: 'small' }, { default: () => '无角色' })
      }
      return row.roleIds.map((roleId) =>
        h(
          NTag,
          {
            type: 'info',
            size: 'small',
            class: 'mr-1'
          },
          {
            default: () => roleId
          }
        )
      )
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: (row) => {
      if (!row.createdAt) return '-'
      return new Date(row.createdAt.seconds * 1000).toLocaleString()
    }
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 160,
    render: (row) => {
      if (!row.updatedAt) return '-'
      return new Date(row.updatedAt.seconds * 1000).toLocaleString()
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (row) => {
      return [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => handleEdit(row),
            class: 'mr-2'
          },
          {
            default: () => '编辑',
            icon: () => h(NIcon, null, { default: () => h(EditIcon) })
          }
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row.phone)
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                  ghost: true
                },
                {
                  default: () => '删除',
                  icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
                }
              ),
            default: () => '确定删除该用户吗？'
          }
        )
      ]
    }
  }
]

// 使用表格分页 hook，不返回 header，使用自定义列
const { pagination, tableColumns, tableData, loading, refresh } = useTablePage<IUserListRequest, UserInfo>(requestFn, dealParams, {
  returnHeader: false,
  immediate: true
})

// 设置自定义表格列
tableColumns.value = customColumns

// 操作函数
function handleCreate() {
  // TODO: 跳转到新增用户页面或打开新增用户弹窗
  message.info('新增用户功能待实现')
}

function handleEdit(user: UserInfo) {
  // TODO: 跳转到编辑用户页面或打开编辑用户弹窗
  message.info(`编辑用户: ${user.username}`)
}

async function handleDelete(phone: string) {
  const [, error] = await deleteUser(phone)
  if (error) {
    message.error(`删除失败: ${error.message}`)
    return
  }

  message.success('删除成功')
  refresh() // 刷新列表
}

// 首次加载
refresh()
</script>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
