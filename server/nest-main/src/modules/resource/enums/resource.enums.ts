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
    PAGE: {
      value: 0,
      label: '页面',
      disabled: false,
      extra: JSON.stringify({ color: 'primary', description: '页面资源，用于前端路由和菜单' })
    },
    API: {
      value: 1,
      label: 'API',
      disabled: false,
      extra: JSON.stringify({ color: 'info', description: 'API接口资源，用于后端接口访问控制' })
    },
    BUTTON: {
      value: 2,
      label: '按钮',
      disabled: false,
      extra: JSON.stringify({ color: 'success', description: '按钮资源，用于前端页面内的操作权限' })
    }
  } as Record<string, EnumItem>
} as const

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
  return Object.values(RESOURCE_ENUMS.RESOURCE_TYPE).some(item => item.value === type)
}