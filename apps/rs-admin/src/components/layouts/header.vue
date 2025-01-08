<template>
  <div class="px-2 pt-4 pb-2 shadow-rs">
    <div class="flex-center mb-2">
      <div class="flex-1 w-0 flex-start">
        <n-icon class="cursor-pointer" :component="Menu" size="20" @click="handleToggleMenu"></n-icon>
        <n-breadcrumb class="ml-2">
          <n-breadcrumb-item v-for="item in menuRoutes" :key="item.path" @click="handleLinkClick(item)">
            {{ item.text }}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <n-space class="mr6" align="center" item-class="flex">
        <n-icon :component="Search" size="20"></n-icon>
        <n-icon :component="Refresh" size="20"></n-icon>
        <n-avatar
          round
          size="small"
          src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
        />
      </n-space>
    </div>
    <TabBar></TabBar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Menu, Search, Refresh } from '@vicons/ionicons5'
import TabBar from './tabBar.vue';
import { useRouter } from 'vue-router';
import { useMenuStore } from '@/store/modules/menu';

const router = useRouter();
const menuRoutes = ref([
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
// 跳转
const handleLinkClick = (item) => {
  router.push(item.path)
}
const handleToggleMenu = () => {
  const menuStore = useMenuStore()
  menuStore.toggleCollapse()
}
</script>

<style scoped>

</style>