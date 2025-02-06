import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    pageRefreshKey: 1, // 当前路由路径
    refreshStatus: false,
    refreshFrom: '',
    theme: 'light', // 主题
  }),
	getters: {},
  actions: {
    changeTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
    },
    refresh() {
      this.setRefreshStatus(true)
      this.pageRefreshKey ++
    },
    setRefreshStatus(value: boolean, from?: string) {
      console.log('2501 refreshStatus===>', value)
      if (from) {
        from && console.log('from==>', from)
        this.refreshFrom = from
      } else {
        const route = useRoute()
        this.refreshFrom = route ? route.fullPath : 'unknown'
      }
      this.refreshStatus = value
    }
  }
})
