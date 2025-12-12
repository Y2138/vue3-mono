<template>
  <n-card :title="isEdit ? '编辑角色' : '创建角色'" class="flex flex-col max-h-full overflow-hidden" content-class="flex-1 h-0 overflow-scroll">
    <template #header-extra>
      <div class="flex space-x-3">
        <n-button class="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" @click="handleCancel"> 取消 </n-button>
        <n-button type="primary" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </n-button>
      </div>
    </template>

    <!-- 表单主体 -->
    <n-form ref="formRef" :model="formData" :rules="rules" label-width="120" label-placement="left" require-mark-placement="right-hanging">
      <!-- 基本信息 -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <div class="w-1 h-6 bg-blue-500 mr-3"></div>
          基本信息
        </h3>
        <n-grid :cols="2" :x-gap="12">
          <n-form-item-gi :span="1" label="角色名称" path="name">
            <n-input v-model:value="formData.name" placeholder="请输入角色名称" :disabled="loading" @input="handleNameChange" class="w-full" />
          </n-form-item-gi>

          <n-form-item-gi :span="1" label="角色类型" path="isSuperAdmin">
            <n-switch v-model:value="formData.isSuperAdmin" :disabled="loading || (isEdit && currentRole?.isSuperAdmin)" size="large">
              <template #checked>超级管理员</template>
              <template #unchecked>普通角色</template>
            </n-switch>
          </n-form-item-gi>
        </n-grid>
      </div>

      <!-- 权限分配区域 -->
      <div class="mb-6">
        <n-divider title-placement="left" class="text-lg font-semibold text-gray-700">
          <div class="flex items-center space-x-2">
            <Icon icon="material-symbols:security" width="20" height="20" class="text-blue-500" />
            <span>权限分配</span>
          </div>
        </n-divider>

        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <h4 class="text-md font-medium text-gray-800">Resource 权限分配</h4>
              <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{{ selectedResources.length }}</span>
            </div>
            <div class="flex space-x-2">
              <n-button size="small" class="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors" @click="handleSelectAll"> 全选 </n-button>
              <n-button size="small" class="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded hover:bg-gray-100 transition-colors" @click="handleSelectNone"> 清空 </n-button>
            </div>
          </div>

          <!-- 权限树组件 -->
          <div class="bg-white border border-gray-200 rounded-lg p-4 min-h-[300px]">
            <div v-if="loading" class="flex items-center justify-center py-12">
              <n-spin size="medium" />
              <span class="ml-2 text-gray-600">加载中...</span>
            </div>
            <ResourceTree v-else mode="edit" :resources="resourceTree" v-model:selected-ids="selectedResources" />
          </div>
        </div>
      </div>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, NForm, NFormItemGi, NGrid, NSpin } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { createRole, updateRole, getRole } from '@/request/api/role'
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '@/shared/role'
import ResourceTree from '@/views/system/components/ResourceTree.vue'
import { getResourceTree } from '@/request/api/resource'

// 消息提示
const message = useMessage()

// 路由
const router = useRouter()
const route = useRoute()

// 移除store依赖，使用内部状态管理

// 响应式数据
const formRef = ref<InstanceType<typeof NForm> | null>(null)
const loading = ref(false)
const roleId = computed(() => route.query.id as string)
const isEdit = computed(() => !!roleId.value)
const currentRole = ref<Role | null>(null)

// 表单数据
const formData = ref({
  name: '',
  description: '',
  isActive: true,
  isSuperAdmin: false
})

// 选中的资源
const selectedResources = ref<string[]>([])
const resourceTree = ref<any[]>([])

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度应在 2-50 个字符之间', trigger: 'blur' }
  ]
}

// 计算属性
const hasPermissionTree = computed(() => selectedResources.value.length > 0)

// 事件处理
const handleNameChange = () => {
  // 可以在这里实现角色名称的唯一性检查
}

const handleTreeChange = (treeData: any[], selectedIds: string[]) => {
  selectedResources.value = selectedIds
}

const handleSelectAll = () => {
  selectedResources.value = getAllResourceIds()
}

const handleSelectNone = () => {
  selectedResources.value = []
}

const getAllResourceIds = (): string[] => {
  const ids: string[] = []
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.id) ids.push(n.id)
      if (Array.isArray(n.children) && n.children.length) walk(n.children)
    }
  }
  walk(resourceTree.value)
  return ids
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch (error) {
    console.error('表单验证失败:', error)
    return
  }

  if (!isEdit.value && !formData.value.name.trim()) {
    message.error('请输入角色名称')
    return
  }

  loading.value = true

  try {
    if (isEdit.value) {
      // 更新角色
      const updateData: UpdateRoleRequest = {
        id: roleId.value,
        name: formData.value.name.trim(),
        description: formData.value.description?.trim() || undefined,
        isActive: formData.value.isActive,
        isSuperAdmin: formData.value.isSuperAdmin,
        resourceIds: selectedResources.value
      }

      const [updateResponse, updateError] = await updateRole(updateData)
      if (updateError) {
        return
      }

      message.success('角色更新成功')
      router.push('/system-manage/role')
    } else {
      // 创建角色
      const createData: CreateRoleRequest = {
        name: formData.value.name.trim(),
        description: formData.value.description?.trim() || undefined,
        isActive: formData.value.isActive,
        isSuperAdmin: formData.value.isSuperAdmin,
        resourceIds: selectedResources.value
      }

      const [createResponse, createError] = await createRole(createData)
      if (createError || !createResponse) {
        return
      }

      message.success('角色创建成功')
      router.push('/system-manage/role')
    }
  } catch (err: any) {
    console.error('操作失败:', err)
    message.error(err.message || '操作失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/system-manage/role')
}

// 加载角色数据
const loadRoleData = async () => {
  console.log('2501 roleId===>', roleId.value, isEdit.value)
  if (!isEdit.value) {
    return
  }

  loading.value = true

  try {
    // 直接调用API获取角色信息
    const [roleResponse, roleError] = await getRole({ id: roleId.value })
    if (roleError || !roleResponse) {
      return
    }

    if (roleResponse.data) {
      currentRole.value = roleResponse.data
      formData.value = {
        name: roleResponse.data.name,
        description: roleResponse.data.description || '',
        isActive: roleResponse.data.isActive,
        isSuperAdmin: roleResponse.data.isSuperAdmin
      }

      // 重置选中的资源列表，等待ResourceTree组件加载后自动获取
      selectedResources.value = roleResponse.data.resourceIds || []
    }
  } catch (err: any) {
    console.error('加载角色数据失败:', err)
    message.error(err.message || '加载角色数据失败')
  } finally {
    loading.value = false
  }
}

// 移除对store中currentRole的监听，改为在loadRoleData中直接设置

// 生命周期
onMounted(() => {
  loadRoleData()
  ;(async () => {
    const [res] = await getResourceTree()
    if (res?.data) resourceTree.value = res.data
  })()
})
</script>
