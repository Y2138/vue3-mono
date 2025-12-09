<template>
  <RoleForm />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RoleForm from './components/RoleForm.vue'

// 路由
const router = useRouter()
const route = useRoute()

// 页面设置
onMounted(() => {
  const roleId = route.query.id as string
  if (!roleId) {
    router.push('/system-manage/role')
    return
  }

  // 设置页面标题
  document.title = `编辑角色 - ${roleId} - 系统管理`
})
</script>
