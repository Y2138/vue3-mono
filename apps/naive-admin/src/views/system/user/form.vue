<template>
  <n-card :title="pageTitle" class="mt-4">
    <template #header-extra>
      <n-button @click="handleBack">返回</n-button>
    </template>

    <div v-if="loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <div v-else>
      <!-- 表单模式：新增/编辑 -->
      <template v-if="mode === 'create' || mode === 'edit'">
        <form-root ref="formRef" class="pt-4" v-model:formModel="formModel" :formConfigs="formConfigs" :selectOptions="selectOptions" label-placement="left" label-width="80" :disabled="submitting" />

        <!-- 编辑模式下展示状态和创建时间（只读） -->
        <template v-if="mode === 'edit'">
          <n-descriptions :column="2" bordered label-placement="left" class="mt-4">
            <n-descriptions-item label="状态">
              <n-tag :type="getStatusType(formModel.status)">
                {{ getStatusText(formModel.status) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="创建时间">
              {{ userInfo?.createdAt }}
            </n-descriptions-item>
          </n-descriptions>
        </template>

        <!-- 密码提示（仅新增模式） -->
        <n-alert v-if="mode === 'create' && passwordTip" type="info" class="mb-4 mt-4">
          {{ passwordTip }}
        </n-alert>

        <!-- 角色分配组件 -->
        <div class="mt-4">
          <RoleAssignment v-if="mode === 'create'" v-model:roleIds="formModel.roleIds" />
          <RoleAssignment v-else :phone="formModel.phone" :initial-role-ids="formModel.roleIds" @update:roleIds="handleRoleIdsChange" />
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end space-x-2 mt-6">
          <n-button @click="handleCancel" :disabled="submitting"> 取消 </n-button>
          <n-button type="primary" @click="handleSubmit" :loading="submitting"> 确定 </n-button>
        </div>
      </template>

      <!-- 详情模式：只读展示 -->
      <template v-else-if="mode === 'detail'">
        <n-descriptions :column="2" bordered label-placement="left">
          <n-descriptions-item label="手机号">
            {{ formModel.phone }}
          </n-descriptions-item>
          <n-descriptions-item label="用户名">
            {{ formModel.username }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="getStatusType(formModel.status)">
              {{ getStatusText(formModel.status) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ userInfo?.createdAt }}
          </n-descriptions-item>
          <n-descriptions-item label="更新时间">
            {{ userInfo?.updatedAt }}
          </n-descriptions-item>
          <n-descriptions-item label="角色">
            <div v-if="formModel.roleIds && formModel.roleIds.length > 0">
              <n-tag v-for="roleId in formModel.roleIds" :key="roleId" type="info" size="small" class="mr-1">
                {{ roleId }}
              </n-tag>
            </div>
            <span v-else>无角色</span>
          </n-descriptions-item>
        </n-descriptions>

        <!-- 角色分配组件（详情模式只读） -->
        <div class="mt-4">
          <RoleAssignment :phone="formModel.phone" :initial-role-ids="formModel.roleIds" :disabled="true" />
        </div>
      </template>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NSpin, NAlert, NDescriptions, NDescriptionsItem, NTag, useMessage } from 'naive-ui'
import { createUserForm, getUserByPhone, updateUser, getUserEnums, type UserInfo } from '@/request/api/users'
import type { IFormConfig, DFormRootInst } from '@/components/dForm/types'
import RoleAssignment from './components/RoleAssignment.vue'
import { EnumItem } from '@/shared/common'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const formRef = useTemplateRef<DFormRootInst>('formRef')

// 页面模式：create | edit | detail
const mode = computed<'create' | 'edit' | 'detail'>(() => {
  const path = route.path
  if (path.includes('/create')) return 'create'
  if (path.includes('/edit')) return 'edit'
  return 'detail'
})

// 页面标题
const pageTitle = computed(() => {
  switch (mode.value) {
    case 'create':
      return '新增人员'
    case 'edit':
      return '编辑人员'
    case 'detail':
      return '人员详情'
    default:
      return '人员管理'
  }
})

const loading = ref(false)
const submitting = ref(false)
const userInfo = ref<UserInfo | null>(null)

// 用户枚举数据
const userEnums = ref<Record<string, EnumItem[]>>({
  userStatus: []
})

// 表单数据
const formModel = ref<Record<string, unknown>>({
  phone: '',
  username: '',
  status: 2,
  roleIds: [] as string[]
})

// 选择器选项
const selectOptions = computed(() => ({
  userStatus: userEnums.value.userStatus || []
}))

// 密码提示（仅新增模式）
const passwordTip = computed(() => {
  if (mode.value === 'create' && formModel.value.phone && typeof formModel.value.phone === 'string' && formModel.value.phone.length >= 6) {
    const lastSix = formModel.value.phone.slice(-6)
    return `系统将自动生成默认密码：Aa${lastSix}（手机号后6位）`
  }
  return ''
})

// dForm 表单配置
const formConfigs = computed<IFormConfig[]>(() => {
  const baseConfigs: IFormConfig[] = [
    {
      valueKey: 'phone',
      comp: 'n-input',
      label: '手机号',
      required: true,
      rules:
        mode.value === 'create'
          ? [
              { required: true, message: '请输入手机号', trigger: 'blur' },
              {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号格式',
                trigger: 'blur'
              }
            ]
          : [],
      props: {
        placeholder: '请输入手机号',
        clearable: true,
        disabled: mode.value !== 'create' // 编辑和详情模式下禁用
      }
    },
    {
      valueKey: 'username',
      comp: 'n-input',
      label: '用户名',
      required: true,
      rules: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 20, message: '用户名长度应在2-20个字符之间', trigger: 'blur' }
      ],
      props: {
        placeholder: '请输入用户名',
        clearable: true,
        disabled: mode.value === 'detail' // 详情模式下禁用
      }
    }
  ]

  // 详情模式添加状态字段（编辑模式下状态字段不在表单中，单独展示）
  if (mode.value === 'detail') {
    baseConfigs.push({
      valueKey: 'status',
      comp: 'n-select',
      label: '状态',
      required: true,
      rules: [],
      props: {
        placeholder: '请选择状态',
        options: selectOptions.value.userStatus,
        disabled: true // 详情模式下禁用
      }
    })
  }

  return baseConfigs
})

