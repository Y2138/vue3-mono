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
  <n-menu :v-model:value="menuStore.activeMenuKey" ref="menuRef" :options="menuOptions" :width="240" :indent="20" :root-indent="16" :collapsed="collapsed" :collapsed-width="64" accordion> </n-menu>
</template>

<script setup lang="ts">
import { useMenuStore } from '@/store/modules/menu'
import { Icon } from '@iconify/vue'
import type { MenuInst, MenuOption } from 'naive-ui'
import { computed, h, ref, watch } from 'vue'
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

watch(
  () => menuStore.activeMenuKey,
  (val) => {
    console.log('2501===>', val)
    menuRef.value?.showOption(val)
  }
)

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
        key: `m_${item.path}`,
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

const router = useRouter()
const goToMain = () => {
  router.push('/')
}

// const menuOptions = ref<MenuOption[]>([
//   {
//     label: '且听风吟',
//     key: 'hear-the-wind-sing',
//     icon: renderIcon(BookIcon)
//   },
//   {
//     label: '1973年的弹珠玩具',
//     key: 'pinball-1973',
//     icon: renderIcon(BookIcon),
//     disabled: true,
//     children: [
//       {
//         label: '鼠',
//         key: 'rat'
//       }
//     ]
//   },
//   {
//     label: '寻羊冒险记',
//     key: 'a-wild-sheep-chase',
//     disabled: true,
//     icon: renderIcon(BookIcon)
//   },
//   {
//     label: '舞，舞，舞',
//     key: 'dance-dance-dance',
//     icon: renderIcon(BookIcon),
//     children: [
//       {
//         type: 'group',
//         label: '人物',
//         key: 'people',
//         children: [
//           {
//             label: '叙事者',
//             key: 'narrator',
//             icon: renderIcon(PersonIcon)
//           },
//           {
//             label: '羊男',
//             key: 'sheep-man',
//             icon: renderIcon(PersonIcon)
//           }
//         ]
//       },
//       {
//         label: '饮品',
//         key: 'beverage',
//         icon: renderIcon(WineIcon),
//         children: [
//           {
//             label: '威士忌',
//             key: 'whisky'
//           }
//         ]
//       },
//       {
//         label: '食物',
//         key: 'food',
//         children: [
//           {
//             label: '三明治',
//             key: 'sandwich'
//           }
//         ]
//       },
//       {
//         label: '过去增多，未来减少',
//         key: 'the-past-increases-the-future-recedes'
//       }
//     ]
//   },
//   {
//     label: '寻羊冒险记2',
//     key: 'a-wild-sheep-chase2',
//     disabled: true,
//     icon: renderIcon(BookIcon)
//   },
//   {
//     label: '舞，舞，舞2',
//     key: 'dance-dance-dance2',
//     icon: renderIcon(BookIcon),
//     children: [
//       {
//         type: 'group',
//         label: '人物2',
//         key: 'people2',
//         children: [
//           {
//             label: '叙事者2',
//             key: 'narrator2',
//             icon: renderIcon(PersonIcon)
//           },
//           {
//             label: '羊男2',
//             key: 'sheep-man2',
//             icon: renderIcon(PersonIcon)
//           }
//         ]
//       },
//       {
//         label: '饮品2',
//         key: 'beverage2',
//         icon: renderIcon(WineIcon),
//         children: [
//           {
//             label: '威士忌2',
//             key: 'whisky2'
//           }
//         ]
//       },
//       {
//         label: '食物2',
//         key: 'food2',
//         children: [
//           {
//             label: '三明治2',
//             key: 'sandwich2'
//           }
//         ]
//       },
//       {
//         label: '过去增多，未来减少2',
//         key: 'the-past-increases-the-future-recedes2'
//       }
//     ]
//   }
// ])
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
