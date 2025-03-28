import { defineStore } from 'pinia'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    pageRefreshKey: 1, // 当前router-view的key
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
