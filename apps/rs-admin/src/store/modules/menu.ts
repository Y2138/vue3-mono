import { defineStore } from 'pinia'
import { routes } from '@/router'
import { transferRouteToMenu, flattenTreeWithPaths } from '@/utils'
import { IMenuItem } from '@/types/common'

const menuTree = transferRouteToMenu(routes)

export const useMenuStore = defineStore('menu', {
  state: () => ({
    activeMenuKey: '', // 当前路由路径
    menuTree,
    flatMenuList: flattenTreeWithPaths(menuTree),
    collapsed: false, // 菜单是否收起
  }),
	getters: {
    menuRoutes(): IMenuItem[] {
      const result: IMenuItem[] = []
      let curMenu = this.flatMenuList.find(item => item.path === this.activeMenuKey)
      if (curMenu) {
        result.push(curMenu)
        while(curMenu.parent) {
          result.unshift(curMenu.parent)
          curMenu = curMenu.parent
        }
      }
      return result
    }
  },
  actions: {
    setActiveMenuKey(activeMenuKey: string) {
      this.activeMenuKey = activeMenuKey
    },
    setMenuList(menuTree: any) {
      this.menuTree = menuTree
    },
    toggleCollapse() {
      this.collapsed = !this.collapsed
    }
  }
})