<template>
  <n-modal :show="show" preset="dialog" title="分配用户" :positive-text="'确认分配'" :negative-text="'取消'" @positive-click="handleConfirm" @negative-click="handleCancel" :mask-closable="false" style="width: 800px">
    <div class="user-assign-modal">
      <!-- 角色信息 -->
      <div class="role-info" v-if="role">
        <n-card size="small" title="角色信息">
          <div class="info-grid">
            <div class="info-item">
              <label>角色名称：</label>
              <span>{{ role.name }}</span>
            </div>
            <div class="info-item">
              <label>角色类型：</label>
              <n-tag size="small" :type="role.isSuperAdmin ? 'warning' : 'primary'">
                {{ role.isSuperAdmin ? '超级管理员' : '普通角色' }}
              </n-tag>
            </div>
            <div class="info-item" v-if="role.description">
              <label>角色描述：</label>
              <span>{{ role.description }}</span>
            </div>
            <div class="info-item">
              <label>状态：</label>
              <n-tag size="small" :type="role.isActive ? 'success' : 'error'">
                {{ role.isActive ? '启用' : '禁用' }}
              </n-tag>
            </div>
          </div>
        </n-card>
      </div>

      <!-- 搜索区域 -->
      <div class="search-section">
        <div class="search-controls">
          <n-input-group>
            <n-input v-model:value="searchForm.username" placeholder="搜索用户名" style="width: 200px" clearable @input="handleSearch" />
            <n-input-group-label>
              <Icon icon="material-symbols:search" />
            </n-input-group-label>
          </n-input-group>
        </div>

        <div class="search-actions">
          <n-button-group>
            <n-button size="small" @click="handleSelectAll"> 全选 </n-button>
            <n-button size="small" @click="handleSelectNone"> 清空 </n-button>
          </n-button-group>
        </div>
      </div>

      <!-- 分配统计 -->
      <div class="assignment-stats">
        <n-alert type="info" :show-icon="false">
          <div class="stats-content">
            <div class="stat-item">
              <span class="stat-label">已分配用户：</span>
              <n-text strong>{{ assignedUsers.length }}</n-text>
            </div>
            <div class="stat-item">
              <span class="stat-label">可选用户：</span>
              <n-text strong>{{ availableUsers.length }}</n-text>
            </div>
            <div class="stat-item">
              <span class="stat-label">当前选择：</span>
              <n-text strong>{{ selectedUsers.length }}</n-text>
            </div>
          </div>
        </n-alert>
      </div>

      <!-- 用户列表 -->
      <div class="users-section">
        <div class="section-header">
          <div class="section-title">
            <Icon icon="material-symbols:group" />
            <span>可用用户列表</span>
          </div>
          <n-text depth="3" class="section-description"> 选择要分配给该角色的用户 </n-text>
        </div>

        <div class="users-list">
          <n-data-table :columns="columns" :data="filteredUsers" :loading="loading" :row-key="(row: UserInfo) => row.phone" @update:checked-row-keys="handleSelectionChange" checkable :checked-row-keys="selectedUsers" :max-height="400">
            <template #empty>
              <n-empty description="没有可分配的用户">
                <template #extra>
                  <n-button size="small" @click="handleRefresh"> 刷新列表 </n-button>
                </template>
              </n-empty>
            </template>
          </n-data-table>
        </div>
      </div>

      <!-- 批量操作 -->
      <div v-if="selectedUsers.length > 0" class="selected-preview">
        <n-card size="small">
          <div class="preview-header">
            <span class="preview-title">已选择的用户：</span>
            <n-button size="tiny" @click="selectedUsers = []"> 清空 </n-button>
          </div>
          <div class="selected-users">
            <n-tag v-for="user in selectedUsersData" :key="user.phone" size="small" closable @close="handleRemoveSelected(user.phone)">
              {{ user.username }}
            </n-tag>
          </div>
        </n-card>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { NModal, NDataTable, NTag, NText, NInputGroup, NInputGroupLabel, NEmpty } from 'naive-ui'
import { Icon } from '@iconify/vue'
import type { Role } from '@/shared/role'
import type { User as UserInfo } from '@/shared/users'
import { getUserList } from '@/request/api/users'