// 加载用户枚举
const loadUserEnums = async () => {
  try {
    const { data } = await getUserEnums()
    if (data) {
      userEnums.value = data
    }
  } catch (err: any) {
    console.error('加载用户枚举失败:', err)
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  const phone = route.query.phone as string
  if (!phone) {
    if (mode.value !== 'create') {
      message.error('缺少用户手机号参数')
      router.back()
    }
    return
  }

  loading.value = true
  try {
    const [result, error] = await getUserByPhone(phone)
    if (error) {
      message.error(`获取用户信息失败: ${error.message}`)
      router.back()
      return
    }

    if (result?.data) {
      const user = result.data
      userInfo.value = user
      formModel.value = {
        phone: user.phone,
        username: user.username,
        status: user.status,
        roleIds: user.roleIds || []
      }
    } else {
      message.error('用户信息不存在')
      router.back()
    }
  } catch (err: any) {
    message.error(`获取用户信息失败: ${err.message}`)
    router.back()
  } finally {
    loading.value = false
  }
}

// 处理角色ID变化
const handleRoleIdsChange = (roleIds: string[]) => {
  formModel.value.roleIds = roleIds
}

// 重置表单
const resetForm = () => {
  formModel.value = {
    phone: '',
    username: '',
    status: 2,
    roleIds: []
  }
  formRef.value?.restoreValidation()
}

// 获取状态类型
const getStatusType = (status?: number) => {
  switch (status) {
    case 2:
      return 'success'
    case 3:
      return 'warning'
    case 4:
      return 'error'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status?: number) => {
  switch (status) {
    case 1:
      return '待激活'
    case 2:
      return '激活'
    case 3:
      return '下线'
    case 4:
      return '锁定'
    default:
      return '未知状态'
  }
}

// 处理返回
const handleBack = () => {
  router.back()
}

// 处理取消
const handleCancel = () => {
  router.back()
}

// 处理提交
const handleSubmit = async () => {
  try {
    // 表单验证
    const validateResult = await formRef.value?.validate()
    if (validateResult?.warnings) {
      return
    }

    submitting.value = true

    const phone = formModel.value.phone as string
    const username = formModel.value.username as string
    const roleIds = (formModel.value.roleIds as string[]) || []

    if (mode.value === 'create') {
      // 新增模式
      const [result, error] = await createUserForm({ phone, username })

      if (error) {
        message.error(error.message || '新增人员失败')
        return
      }

      // 如果创建成功且有角色ID，分配角色
      if (result?.data && roleIds.length > 0) {
        const { assignUserRoles } = await import('@/request/api/users')
        const [, assignError] = await assignUserRoles(phone, roleIds)
        if (assignError) {
          message.warning(`用户创建成功，但角色分配失败: ${assignError.message}`)
        }
      }

      if (result?.data) {
        message.success('新增人员成功')
        router.back()
      } else {
        message.error('新增人员失败：返回数据异常')
      }
    } else if (mode.value === 'edit') {
      // 编辑模式（不允许更新状态字段）
      const [result, error] = await updateUser({
        phone,
        username,
        roleIds
      })

      if (error) {
        message.error(error.message || '更新用户失败')
        return
      }

      if (result?.data) {
        message.success('更新用户成功')
        router.back()
      } else {
        message.error('更新用户失败：返回数据异常')
      }
    }
  } catch (error) {
    console.error('提交失败:', error)
    message.error('表单验证失败，请检查输入信息')
  } finally {
    submitting.value = false
  }
}

// 初始化
onMounted(() => {
  if (mode.value === 'create') {
    // 新增模式：加载枚举，重置表单
    loadUserEnums()
    resetForm()
  } else {
    // 编辑/详情模式：加载枚举和用户信息
    loadUserEnums()
    loadUserInfo()
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
