<template>
  <div class="role-assignment">
    <div class="role-selection">
      <n-form-item label="角色分配" :required="false">
        <n-select v-model:value="selectedRoleIds" :options="roleOptions" placeholder="请选择角色（可多选）" multiple filterable :loading="rolesLoading" :disabled="disabled" @update:value="handleRoleChange" />
      </n-form-item>
    </div>

    <!-- 预览权限按钮 -->
    <div v-if="selectedRoleIds.length > 0" class="preview-button-container">
      <n-button type="primary" :disabled="disabled || resourcesLoading" :loading="resourcesLoading" @click="previewPermissions"> 预览权限 </n-button>
    </div>

    <!-- 资源预览区域 -->
    <div v-if="showResourcePreview" class="resource-preview">
      <n-divider />
      <div class="preview-header">
        <h4 class="preview-title">资源预览</h4>
        <n-spin v-if="resourcesLoading" size="small" />
      </div>
      <div v-if="resourcesLoading" class="loading-container">
        <n-spin />
      </div>
      <div v-else-if="resourceTree.length > 0" class="tree-container">
        <ResourceTree :resources="resourceTree" :default-expanded-ids="[]" />
      </div>
      <n-empty v-else description="暂无资源权限" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NFormItem, NSelect, NDivider, NSpin, NEmpty, NButton, useMessage } from 'naive-ui'
import { getRoles, previewPermissionsByRoleIds } from '@/request/api/role'
import ResourceTree from '@/views/system/resources/components/resource-tree.vue'
import type { Role } from '@/shared/role'
import type { Resource } from '@/shared/resource'

interface Props {
  phone?: string
  initialRoleIds?: string[]
  disabled?: boolean
}

interface Emits {
  (e: 'update:roleIds', roleIds: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()

// 角色相关
const rolesLoading = ref(false)
const allRoles = ref<Role[]>([])
const selectedRoleIds = ref<string[]>([])

// 资源相关
const resourcesLoading = ref(false)
const resourceTree = ref<Resource[]>([])
const resourceList = ref<Resource[]>([])
const showResourcePreview = ref(false)

// 角色选项
const roleOptions = computed(() => {
  return allRoles.value.map((role) => ({
    label: role.name,
    value: role.id,
    disabled: !role.isActive
  }))
})

// 加载角色列表
const loadRoles = async () => {
  rolesLoading.value = true
  try {
    const [result, error] = await getRoles({})
    if (error) {
      message.error(`获取角色列表失败: ${error.message}`)
      return
    }
    if (result?.data) {
      allRoles.value = result.data
    }
  } catch (err: any) {
    message.error(`获取角色列表失败: ${err.message}`)
  } finally {
    rolesLoading.value = false
  }
}

// 预览权限
const previewPermissions = async () => {
  if (selectedRoleIds.value.length === 0) {
    message.warning('请先选择角色')
    return
  }

  resourcesLoading.value = true
  showResourcePreview.value = true
  try {
    const [result, error] = await previewPermissionsByRoleIds(selectedRoleIds.value)
    if (error) {
      message.error(`预览权限失败: ${error.message}`)
      showResourcePreview.value = false
      return
    }
    if (result?.data) {
      resourceTree.value = result.data.tree || []
      resourceList.value = result.data.list || []
    }
  } catch (err: any) {
    message.error(`预览权限失败: ${err.message}`)
    showResourcePreview.value = false
  } finally {
    resourcesLoading.value = false
  }
}

// 处理角色变化
const handleRoleChange = (roleIds: string[]) => {
  selectedRoleIds.value = roleIds
  emit('update:roleIds', roleIds)
  // 角色变化时隐藏资源预览
  showResourcePreview.value = false
  resourceTree.value = []
  resourceList.value = []
}

// 初始化角色ID
watch(
  () => props.initialRoleIds,
  (newIds) => {
    if (newIds && newIds.length > 0) {
      selectedRoleIds.value = [...newIds]
      emit('update:roleIds', selectedRoleIds.value)
    }
  },
  { immediate: true }
)

onMounted(() => {
  loadRoles()
  if (props.initialRoleIds && props.initialRoleIds.length > 0) {
    selectedRoleIds.value = [...props.initialRoleIds]
  }
})
</script>

<style scoped>
.role-assignment {
  width: 100%;
}

.role-selection {
  margin-bottom: 16px;
}

.preview-button-container {
  margin-bottom: 16px;
}

.resource-preview {
  margin-top: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.tree-container {
  max-height: 400px;
  overflow-y: auto;
}
</style>
