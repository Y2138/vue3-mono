import { RouteRecordRaw } from 'vue-router'
import type { IMenuItem } from '@/types/common'
import {
  Menu as MenuIcon
} from '@vicons/ionicons5'

export function transferRouteToMenu(routes: RouteRecordRaw[], parent?: IMenuItem): IMenuItem[] {
  return routes.map(route => {
    const menuItem: IMenuItem = {
      path: (parent?.path || '') + (route.path.includes('/') ? route.path : `/${route.path}`),
      name: String(route.meta?.title || route.name),
      icon: route.meta?.icon || MenuIcon,
      parent: parent ?? null,
    }
    if (route.children) {
      menuItem.children = transferRouteToMenu(route.children, menuItem)
    }
    return menuItem
  })
}