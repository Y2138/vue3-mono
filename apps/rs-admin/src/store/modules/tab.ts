import { defineStore } from 'pinia'
import type { ITabItem } from '@/types/common'
import type { Router } from 'vue-router'

export const useTabStore = defineStore('tab', {
  state: () => ({
    tabList: <ITabItem[]>[],
    activeTabKey: '',
    pageRefreshKey: 1
  }),
  getters: {},
  actions: {
    // 开启tab
    activeTab(routePath: string, name: string) {
      const _fIndex = this.tabList.findIndex(item => item.path === routePath)
      if (_fIndex === -1) {
        this.tabList.push({
          path: routePath,
          name
        })
      }
      this.activeTabKey = routePath
    },
    removeTab(tab: ITabItem, router: Router) {
      const _fIndex = this.tabList.findIndex(item => item.path === tab.path)
      if (_fIndex !== -1) {
        if (tab.path === this.activeTabKey) {
          if (_fIndex === 0) {
            router.push(this.tabList.length > 1 ? this.tabList[1].path : '/')
          } else {
            router.push(this.tabList[_fIndex - 1].path)
          }
        }
        this.tabList.splice(_fIndex, 1)
      }
    },
    removeOtherTabs(tab: ITabItem) {
      this.tabList = this.tabList.filter(item => item.path === tab.path)
      this.activeTabKey = this.tabList[0].path
    },
    removeRightTabs(tab: ITabItem) {
      const _fIndex = this.tabList.findIndex(item => item.path === tab.path)
      if (_fIndex !== -1) {
        this.tabList.splice(_fIndex + 1)
      }
    },
    removeAllTabs(router: Router) {
      this.tabList = []
      router.push('/')
    },
    refresh() {
      this.pageRefreshKey ++
    }
  }
})