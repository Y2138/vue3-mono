<template>
  <div class="p-6 space-y-6">
    <div class="text-center py-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">欢迎回来，{{ userStore.userProfile?.username || '用户' }}！</h1>
      <p class="text-gray-600 dark:text-gray-300">今天是 {{ currentDate }}，祝您工作愉快！</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div class="text-3xl text-primary-500">
          <Icon icon="mdi:account-group" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-1">用户管理</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">管理系统用户和权限</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div class="text-3xl text-primary-500">
          <Icon icon="mdi:shield-account" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-1">角色权限</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">配置用户角色和权限</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div class="text-3xl text-primary-500">
          <Icon icon="mdi:cog" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-1">系统设置</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm">系统配置和参数管理</p>
        </div>
      </div>
    </div>

    <div class="max-w-2xl mx-auto">
      <n-card title="用户信息" class="shadow-md">
        <div class="space-y-3">
          <p class="flex items-center">
            <strong class="w-20 text-gray-700 dark:text-gray-300">手机号：</strong>
            {{ userStore.userProfile?.phone }}
          </p>
          <p class="flex items-center">
            <strong class="w-20 text-gray-700 dark:text-gray-300">用户名：</strong>
            {{ userStore.userProfile?.username }}
          </p>
          <p class="flex items-center">
            <strong class="w-20 text-gray-700 dark:text-gray-300">状态：</strong>
            <n-tag :type="userStore.userProfile?.isActive ? 'success' : 'error'">
              {{ userStore.userProfile?.isActive ? '已激活' : '未激活' }}
            </n-tag>
          </p>
          <p class="flex items-center">
            <strong class="w-20 text-gray-700 dark:text-gray-300">角色：</strong>
            <n-tag v-for="roleId in userStore.userRoles" :key="roleId" class="mr-2">
              {{ roleId }}
            </n-tag>
          </p>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/store/modules/user'

// ========================================
// 🔧 状态和数据
// ========================================

const userStore = useUserStore()

// 当前日期
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})
</script>
