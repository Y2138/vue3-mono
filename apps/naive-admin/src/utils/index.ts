import { RouteRecordRaw } from 'vue-router'

export function transferRouteToMenu(routes: RouteRecordRaw[], parent?: IMenuItem): IMenuItem[] {
  return routes.map(route => {
    const menuItem: IMenuItem = {
      path: (parent?.path || '') + (route.path.includes('/') ? route.path : `/${route.path}`),
      name: String(route.meta?.title || route.name),
      icon: route.meta?.icon || '',
      parent: parent ?? null,
    }
    if (route.children) {
      menuItem.children = transferRouteToMenu(route.children, menuItem)
    }
    return menuItem
  })
}

export function flattenTreeWithPaths(nodes: IMenuItem[]) {
  const result: IMenuItem[] = [];

  nodes.forEach(node => {
    // const currentPath = [...parentPath, node.name];
    result.push({ ...node });

    if (node.children) {
      result.push(...flattenTreeWithPaths(node.children));
    }
  });
  return result
}
