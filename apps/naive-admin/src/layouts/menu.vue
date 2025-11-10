<template>
  <div class="py-5 text-6 font-600 flex-center">
    <Icon icon="ion:menu" width="24" height="24" class="cursor-pointer" @click="goToMain" />
    <!-- <span v-if="!collapsed" class="whitespace-nowrap overflow-hidden"> </span> -->
    <AnimatePresence>
      <Motion
        v-show="!collapsed"
        class="whitespace-nowrap overflow-hidden ml-4"
        :initial="{
          opacity: 0,
          scale: 0
        }"
        :animate="{
          opacity: 1,
          scale: 1
        }"
        :exit="{
          opacity: 0,
          scale: 0
        }"
        :transition="{
          duration: 0.1,
          ease: 'easeInOut'
        }"
      >
        Naive-Admin
      </Motion>
    </AnimatePresence>
  </div>
  <n-menu v-model:value="menuStore.activeMenuKey" ref="menuRef" :options="menuOptions" :width="240" :indent="20" :root-indent="16" :collapsed="collapsed" :collapsed-width="64" accordion> </n-menu>
</template>

<script setup lang="ts">
import { useMenuStore } from '@/store/modules/menu'
import { Icon } from '@iconify/vue'
import type { MenuInst, MenuOption } from 'naive-ui'
import { computed, h, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { AnimatePresence, Motion } from 'motion-v'

interface IMenuItem {
  name: string
  path: string
  icon?: string
  children?: IMenuItem[]
  parent?: IMenuItem | null
}

const menuRef = ref<MenuInst | null>(null)
const menuStore = useMenuStore()

const collapsed = computed(() => {
  return menuStore.collapsed
})

function renderIcon(icon: string) {
  return () => h(Icon, { icon, width: '16', height: '16' })
}

const menuOptions = ref<MenuOption[]>([])
function transferMenu(menuList?: IMenuItem[]): MenuOption[] {
  if (!menuList) return []
  return menuList
    .filter((item) => item.path !== '/')
    .map((item) => {
      return {
        label: item.children ? item.name : () => h(RouterLink, { to: item.path }, { default: () => item.name }),
        key: item.path, // 直接使用路径作为key，与activeMenuKey保持一致
        icon: item.icon ? renderIcon(item.icon) : undefined,
        children: item.children ? transferMenu(item.children) : undefined
      } as MenuOption
    })
}

watch(
  () => menuStore.menuTree,
  (val: any) => {
    menuOptions.value = transferMenu(val)
  },
  {
    immediate: true
  }
)
watch(
  () => menuStore.activeMenuKey,
  (val) => {
    menuRef.value?.showOption(val)
  }
)

const router = useRouter()
const goToMain = () => {
  router.push('/')
}
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: width 0.3s ease-in;
}
.collapse-enter-from,
.collapse-leave-to {
  width: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  width: 100px;
}
</style>
