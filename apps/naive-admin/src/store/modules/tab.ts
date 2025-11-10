import { defineStore } from 'pinia'
import type { Router } from 'vue-router'

export const useTabStore = defineStore('tab', {
  state: () => ({
    tabList: <ITabItem[]>[],
    activeTabKey: ''
  }),
  getters: {},
  actions: {
    // 开启tab
    activeTab(routeFullPath: string, name: string) {
      // 如果已经是当前激活的标签，不需要做任何操作
      if (this.activeTabKey === routeFullPath) {
        return
      }

      const _fIndex = this.tabList.findIndex((item) => item.fullPath === routeFullPath)
      if (_fIndex === -1) {
        this.tabList.push({
          fullPath: routeFullPath,
          name
        })
      }
      this.activeTabKey = routeFullPath
    },
    removeTab(tab: ITabItem, router: Router) {
      const _fIndex = this.tabList.findIndex((item) => item.fullPath === tab.fullPath)
      if (_fIndex !== -1) {
        if (tab.fullPath === this.activeTabKey) {
          if (_fIndex === 0) {
            router.push(this.tabList.length > 1 ? this.tabList[1].fullPath : '/')
          } else {
            router.push(this.tabList[_fIndex - 1].fullPath)
          }
        }
        this.tabList.splice(_fIndex, 1)
      }
    },
    removeOtherTabs(tab: ITabItem) {
      this.tabList = this.tabList.filter((item) => item.fullPath === tab.fullPath)
      this.activeTabKey = this.tabList[0].fullPath
    },
    removeRightTabs(tab: ITabItem) {
      const _fIndex = this.tabList.findIndex((item) => item.fullPath === tab.fullPath)
      if (_fIndex !== -1) {
        this.tabList.splice(_fIndex + 1)
      }
    },
    removeAllTabs(router: Router) {
      this.tabList = []
      router.push('/')
    }
  }
})
