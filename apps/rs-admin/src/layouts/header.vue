<template>
  <div class="px-2 pt-4 pb-2 shadow-rs">
    <div class="flex-center mb-2">
      <div class="flex-1 w-0 flex-start">
        <n-icon class="cursor-pointer transition-transform" :class="menuStore.collapsed ? 'transform-rotate-180' : ''" :component="BackIcon" size="20" @click="handleToggleMenu"></n-icon>
        <n-breadcrumb class="ml-2">
          <n-breadcrumb-item v-for="item in menuRoutes" :key="item.path" @click="handleLinkClick(item)">
            {{ item.name }}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <n-space size="large" class="mr-5" align="center" item-class="flex">
        <n-icon :component="Search" size="20" class="cursor-pointer"></n-icon>
        <n-icon :component="SunIcon" size="20" class="cursor-pointer" @click="handleChangeTheme" title="切换主题"></n-icon>
        <n-icon :component="Refresh" size="20" class="cursor-pointer animate-keyframes-spin" @click="handleRefresh" title="刷新"></n-icon>
        <n-avatar
          class="ml-5"
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
import { computed } from 'vue'
import {
  ChevronBackCircleOutline as BackIcon,
  SunnySharp as SunIcon,
  Search, Refresh } from '@vicons/ionicons5'
import TabBar from './tabBar.vue';
import { useRouter } from 'vue-router';
import { useMenuStore } from '@/store/modules/menu';
import { useGlobalStore } from '@/store/modules/global';
import { usePageLoading } from '@/hooks/usePageLoading';

const router = useRouter()
const globalStore = useGlobalStore()
const { refresh } = usePageLoading()
const menuStore = useMenuStore()
const menuRoutes = computed(() => menuStore.menuRoutes)

// 跳转
const handleLinkClick = (item: IMenuItem) => {
  router.push(item.path)
}
const handleToggleMenu = () => {
  menuStore.toggleCollapse()
}
const handleRefresh = () => {
  refresh()
}
const handleChangeTheme = () => {
  globalStore.changeTheme()
}
</script>

<style scoped>

</style>
