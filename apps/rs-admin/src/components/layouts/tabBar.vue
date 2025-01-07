<template>
  <n-tabs
    type="card"
    tab-class="max-w-lg"
    closable
    @update:value="handleUpdateValue">
    <n-tab v-for="item in tabs" :name="item.text" :key="item.path"></n-tab>
  </n-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const tabs = ref([
  {
    text: '首页',
    path: '/',
    icon: 'home'
  },
  {
    text: '系统管理',
    path: '/home',
    icon: 'home'
  },
  {
    text: '菜单管理',
    path: '/test',
    icon: 'home'
  }
])
const handleUpdateValue = () => {
  
}
</script>

<style scoped>

</style>