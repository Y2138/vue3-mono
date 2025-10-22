<template>
  <SearchPanel :cols="4" labelWidth="60" :formModel="formModel" :searchLoading="loading" searchOnUpdate @search="refresh" @reset="handleReset">
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
      <n-select v-model:value="formModel.isActive" :options="statusOptions as any" placeholder="请选择状态" clearable />
    </WrapCol>

    <WrapCol label="角色">
      <n-select v-model:value="formModel.roleId" :options="roleOptions as any" placeholder="请选择角色" clearable />
    </WrapCol>
  </SearchPanel>

  <n-data-table class="mt-4" :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />
</template>

<script setup lang="tsx">
import { ref, onMounted } from 'vue'
import { NButton, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useTablePage from '@/hooks/useTablePage'
import { getUserList, deleteUser, getUserEnums, type UserInfo } from '@/request/api/users'
// 自定义选项接口
interface ISelectOption {
  label: string
  value: string | number | boolean | null
  disabled?: boolean
}
import type { DataTableColumns } from 'naive-ui'
import { usePageLoading } from '@/hooks/usePageLoading'

// 页面加载状态
usePageLoading()

// 消息提示
const message = useMessage()

// 图标组件定义
const EditIcon = () => <Icon icon="ion:create-outline" width={16} height={16} />
const DeleteIcon = () => <Icon icon="ion:trash-outline" width={16} height={16} />

// 搜索表单模型
interface IFormModel {
  phone: string
  username: string
  isActive: string | null
  roleId: string | null
}

const formModel = ref<IFormModel>({
  phone: '',
  username: '',
  isActive: null,
  roleId: null
})

// 状态选项 - 从 API 获取
const statusOptions = ref<ISelectOption[]>([{ label: '全部', value: null }])

// 角色选项（这里可以从角色管理API获取）
const roleOptions = ref<ISelectOption[]>([
  { label: '全部', value: null },
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' }
])

// 枚举数据
const userEnums = ref<any>({})

/**
 * 获取用户枚举数据
 */
async function loadUserEnums() {
  const { data, error } = await getUserEnums()

  if (error) {
    message.error(`获取枚举数据失败: ${error.message}`)
    return
  }

  if (data?.enums) {
    userEnums.value = data.enums

    // 更新状态选项 - 将枚举值映射为前端需要的格式
    if (data.enums.USER_STATUS) {
      const statusEnumOptions = Object.values(data.enums.USER_STATUS)
        .filter((item: any) => item.value === 1 || item.value === -1) // 只显示激活和下线状态
        .map((item: any) => ({
          label: item.label,
          value: item.value === 1 ? 'true' : 'false', // 转换为字符串布尔值
          disabled: item.disabled || false
        }))

      statusOptions.value = [{ label: '全部', value: null }, ...statusEnumOptions]
    }

    // 如果有用户类型枚举，也可以更新角色选项
    if (data.enums.USER_TYPE) {
      const typeEnumOptions = Object.values(data.enums.USER_TYPE).map((item: any) => ({
        label: item.label,
        value: item.value,
        disabled: item.disabled || false
      }))

      roleOptions.value = [{ label: '全部', value: null }, ...typeEnumOptions]
    }
  }
}

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
const requestFn = async (params: IUserListRequest): Promise<[ResResult<IPaginationResData<UserInfo[]>>, null] | [null, any]> => {
  const requestParams = {
    page: params.page,
    pageSize: params.pageSize,
    phone: params.phone || undefined,
    username: params.username || undefined,
    roleIds: params.roleId ? [params.roleId] : [],
    isActive: params.isActive
  }

  const [res, error] = await getUserList(requestParams)

  if (error) {
    return [null, error]
  }
  const { list, pagination } = res?.data || {}

  // 适配返回数据格式
  const adaptedData: ResResult<IPaginationResData<UserInfo[]>> = {
    data: {
      tableData: list || [],
      pageData: {
        count: Number(pagination?.total) || 0,
        page: Number(pagination?.page) || 1,
        pageSize: Number(pagination?.pageSize) || 30
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
    isActive: formModel.value.isActive === 'true' ? true : formModel.value.isActive === 'false' ? false : undefined,
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
      // 使用枚举数据渲染状态
      if (userEnums.value.USER_STATUS) {
        const statusEnum = Object.values(userEnums.value.USER_STATUS).find((item: any) => item.value === (row.isActive ? 1 : -1))

        if (statusEnum) {
          const tagType = (statusEnum as any).color === 'success' ? 'success' : (statusEnum as any).color === 'danger' ? 'error' : (statusEnum as any).color === 'warning' ? 'warning' : 'default'

          return (
            <NTag type={tagType} size="small">
              {(statusEnum as any).label}
            </NTag>
          )
        }
      }

      // 兜底显示
      return (
        <NTag type={row.isActive ? 'success' : 'error'} size="small">
          {row.isActive ? '激活' : '未激活'}
        </NTag>
      )
    }
  },
  {
    title: '角色',
    key: 'roleIds',
    width: 150,
    render: (row) => {
      if (!row.roleIds || row.roleIds.length === 0) {
        return (
          <NTag type="default" size="small">
            无角色
          </NTag>
        )
      }
      return row.roleIds.map((roleId) => (
        <NTag key={roleId} type="info" size="small" class="mr-1">
          {roleId}
        </NTag>
      ))
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
    width: 150,
    fixed: 'right',
    render: (row) => {
      return (
        <div class="flex items-center">
          <NButton size="small" type="primary" quaternary onClick={() => handleEdit(row)} class="mr-2">
            {{
              default: () => '编辑',
              icon: () => (
                <NIcon>
                  <EditIcon />
                </NIcon>
              )
            }}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.phone)}>
            {{
              trigger: () => (
                <NButton size="small" type="error" quaternary>
                  {{
                    default: () => '删除',
                    icon: () => (
                      <NIcon>
                        <DeleteIcon />
                      </NIcon>
                    )
                  }}
                </NButton>
              ),
              default: () => '确定删除该用户吗？'
            }}
          </NPopconfirm>
        </div>
      )
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

// 初始化数据
onMounted(async () => {
  // 加载枚举数据
  await loadUserEnums()
  // 首次加载用户列表
  refresh()
})
</script>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
