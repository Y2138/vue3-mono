<template>
  <n-flex size="small">
    <n-tag
      v-for="item in tabs"
      :key="item.path"
      class="cursor-pointer"
      :type="item.path === tabStore.activeTabKey ? 'success' : ''"
      closable
      @click="handleTagClick(item)"
      @contextmenu.prevent="handleContextMenu(item, $event)"
      :on-close="() => handleTabClose(item)">
      <span class="tabbar-span" :class="item.path === tabStore.activeTabKey ? 'active' : ''">
        {{ item.name }}
      </span>
    </n-tag>
  </n-flex>
</template>

<script setup lang="ts">
import { ref, computed, h, type Component } from 'vue'
import { useTabStore } from '@/store/modules/tab'
import { useGlobalStore } from '@/store/modules/global'
import { useRouter } from 'vue-router'
import { ITabItem } from '@/types/common'
import ContextMenu from '@imengyu/vue3-context-menu'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import { Refresh } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const tabStore = useTabStore()
const globalStore = useGlobalStore()
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
function renderIcon(icon: Component) {
  return h(NIcon, { size: 16 }, { default: () => h(icon) })
}
const handleContextMenu = (item: ITabItem, e: MouseEvent) => {
  const { x, y } = e
  ContextMenu.showContextMenu({
    x,
    y,
    items: [
      {
        icon: renderIcon(Refresh),
        label: '刷新',
        onClick: () => {
          globalStore.refresh()
        },
        divided: true
      },
      {
        label: '关闭当前',
        onClick: () => handleTabClose(item)
      },
      {
        label: '关闭其他',
        onClick: () => tabStore.removeOtherTabs(item)
      },
      {
        label: '关闭全部',
        onClick: () => tabStore.removeAllTabs(router)
      },
      {
        label: '关闭右侧',
        onClick: () => tabStore.removeRightTabs(item)
      }
    ]
  })
}
</script>

<style scoped>
.n-tag :deep(.tabbar-span:hover) {
  color: var(--n-link-text-color-hover)
}
:deep(.mx-context-menu-item) {
  cursor: pointer;
}
.n-tag .tabbar-span {
  color: var(--n-text-color)
}
</style>