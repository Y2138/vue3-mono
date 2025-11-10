import { defineStore } from 'pinia'
import { routes } from '@/router'
import { transferRouteToMenuTree, flattenAllRouteToMenu } from '@/utils'

const allMenuList = flattenAllRouteToMenu(routes)
const menuTree = transferRouteToMenuTree(routes)

export const useMenuStore = defineStore('menu', {
  state: () => ({
    activeMenuKey: '', // 当前路由路径
    menuTree,
    flatAllMenuList: allMenuList,
    collapsed: false // 菜单是否收起
  }),
  getters: {
    menuRoutes(): IMenuItem[] {
      const result: IMenuItem[] = []
      let curMenu = this.flatAllMenuList.find((item) => item.path === this.activeMenuKey)
      if (curMenu) {
        result.push(curMenu)
        while (curMenu.parent) {
          result.unshift(curMenu.parent)
          curMenu = curMenu.parent
        }
      }
      return result
    }
  },
  actions: {
    // 优先设置 activeMenuPath，否则设置当前路径
    setActiveMenuKey(path: string) {
      const curMenu = this.flatAllMenuList.find((item) => item.path === path)
      console.log(
        'setActiveMenuKey',
        path,
        this.flatAllMenuList.map((item) => item.path),
        curMenu
      )
      if (curMenu) {
        this.activeMenuKey = curMenu.activeMenuPath || path
      } else {
        this.activeMenuKey = path
      }
    },
    setMenuList(menuTree: any) {
      this.menuTree = menuTree
    },
    toggleCollapse() {
      this.collapsed = !this.collapsed
    }
  }
})
