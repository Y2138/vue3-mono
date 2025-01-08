<template>
  <n-menu
    v-model:value="menuStore.activeMenuKey"
    ref="menuRef"
    :options="menuOptions"
    key-field="path"
    :indent="24"
    :collapsed="collapsed"
    :collapsed-width="64"
    accordion>
  </n-menu>
</template>

<script setup lang="ts">
import { ref, h, computed, watch, type Component } from 'vue'
import type { MenuOption, MenuInst } from 'naive-ui'
import { NIcon } from 'naive-ui'
import { useMenuStore } from '@/store/modules/menu'
import { IMenuItem } from '@/types/common'
import { RouterLink } from 'vue-router'

const menuRef = ref<MenuInst | null>(null)
const menuStore = useMenuStore()
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}
// 定位到菜单项
function scrollTo(key: string) {
  menuRef.value?.showOption(key)
}

watch(() => menuStore.activeMenuKey, (val) => {
  console.log('2501===>', val)
  menuRef.value?.showOption(val)
})

const collapsed = computed(() => {
  return menuStore.collapsed
})

const transferMenu = (menuList?: IMenuItem[]): MenuOption[] | undefined => {
  if (!menuList) return
  return menuList.map(item => ({
    label: item.children ? item.name : () => h(
      RouterLink,
      { to: item.path },
      { default: () => item.name }
    ),
    path: item.path,
    icon: renderIcon(item.icon),
    children: transferMenu(item.children)
  }))
}
const menuOptions = computed(() => {
  return transferMenu(menuStore.menuList)
})


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

</style>