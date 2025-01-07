import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menuList: []
  }),
	getters: {},
  actions: {
    setMenuList(menuList: any) {
      this.menuList = menuList
    }
  }
})