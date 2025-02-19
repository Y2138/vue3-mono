import { defineStore } from 'pinia'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    pageRefreshKey: 1, // 当前路由路径
    theme: 'light', // 主题
  }),
    getters: {},
  actions: {
    changeTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
    },
    refresh() {
      this.pageRefreshKey ++
    }
  }
})