// Props
interface Props {
  show: boolean
  role: Role | null
  assignedUsers: UserInfo[]
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'update:show', show: boolean): void
  (e: 'confirm', users: UserInfo[]): void
}

const emit = defineEmits<Emits>()

// 移除store依赖，使用内部状态管理

// 响应式数据
const loading = ref(false)
const searchForm = ref({
  username: ''
})
const selectedUsers = ref<string[]>([])
const allUsers = ref<UserInfo[]>([]) // 内部状态存储所有用户

// 计算属性
const availableUsers = computed(() => {
  // 获取所有用户并排除已分配的用户
  const assignedPhones = props.assignedUsers.map((u) => u.phone)
  return allUsers.value.filter((user) => !assignedPhones.includes(user.phone))
})

const filteredUsers = computed(() => {
  let users = availableUsers.value

  // 按用户名过滤
  if (searchForm.value.username) {
    users = users.filter((user) => user.username.toLowerCase().includes(searchForm.value.username.toLowerCase()))
  }

  return users
})

const selectedUsersData = computed(() => {
  return availableUsers.value.filter((user) => selectedUsers.value.includes(user.phone))
})

// 表格列配置
const columns = computed(() => [
  {
    title: '用户名',
    key: 'username',
    render: (row: UserInfo) => {
      return h('div', { class: 'user-cell' }, [h('div', { class: 'username' }, row.username), h('div', { class: 'user-meta' }, row.phone)])
    }
  },
  {
    title: '状态',
    key: 'status',
    render: (row: UserInfo) => {
      const statusMap = {
        active: { text: '活跃', type: 'success' as const },
        inactive: { text: '非活跃', type: 'error' as const },
        locked: { text: '锁定', type: 'warning' as const }
      }
      const status = statusMap[row.status as keyof typeof statusMap] || { text: '未知', type: 'default' as const }

      return h(
        NTag,
        {
          type: status.type,
          size: 'small',
          round: true
        },
        { default: () => status.text }
      )
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    render: (row: UserInfo) => {
      return h('span', { class: 'date-text' }, new Date(row.createdAt).toLocaleString('zh-CN'))
    }
  }
])

// 事件处理
const handleSearch = () => {
  // 搜索时保持选择的用户
  // 清空当前选择以避免显示已不存在的用户
  selectedUsers.value = selectedUsers.value.filter((phone) => availableUsers.value.some((user) => user.phone === phone))
}

const handleSelectAll = () => {
  selectedUsers.value = filteredUsers.value.map((user) => user.phone)
}

const handleSelectNone = () => {
  selectedUsers.value = []
}

const handleSelectionChange = (keys: string[]) => {
  selectedUsers.value = keys
}

const handleRemoveSelected = (phone: string) => {
  const index = selectedUsers.value.indexOf(phone)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  }
}

const handleRefresh = () => {
  loadAvailableUsers()
}

const handleConfirm = () => {
  const selectedUserData = selectedUsersData.value
  if (selectedUserData.length === 0) {
    return window.$message?.warning('请至少选择一个用户')
  }

  emit('confirm', selectedUserData)
}

const handleCancel = () => {
  emit('update:show', false)
}

// 加载可用用户
const loadAvailableUsers = async () => {
  if (!props.role) return

  loading.value = true

  try {
    // 直接调用API获取用户列表
    const [response, err] = await getUserList({ page: 1, pageSize: 1000 }) // 使用大pageSize获取所有用户
    if (err) {
      throw new Error(err.message || '加载用户列表失败')
    }
    
    if (response?.list) {
      allUsers.value = response.list
    } else {
      allUsers.value = []
    }
  } catch (err: any) {
    console.error('加载可用用户失败:', err)
    window.$message?.error(err.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 监听角色变化
watch(
  () => props.role,
  (newRole) => {
    if (newRole) {
      loadAvailableUsers()
      // 清空选择
      selectedUsers.value = []
    }
  },
  { immediate: true }
)

// 监听搜索条件变化
watch(
  searchForm,
  () => {
    // 搜索变化时保持当前选择
    selectedUsers.value = selectedUsers.value.filter((phone) => availableUsers.value.some((user) => user.phone === phone))
  },
  { deep: true }
)
</script>

<!-- 样式已迁移到Tailwind CSS类 -->
