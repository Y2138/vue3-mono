<template>
  <n-flex size="small">
    <n-tag v-for="item in tabs" :key="item.fullPath" class="cursor-pointer" :type="item.fullPath === tabStore.activeTabKey ? 'info' : 'default'" :bordered="false" closable @click="handleTagClick(item)" @contextmenu.prevent="handleContextMenu(item, $event)" :on-close="() => handleTabClose(item)">
      <span class="tabbar-span" :class="item.fullPath === tabStore.activeTabKey ? 'active' : ''">
        {{ item.name }}
      </span>
    </n-tag>
  </n-flex>
  <n-dropdown placement="bottom-start" trigger="manual" :show="contextMenu.show" :x="contextMenu.x" :y="contextMenu.y" :options="contextMenu.options" :on-clickoutside="() => (contextMenu.show = false)" @select="handleSelect"> </n-dropdown>
</template>

<script setup lang="tsx">
import { computed, h, type Component, ref, nextTick } from 'vue'
import { useTabStore } from '@/store/modules/tab'
import { useGlobalStore } from '@/store/modules/global'
import { useMenuStore } from '@/store/modules/menu'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const tabStore = useTabStore()
const globalStore = useGlobalStore()
const menuStore = useMenuStore()
const router = useRouter()

const tabs = computed<ITabItem[]>(() => {
  return tabStore.tabList
})
const handleTabClose = (item: ITabItem) => {
  tabStore.removeTab(item, router)
}
const handleTagClick = (item: ITabItem) => {
  tabStore.activeTab(item.fullPath, item.name)
  router.push(item.fullPath)
  // 更新菜单激活状态
  // menuStore.setActiveMenuKey(item.fullPath)
}
function renderIcon(icon: string) {
  return () => h(Icon, { icon: `ion:${icon}`, width: '16', height: '16' })
}
const handleSelect = (key: string) => {
  console.log(key)
  contextMenu.value.show = false
  const { item } = contextMenu.value

  switch (key) {
    case 'refresh':
      globalStore.refresh()
      break
    case 'close':
      handleTabClose(item)
      break
    case 'closeOther':
      tabStore.removeOtherTabs(item)
      break
    case 'closeAll':
      tabStore.removeAllTabs(router)
      break
    case 'closeRight':
      tabStore.removeRightTabs(item)
      break
  }
}
const contextMenu = ref<{
  x: number
  y: number
  options: any[]
  show: boolean
  item: ITabItem
}>({
  x: 0,
  y: 0,
  options: [],
  show: false,
  item: { path: '', name: '' }
})
const handleContextMenu = (item: ITabItem, e: MouseEvent) => {
  const { x, y } = e
  nextTick().then(() => {
    contextMenu.value.x = x
    contextMenu.value.y = y
    contextMenu.value.show = true
    contextMenu.value.item = item
  })
  contextMenu.value.options = [
    {
      key: 'refresh',
      label: '刷新',
      icon: renderIcon('refresh')
    },
    {
      type: 'divider',
      key: 'd1'
    },
    {
      label: '关闭当前',
      key: 'close'
    },
    {
      label: '关闭其他',
      key: 'closeOther'
    },
    {
      label: '关闭全部',
      key: 'closeAll'
    },
    {
      label: '关闭右侧',
      key: 'closeRight'
    }
  ]
}
</script>

<style scoped>
.n-tag :deep(.tabbar-span:hover) {
  color: var(--n-link-text-color-hover);
}
:deep(.mx-context-menu-item) {
  cursor: pointer;
}
.n-tag .tabbar-span {
  color: var(--n-text-color);
}
</style>
