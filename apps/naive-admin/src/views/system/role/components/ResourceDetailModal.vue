<template>
  <n-modal :show="show" @update:show="(val) => (show = val)" preset="dialog" :title="modalTitle" :positive-text="confirmText" :negative-text="'取消'" @positive-click="handleConfirm" @negative-click="handleCancel" :mask-closable="false" style="width: 800px">
    <div class="max-h-[600px] overflow-y-auto">
      <!-- 资源信息 -->
      <div class="mb-4">
        <n-card title="资源信息" size="small">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-2">
              <label class="font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">资源名称：</label>
              <span class="text-gray-900 dark:text-gray-100">{{ resource?.name || '未知' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">资源类型：</label>
              <ResourceTypeTag :type="resource?.type" />
            </div>
            <div class="flex items-center gap-2" v-if="resource?.description">
              <label class="font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">描述：</label>
              <span class="text-gray-900 dark:text-gray-100">{{ resource.description }}</span>
            </div>
            <div class="flex items-center gap-2" v-if="resource?.path">
              <label class="font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">路径：</label>
              <n-text code>{{ resource.path }}</n-text>
            </div>
            <div class="flex items-center gap-2" v-if="resource?.method">
              <label class="font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">方法：</label>
              <n-tag size="small" :type="getMethodTagType(resource.method)">
                {{ resource.method }}
              </n-tag>
            </div>
          </div>
        </n-card>
      </div>

      <!-- 资源权限分配 -->
      <div class="mb-4">
        <n-card title="资源权限分配" size="small">
          <div>
            <n-checkbox-group v-model:value="selectedPermissions">
              <div class="grid grid-cols-2 gap-4">
                <div v-for="permission in availablePermissions" :key="permission.value" class="w-full">
                  <n-checkbox :value="permission.value" :disabled="loading">
                    <div class="flex justify-between items-center w-full">
                      <div class="flex-1">
                        <div class="font-medium text-gray-900 dark:text-gray-100 mb-1">{{ permission.label }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ permission.description }}</div>
                      </div>
                      <Icon :icon="permission.icon" width="20" height="20" />
                    </div>
                  </n-checkbox>
                </div>
              </div>
            </n-checkbox-group>
          </div>

          <!-- 自定义资源权限 -->
          <div v-if="showCustomPermissions" class="mt-6">
            <n-divider title-placement="left">
              <span class="text-sm font-medium">自定义资源权限</span>
            </n-divider>

            <div class="mt-4">
              <n-form :model="customPermission" label-width="100">
                <n-form-item label="权限代码">
                  <n-input v-model:value="customPermission.code" placeholder="请输入权限代码" :disabled="loading" />
                </n-form-item>
                <n-form-item label="权限名称">
                  <n-input v-model:value="customPermission.name" placeholder="请输入权限名称" :disabled="loading" />
                </n-form-item>
                <n-form-item label="权限描述">
                  <n-input v-model:value="customPermission.description" type="textarea" placeholder="请输入权限描述" :disabled="loading" :rows="2" />
                </n-form-item>
                <n-form-item>
                  <n-button size="small" @click="addCustomPermission" :disabled="loading || !customPermission.code || !customPermission.name"> 添加权限 </n-button>
                </n-form-item>
              </n-form>
            </div>

            <!-- 自定义资源权限列表 -->
            <div v-if="customPermissions.length > 0" class="mt-4">
              <div v-for="(permission, index) in customPermissions" :key="index" class="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md mb-2">
                <div class="flex-1">
                  <code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs inline-block mr-2">{{ permission.code }}</code>
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{ permission.name }}</span>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ permission.description }}</div>
                </div>
                <n-button size="tiny" type="error" @click="removeCustomPermission(index)" :disabled="loading"> 移除 </n-button>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- 资源权限继承 -->
      <div>
        <n-card title="资源权限继承" size="small">
          <div>
            <n-alert title="继承说明" type="info" :show-icon="false"> 当前角色的资源权限会继承自其父角色的资源权限设置 </n-alert>

            <div v-if="parentRoles.length > 0" class="mt-2">
              <div class="font-medium text-gray-900 dark:text-gray-100 mb-2">父角色：</div>
              <div class="flex flex-wrap gap-2">
                <n-tag v-for="role in parentRoles" :key="role.id" size="small" type="primary">
                  {{ role.name }}
                </n-tag>
              </div>
            </div>

            <div v-else class="mt-2">
              <n-text depth="3">当前角色没有父角色资源权限继承</n-text>
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage, NModal, NCheckboxGroup, NForm, NFormItem, NText } from 'naive-ui'
import { Icon } from '@iconify/vue'
import ResourceTypeTag from '../../components/ResourceTypeTag.vue'

