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
      <n-select v-model:value="formModel.status" :options="userEnums.userStatus || []" placeholder="请选择状态" clearable />
    </WrapCol>

    <WrapCol label="角色">
      <n-select v-model:value="formModel.roleId" :options="userEnums.userType || []" placeholder="请选择角色" clearable />
    </WrapCol>
  </SearchPanel>

  <n-data-table class="mt-4" :columns="tableColumns" :data="tableData" :pagination="pagination" :loading="loading" />
</template>

<script setup lang="tsx">
import { ref, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useTablePage from '@/hooks/useTablePage'
import { getUserList, deleteUser, getUserEnums, updateUserStatusByAction, type UserInfo } from '@/request/api/users'
import { useEnums } from '@/hooks/useEnums'
import type { DataTableColumns } from 'naive-ui'
import { usePageLoading } from '@/hooks/usePageLoading'
import { EnumItem } from '@/shared/common'

// 页面加载状态
usePageLoading()

// 消息提示
const message = useMessage()

// 路由
const router = useRouter()

// 图标组件定义
const ActivateIcon = () => <Icon icon="ion:checkmark-circle-outline" width={16} height={16} />
const DeactivateIcon = () => <Icon icon="ion:remove-circle-outline" width={16} height={16} />
const LockIcon = () => <Icon icon="ion:lock-closed-outline" width={16} height={16} />
const UnlockIcon = () => <Icon icon="ion:lock-open-outline" width={16} height={16} />

// 搜索表单模型
interface IFormModel {
  phone: string
  username: string
  status: number | null
  roleId: string | null
}

const formModel = ref<IFormModel>({
  phone: '',
  username: '',
  status: null,
  roleId: null
})

// 使用 useEnums hook 获取用户枚举数据
const { data: userEnums } = useEnums<Record<string, EnumItem[]>>({
  api: getUserEnums,
  key: 'user-enums',
  refresh: true,
  defaultValue: {
    userStatus: [],
    userType: []
  }
})

// 请求参数类型
interface IUserListRequest extends IPaginationRequest {
  phone?: string
  username?: string
  statusList?: number[]
  roleId?: string
}

// 处理搜索重置
function handleReset() {
  formModel.value.phone = ''
  formModel.value.username = ''
  formModel.value.status = null
  formModel.value.roleId = null
  refresh(true)
}

// 请求函数适配器
const requestFn = async (params: IUserListRequest): Promise<[ResResult<UserInfo[]>, null] | [null, any]> => {
  const requestParams = {
    page: params.page,
    pageSize: params.pageSize,
    phone: params.phone || undefined,
    username: params.username || undefined,
    roleIds: params.roleId ? [params.roleId] : [],
    statusList: params.statusList && params.statusList.length > 0 ? params.statusList : []
  }

  const [res, error] = await getUserList(requestParams)

  if (error) {
    return [null, error]
  }
  const { list, pagination } = res?.data || {}

  // 适配返回数据格式
  const adaptedData: ResResult<UserInfo[]> = {
    code: res.code,
    success: res.success,
    data: list || [],
    pagination: {
      total: Number(pagination?.total) || 0,
      page: Number(pagination?.page) || 1,
      pageSize: Number(pagination?.pageSize) || 30
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
    statusList: formModel.value.status ? [formModel.value.status] : [],
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
    key: 'status',
    width: 80,
    render: (row) => {
      // 使用新的 status 和 statusDesc 字段
      if (row.status !== undefined && row.statusDesc) {
        const tagType = row.status === 2 ? 'success' : row.status === 1 ? 'info' : row.status === 3 ? 'warning' : 'error'
        return (
          <NTag type={tagType} size="small">
            {row.statusDesc}
          </NTag>
        )
      }
      // 兜底显示（向后兼容）
      return (
        <NTag type="default" size="small">
          未知状态
        </NTag>
      )
    }
  },
  {
    title: '角色',
    key: 'roleIds',
    width: 200,
    render: (row) => {
      if (!row.roleIds || row.roleIds.length === 0) {
        return (
          <NTag type="default" size="small">
            无角色
          </NTag>
        )
      }
      // TODO: 这里应该显示角色名称，而不是角色ID
      // 需要从角色列表获取角色名称映射
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
    width: 250,
    fixed: 'right',
    render: (row) => {
      const statusActions = getStatusActions(row)

      return (
        <div class="flex items-center flex-wrap gap-1">
          {/* 查看详情按钮 */}
          <NButton size="small" type="info" quaternary onClick={() => handleViewDetail(row)}>
            {{ default: () => '详情' }}
          </NButton>

          {/* 编辑按钮 */}
          <NButton size="small" type="primary" quaternary onClick={() => handleEdit(row)}>
            {{ default: () => '编辑' }}
          </NButton>

          {/* 状态操作按钮 */}
          {statusActions.map((action, index) => (
            <NPopconfirm key={index} onPositiveClick={action.action}>
              {{
                trigger: () => (
                  <NButton size="small" type={action.type} quaternary>
                    {{ default: () => action.label }}
                  </NButton>
                ),
                default: () => action.confirmText
              }}
            </NPopconfirm>
          ))}

          {/* 删除按钮 */}
          <NPopconfirm onPositiveClick={() => handleDelete(row.phone)}>
            {{
              trigger: () => (
                <NButton size="small" type="error" quaternary>
                  {{ default: () => '删除' }}
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
  router.push({
    path: '/system-manage/user/create'
  })
}

// 处理查看详情
const handleViewDetail = (row: UserInfo) => {
  router.push({
    path: '/system-manage/user/detail',
    query: { phone: row.phone }
  })
}

function handleEdit(user: UserInfo) {
  router.push({
    path: '/system-manage/user/edit',
    query: { phone: user.phone }
  })
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

// 状态操作函数
async function handleActivate(phone: string) {
  const [, error] = await updateUserStatusByAction(phone, 'activate')
  if (error) {
    message.error(`激活失败: ${error.message}`)
    return
  }

  message.success('用户激活成功')
  refresh() // 刷新列表
}

async function handleDeactivate(phone: string) {
  const [, error] = await updateUserStatusByAction(phone, 'deactivate')
  if (error) {
    message.error(`下线失败: ${error.message}`)
    return
  }

  message.success('用户下线成功')
  refresh() // 刷新列表
}

async function handleLock(phone: string) {
  const [, error] = await updateUserStatusByAction(phone, 'lock')
  if (error) {
    message.error(`锁定失败: ${error.message}`)
    return
  }

  message.success('用户锁定成功')
  refresh() // 刷新列表
}

async function handleUnlock(phone: string) {
  const [, error] = await updateUserStatusByAction(phone, 'unlock')
  if (error) {
    message.error(`解锁失败: ${error.message}`)
    return
  }

  message.success('用户解锁成功')
  refresh() // 刷新列表
}

// 根据用户状态获取可用的操作按钮
function getStatusActions(user: UserInfo) {
  const actions: Array<{
    label: string
    type: 'success' | 'warning' | 'error' | 'info'
    icon?: any
    action: () => void
    confirmText: string
  }> = []

  switch (user.status) {
    case 1: // 待激活
      actions.push({
        label: '激活',
        type: 'success',
        action: () => handleActivate(user.phone),
        confirmText: '确定激活该用户吗？'
      })
      break
    case 2: // 激活
      actions.push(
        {
          label: '下线',
          type: 'warning',
          action: () => handleDeactivate(user.phone),
          confirmText: '确定下线该用户吗？'
        },
        {
          label: '锁定',
          type: 'error',
          action: () => handleLock(user.phone),
          confirmText: '确定锁定该用户吗？'
        }
      )
      break
    case 3: // 下线
      actions.push({
        label: '激活',
        type: 'success',
        action: () => handleActivate(user.phone),
        confirmText: '确定激活该用户吗？'
      })
      break
    case 4: // 锁定
      actions.push({
        label: '解锁',
        type: 'info',
        action: () => handleUnlock(user.phone),
        confirmText: '确定解锁该用户吗？'
      })
      break
  }

  return actions
}

// 首次加载用户列表
refresh()

// 页面激活时刷新列表（从其他页面返回时）
onActivated(() => {
  refresh()
})
</script>

<!-- 样式已迁移到Tailwind CSS类 -->
