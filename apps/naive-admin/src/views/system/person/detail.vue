<template>
  <n-card title="用户详情">
    <template #header-extra>
      <n-button @click="handleBack">返回</n-button>
    </template>

    <n-descriptions :column="2" bordered label-placement="left">
      <n-descriptions-item label="手机号">
        {{ userInfo?.phone }}
      </n-descriptions-item>
      <n-descriptions-item label="用户名">
        {{ userInfo?.username }}
      </n-descriptions-item>
      <n-descriptions-item label="状态">
        <n-tag :type="getStatusType(userInfo?.status)">
          {{ getStatusText(userInfo?.status) }}
        </n-tag>
      </n-descriptions-item>
      <n-descriptions-item label="创建时间">
        {{ userInfo?.createdAt }}
      </n-descriptions-item>
      <n-descriptions-item label="更新时间">
        {{ userInfo?.updatedAt }}
      </n-descriptions-item>
      <n-descriptions-item label="角色">
        <div v-if="userInfo?.roleIds && userInfo.roleIds.length > 0">
          <n-tag v-for="roleId in userInfo.roleIds" :key="roleId" type="info" size="small" class="mr-1">
            {{ roleId }}
          </n-tag>
        </div>
        <span v-else>无角色</span>
      </n-descriptions-item>
    </n-descriptions>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NDescriptions, NDescriptionsItem, NTag, useMessage } from 'naive-ui'
import { getUserByPhone, type UserInfo } from '@/request/api/users'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const userInfo = ref<UserInfo | null>(null)
const loading = ref(false)

// 获取用户信息
const fetchUserInfo = async () => {
  const phone = route.query.phone as string
  if (!phone) {
    message.error('缺少用户手机号参数')
    return
  }

  loading.value = true
  try {
    const [result, error] = await getUserByPhone(phone)
    if (error) {
      message.error(`获取用户信息失败: ${error.message}`)
      return
    }

    if (result?.data) {
      userInfo.value = result.data
    } else {
      message.error('用户信息不存在')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 返回上一页
const handleBack = () => {
  router.back()
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

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.n-descriptions {
  margin-top: 16px;
}
</style>
