/**
 * 转换路由为菜单树，排除 meta.activeMenuPath 有值的路由
 * @param routes 路由配置数组
 * @param parent 父菜单项，默认值为 null
 * @returns 菜单树数组
 */
export function transferRouteToMenuTree(routes: CustomRouteRecord[], parent?: IMenuItem): IMenuItem[] {
  return routes
    .map((route) => {
      if (route.meta?.activeMenuPath) {
        return null
      }
      const menuItem: IMenuItem = {
        path: route.path.startsWith('/') ? route.path : (parent?.path || '') + (route.path.startsWith('/') ? route.path : `/${route.path}`),
        name: String(route.meta?.title || route.name),
        icon: route.meta?.icon || '',
        activeMenuPath: route.meta?.activeMenuPath,
        parent: parent ?? null
      }
      if (route.children && route.children.length > 0) {
        const children = transferRouteToMenuTree(route.children, menuItem)
        if (children.length > 0) {
          menuItem.children = children
        }
      }
      return menuItem
    })
    .filter(Boolean) as IMenuItem[]
}

/**
 * 转换路由为菜单树
 * @param routes 路由配置数组
 * @param parent 父菜单项，默认值为 null
 * @returns 菜单树数组
 */
export function flattenAllRouteToMenu(routes: CustomRouteRecord[], parent?: IMenuItem): IMenuItem[] {
  const result: IMenuItem[] = []

  routes.forEach((route) => {
    const menuItem: IMenuItem = {
      path: route.path.startsWith('/') ? route.path : (parent?.path || '') + (route.path.startsWith('/') ? route.path : `/${route.path}`),
      name: String(route.meta?.title || route.name),
      icon: route.meta?.icon || '',
      activeMenuPath: route.meta?.activeMenuPath,
      parent: parent ?? null
    }
    result.push(menuItem)

    if (route.children) {
      result.push(...flattenAllRouteToMenu(route.children, menuItem))
    }
  })
  return result
}
