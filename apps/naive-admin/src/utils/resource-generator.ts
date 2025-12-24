/**
 * 资源码生成工具类
 * 基于RBAC权限系统设计方案，实现四种资源类型的resCode自动生成
 *
 * 资源码规则：
 * - menu类型：MENU_{路径}，将路由path中的"/"转换为"_"
 * - page类型：PAGE_{路径}，将路由path中的"/"转换为"_"
 * - api类型：API_{路径}，将接口path中的"/"转换为"_"
 * - module类型：MODULE_{自定义码}，用户手动配置，不做处理
 */

export enum ResourceType {
  MENU = 1, // 菜单资源
  PAGE = 2, // 页面资源
  API = 3, // 接口资源
  MODULE = 4 // 模块资源
}

export class ResourceGenerator {
  /**
   * 生成菜单资源码
   * @param path 菜单路由路径，如：/user-management, /system/role
   * @returns 格式：MENU_user_management, MENU_system_role
   */
  static generateMenuResCode(path: string): string {
    // 移除开头的"/"，将"/"替换为"_"
    const cleanPath = path.replace(/^\//, '').replace(/\//g, '_')
    return `MENU_${cleanPath}`
  }

  /**
   * 生成页面资源码
   * @param path 页面路由路径，如：/user-management, /system/role
   * @returns 格式：PAGE_user_management, PAGE_system_role
   */
  static generatePageResCode(path: string): string {
    // 移除开头的"/"，将"/"替换为"_"
    const cleanPath = path.replace(/^\//, '').replace(/\//g, '_')
    return `PAGE_${cleanPath}`
  }

  /**
   * 生成API资源码
   * @param path API接口路径，如：/api/users, /api/users/:id
   * @returns 格式：API_users, API_users_id
   */
  static generateApiResCode(path: string): string {
    // 移除开头的"/api/"，将参数":id"转换为"id"，将"/"替换为"_"
    let cleanPath = path.replace(/^\/api\//, '')
    // 处理路径参数 :id -> id
    cleanPath = cleanPath.replace(/:([a-zA-Z0-9_]+)/g, '$1')
    // 将"/"替换为"_"
    cleanPath = cleanPath.replace(/\//g, '_')
    return `API_${cleanPath}`
  }

  /**
   * 生成模块资源码
   * @param customCode 用户自定义的模块码
   * @returns 格式：MODULE_user_create, MODULE_role_manage
   */
  static generateModuleResCode(customCode: string): string {
    // 模块类型由开发者手动配置，不进行路径转换
    return `MODULE_${customCode}`
  }

  /**
   * 根据资源类型和路径生成资源码
   * @param type 资源类型（1=menu, 2=page, 3=api, 4=module）
   * @param path 资源路径
   * @param customCode 自定义代码（module类型时使用）
   * @returns 生成的资源码
   */
  static generateResCode(type: ResourceType, path: string, customCode?: string): string {
    switch (type) {
      case 1: // ResourceType.MENU
        return this.generateMenuResCode(path)
      case 2: // ResourceType.PAGE
        return this.generatePageResCode(path)
      case 3: // ResourceType.API
        return this.generateApiResCode(path)
      case 4: // ResourceType.MODULE
        if (!customCode) {
          throw new Error('模块类型资源需要提供自定义代码')
        }
        return this.generateModuleResCode(customCode)
      default:
        throw new Error(`未知的资源类型: ${type}`)
    }
  }

  /**
   * 生成层级关系ID（whole_id）
   * @param parentIds 父节点ID数组
   * @param currentId 当前节点ID
   * @returns 格式：parent.child.grandchild.current
   */
  static generateWholeId(parentIds: string[], currentId: string): string {
    const ids = [...parentIds.filter((id) => id), currentId]
    return ids.join('.')
  }

  /**
   * 验证资源码格式
   * @param resCode 待验证的资源码
   * @returns 是否符合格式规范
   */
  static validateResCode(resCode: string): boolean {
    // 验证资源码格式：^(MENU|PAGE|API|MODULE)_[a-zA-Z0-9_]+$
    const pattern = /^(MENU|PAGE|API|MODULE)_[a-zA-Z0-9_]+$/
    return pattern.test(resCode)
  }

  /**
   * 从资源码中提取类型
   * @param resCode 资源码
   * @returns 资源类型枚举
   */
  static extractResourceType(resCode: string): ResourceType | null {
    if (resCode.startsWith('MENU_')) {
      return 1 // ResourceType.MENU
    } else if (resCode.startsWith('PAGE_')) {
      return 2 // ResourceType.PAGE
    } else if (resCode.startsWith('API_')) {
      return 3 // ResourceType.API
    } else if (resCode.startsWith('MODULE_')) {
      return 4 // ResourceType.MODULE
    }
    return null
  }

  /**
   * 从资源码中提取原始标识
   * @param resCode 资源码
   * @returns 去掉前缀的原始标识
   */
  static extractResCode(resCode: string): string {
    const parts = resCode.split('_', 2)
    return parts.length > 1 ? parts[1] : resCode
  }

  /**
   * 获取资源类型的显示名称
   * @param type 资源类型枚举
   * @returns 显示名称
   */
  static getResourceTypeName(type: ResourceType): string {
    switch (type) {
      case 1: // ResourceType.MENU
        return '菜单'
      case 2: // ResourceType.PAGE
        return '页面'
      case 3: // ResourceType.API
        return '接口'
      case 4: // ResourceType.MODULE
        return '模块'
      default:
        return '未知'
    }
  }

  /**
   * 批量生成资源码
   * @param resources 资源对象数组，每个对象包含type和path属性
   * @param customCodes module类型的自定义代码映射
   * @returns 生成的资源码映射
   */
  static batchGenerateResCodes(resources: Array<{ id: string; type: ResourceType; path: string }>, customCodes: Record<string, string> = {}): Record<string, string> {
    const resCodeMap: Record<string, string> = {}

    for (const resource of resources) {
      let resCode: string

      if (resource.type === ResourceType.MODULE) {
        const customCode = customCodes[resource.id]
        resCode = this.generateResCode(resource.type, resource.path, customCode)
      } else {
        resCode = this.generateResCode(resource.type, resource.path)
      }

      resCodeMap[resource.id] = resCode
    }

    return resCodeMap
  }
}
