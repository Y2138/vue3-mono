import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ResourceTree } from '@/shared/resource'

export const useMenuStore = defineStore('menu', () => {
  // ========================================
  // 📊 状态定义
  // ========================================

  const activeMenuKey = ref<string>('') // 当前路由路径
  const menuTree = ref<IMenuItem[]>([]) // 菜单树
  const flatAllMenuList = ref<IMenuItem[]>([]) // 扁平化菜单列表
  const collapsed = ref<boolean>(false) // 菜单是否收起

  // ========================================
  // 🔍 计算属性
  // ========================================

  const menuRoutes = computed(() => {
    const result: IMenuItem[] = []
    let curMenu = flatAllMenuList.value.find((item) => item.path === activeMenuKey.value)
    if (curMenu) {
      result.push(curMenu)
      while (curMenu.parent) {
        result.unshift(curMenu.parent)
        curMenu = curMenu.parent
      }
    }
    return result
  })

  // ========================================
  // 🔧 工具方法
  // ========================================

  /**
   * 将 ResourceTree 转换为 IMenuItem
   * @param resourceTree 资源树
   * @param parent 父菜单项
   * @returns 菜单项
   */
  function convertResourceToMenuItem(resourceTree: ResourceTree, parent: IMenuItem | null = null): IMenuItem {
    return {
      path: resourceTree.path,
      name: resourceTree.name,
      icon: resourceTree.icon || '',
      activeMenuPath: '',
      parent,
      children: resourceTree.children && resourceTree.children.length > 0 ? resourceTree.children.map((child) => convertResourceToMenuItem(child, null)) : undefined
    }
  }

  /**
   * 将 ResourceTree 数组转换为 IMenuItem 数组（过滤 MENU 类型）
   * @param resourceTrees 资源树数组
   * @returns 菜单项数组
   */
  function convertResourceTreesToMenuItems(resourceTrees: ResourceTree[]): IMenuItem[] {
    // 过滤出 MENU 类型（type=1）的资源
    const menuResources = resourceTrees.filter((resource) => resource.type === 1)
    return menuResources.map((resourceTree) => convertResourceToMenuItem(resourceTree))
  }

  /**
   * 扁平化菜单树
   * @param menuItems 菜单项数组
   * @param parent 父菜单项
   * @returns 扁平化的菜单项数组
   */
  function flattenMenuItems(menuItems: IMenuItem[], parent: IMenuItem | null = null): IMenuItem[] {
    const result: IMenuItem[] = []

    menuItems.forEach((item) => {
      const menuItem: IMenuItem = {
        ...item,
        parent
      }
      result.push(menuItem)

      if (item.children && item.children.length > 0) {
        result.push(...flattenMenuItems(item.children, menuItem))
      }
    })

    return result
  }

  // ========================================
  // 🎯 核心方法
  // ========================================

  /**
   * 优先设置 activeMenuPath，否则设置当前路径
   */
  function setActiveMenuKey(path: string) {
    const curMenu = flatAllMenuList.value.find((item) => item.path === path)
    if (curMenu) {
      activeMenuKey.value = curMenu.activeMenuPath || path
    } else {
      activeMenuKey.value = path
    }
  }

  /**
   * 更新菜单树
   * @param resourceTrees 资源树数组
   */
  function updateMenuTree(resourceTrees: ResourceTree[]) {
    // 将资源树转换为菜单项数组
    const menuItems = convertResourceTreesToMenuItems(resourceTrees)
    // 扁平化菜单树
    const flattenedMenuItems = flattenMenuItems(menuItems)

    menuTree.value = menuItems
    flatAllMenuList.value = flattenedMenuItems
  }

  /**
   * 重置菜单树
   */
  function resetMenuTree() {
    menuTree.value = []
    flatAllMenuList.value = []
  }

  /**
   * 切换菜单收起状态
   */
  function toggleCollapse() {
    collapsed.value = !collapsed.value
  }

  return {
    // 状态
    activeMenuKey,
    menuTree,
    flatAllMenuList,
    collapsed,

    // 计算属性
    menuRoutes,

    // 方法
    setActiveMenuKey,
    updateMenuTree,
    resetMenuTree,
    toggleCollapse
  }
})