// Props
interface Props {
  show: boolean
  resource?: any
  roleId?: string
}

const props = withDefaults(defineProps<Props>(), {
  roleId: ''
})

// Emits
interface Emits {
  (e: 'update:show', show: boolean): void
  (e: 'confirm', permissions: string[]): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const selectedPermissions = ref<string[]>([])
const customPermission = ref({
  code: '',
  name: '',
  description: ''
})
const customPermissions = ref<any[]>([])
const parentRoles = ref<any[]>([])

// 移除未使用的store依赖
const message = useMessage()

// 计算属性
const modalTitle = computed(() => `资源权限分配 - ${props.resource?.name || '未知资源'}`)

const confirmText = computed(() => (selectedPermissions.value.length > 0 || customPermissions.value.length > 0 ? `确认分配 (${getTotalPermissionCount()})` : '确认'))

const showCustomPermissions = computed(() => props.resource?.type === 2 || props.resource?.type === 3)

const availablePermissions = computed(() => {
  const permissionsMap: Record<number, any[]> = {
    1: [
      {
        value: 'view',
        label: '查看',
        description: '允许查看该菜单项',
        icon: 'mdi:eye'
      },
      {
        value: 'navigate',
        label: '导航',
        description: '允许导航到该菜单',
        icon: 'mdi:arrow-right'
      }
    ],
    2: [
      {
        value: 'read',
        label: '读取',
        description: '允许 GET/HEAD 请求',
        icon: 'mdi:eye'
      },
      {
        value: 'create',
        label: '创建',
        description: '允许 POST 请求',
        icon: 'mdi:plus'
      },
      {
        value: 'update',
        label: '更新',
        description: '允许 PUT/PATCH 请求',
        icon: 'mdi:pencil'
      },
      {
        value: 'delete',
        label: '删除',
        description: '允许 DELETE 请求',
        icon: 'mdi:delete'
      }
    ],
    3: [
      {
        value: 'view',
        label: '查看',
        description: '允许查看页面内容',
        icon: 'mdi:eye'
      },
      {
        value: 'edit',
        label: '编辑',
        description: '允许编辑页面内容',
        icon: 'mdi:pencil'
      }
    ],
    4: [
      {
        value: 'view',
        label: '查看',
        description: '允许查看模块内容',
        icon: 'mdi:eye'
      },
      {
        value: 'configure',
        label: '配置',
        description: '允许配置模块',
        icon: 'mdi:cog'
      }
    ]
  }

  const type = props.resource?.type || 3
  return permissionsMap[type] || permissionsMap[3]
})

const getTotalPermissionCount = computed(() => selectedPermissions.value.length + customPermissions.value.length)

// 工具函数
const getMethodTagType = (method?: string) => {
  const methodTypeMap: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    GET: 'success',
    POST: 'info',
    PUT: 'warning',
    PATCH: 'warning',
    DELETE: 'error'
  }
  return methodTypeMap[method || 'GET']
}

// 事件处理
const addCustomPermission = () => {
  if (!customPermission.value.code || !customPermission.value.name) {
    message.error('请填写完整的权限信息')
    return
  }

  customPermissions.value.push({
    ...customPermission.value
  })

  // 清空表单
  customPermission.value = {
    code: '',
    name: '',
    description: ''
  }

  message.success('自定义权限添加成功')
}

const removeCustomPermission = (index: number) => {
  customPermissions.value.splice(index, 1)
}

const handleConfirm = () => {
  const allPermissions = [...selectedPermissions.value, ...customPermissions.value.map((p) => p.code)]

  if (allPermissions.length === 0) {
    message.warning('请至少选择一种权限')
    return
  }

  emit('confirm', allPermissions)
}

const handleCancel = () => {
  emit('update:show', false)
}

// 加载角色继承信息
const loadRoleInheritance = async () => {
  if (!props.roleId) return

  try {
    // 这里应该从后端获取角色的父角色信息
    // 暂时使用模拟数据
    parentRoles.value = []
  } catch (error) {
    console.error('加载角色继承信息失败:', error)
  }
}

// 监听模态框显示状态
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      // 模态框显示时加载数据
      loadRoleInheritance()

      // 重置状态
      selectedPermissions.value = []
      customPermissions.value = []
      customPermission.value = {
        code: '',
        name: '',
        description: ''
      }
    }
  }
)
</script>

<!-- 样式已迁移到Tailwind CSS类 -->
