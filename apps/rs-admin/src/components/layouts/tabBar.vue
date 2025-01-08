<template>
  <n-space size="small">
    <n-tag
      v-for="item in tabs"
      :key="item.path"
      class="cursor-pointer"
      :type="item.path === tabStore.activeTabKey ? 'success' : ''"
      closable
      @click="handleTagClick(item)"
      :on-close="() => handleTabClose(item)">
      <span class="tabbar-span" :class="item.path === tabStore.activeTabKey ? 'active' : ''">
        {{ item.name }}
      </span>
    </n-tag>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTabStore } from '@/store/modules/tab'
import { useRouter } from 'vue-router'
import { ITabItem } from '@/types/common'

const tabStore = useTabStore() 
const router = useRouter()

const tabs = computed<ITabItem[]>(() => {
  return tabStore.tabList
})
const handleTabClose = (item: ITabItem) => {
  tabStore.removeTab(item, router)
}
const handleTagClick = (item: ITabItem) => {
  tabStore.activeTab(item.path, item.name)
  router.push(item.path)
}
</script>

<style scoped>
.n-tag :deep(.tabbar-span:hover) {
  color: var(--n-link-text-color-hover)
}
.n-tag .tabbar-span {
  color: var(--n-text-color)
}
</style>