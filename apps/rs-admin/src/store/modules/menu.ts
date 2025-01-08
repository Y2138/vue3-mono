import { defineStore } from 'pinia'
import { routes } from '@/router'
import { transferRouteToMenu } from '@/utils'

const menuList = transferRouteToMenu(routes)

export const useMenuStore = defineStore('menu', {
  state: () => ({
    activeMenuKey: '', // 当前路由路径
    menuList,
    collapsed: false, // 菜单是否收起
  }),
	getters: {},
  actions: {
    setActiveMenuKey(activeMenuKey: string) {
      this.activeMenuKey = activeMenuKey
    },
    setMenuList(menuList: any) {
      this.menuList = menuList
    },
    toggleCollapse() {
      this.collapsed = !this.collapsed
    }
  }
})