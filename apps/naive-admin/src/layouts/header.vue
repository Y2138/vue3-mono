<template>
  <div class="px-2 pt-4 pb-2 shadow-rs">
    <div class="flex-center mb-2">
      <div class="flex-1 w-0 flex-start">
        <Icon class="cursor-pointer" :class="menuStore.collapsed ? 'transform-rotate-180' : ''" icon="ion:chevron-back-circle-outline" width="20" height="20" @click="handleToggleMenu"></Icon>
        <n-breadcrumb class="ml-2">
          <n-breadcrumb-item v-for="item in menuRoutes" :key="item.path" @click="handleLinkClick(item)">
            {{ item.name }}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <n-space size="large" class="mr-5" align="center" item-class="flex">
        <Icon icon="ion:search" width="20" height="20" class="cursor-pointer"></Icon>
        <Icon icon="ion:sunny-sharp" width="20" height="20" class="cursor-pointer" @click="handleChangeTheme" title="切换主题"></Icon>
        <Icon icon="ion:refresh" width="20" height="20" class="cursor-pointer animate-keyframes-spin" @click="handleRefresh" title="刷新"></Icon>
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
import { Icon } from '@iconify/vue'
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
