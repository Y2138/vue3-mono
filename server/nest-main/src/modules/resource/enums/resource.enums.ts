/**
 * 资源模块枚举配置
 * 基于 proto 定义生成，使用简单的对象结构
 */
import { EnumItem } from '../../../shared/common'

export const RESOURCE_ENUMS = {
  /**
   * 资源类型
   */
  RESOURCE_TYPE: {
    MENU: {
      value: 1,
      label: '目录',
      disabled: false,
      extra: JSON.stringify({ color: 'primary', description: '目录资源，用于前端菜单展示' })
    },
    PAGE: {
      value: 2,
      label: '页面',
      disabled: false,
      extra: JSON.stringify({ color: 'info', description: '页面资源，用于前端路由权限控制，不展示在菜单' })
    },
    API: {
      value: 3,
      label: '接口',
      disabled: false,
      extra: JSON.stringify({ color: 'success', description: 'API接口资源，用于后端接口访问控制' })
    },
    MODULE: {
      value: 4,
      label: '模块',
      disabled: false,
      extra: JSON.stringify({ color: 'warning', description: '模块资源，用于前端页面内的操作权限' })
    }
  } as Record<string, EnumItem>
} as const

export enum ResourceType {
  MENU = 1,    // 目录 - 用于菜单展示
  PAGE = 2,    // 页面 - 用于路由权限控制
  API = 3,     // 接口 - 用于接口权限控制
  MODULE = 4   // 模块 - 用于页面内操作权限
}

/**
 * 获取资源类型描述
 * @param type 资源类型值
 * @returns 类型描述
 */
export function getResourceTypeDesc(type: number): string {
  // 从 RESOURCE_TYPE 枚举中查找对应的 label
  const typeEntry = Object.values(RESOURCE_ENUMS.RESOURCE_TYPE).find((item) => item.value === type)
  return typeEntry?.label || '未知类型'
}

/**
 * 获取资源类型的扩展信息
 * @param type 资源类型值
 * @returns 扩展信息对象
 */
export function getResourceTypeExtra(type: number): { color?: string; description?: string } {
  const typeEntry = Object.values(RESOURCE_ENUMS.RESOURCE_TYPE).find((item) => item.value === type)
  if (typeEntry?.extra) {
    try {
      return JSON.parse(typeEntry.extra)
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * 验证资源类型是否有效
 * @param type 资源类型值
 * @returns 是否有效
 */
export function isValidResourceType(type: number): boolean {
  return Object.values(RESOURCE_ENUMS.RESOURCE_TYPE).some((item) => item.value === type)
}
