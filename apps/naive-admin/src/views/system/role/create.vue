<template>
  <RoleForm />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import RoleForm from './components/RoleForm.vue'

// 路由
const router = useRouter()

// 页面设置
onMounted(() => {
  // 设置页面标题
  document.title = '创建角色 - 系统管理'
})
</script>
