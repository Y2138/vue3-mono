/**
 * 用户模块枚举配置
 * 基于 proto 定义生成，使用简单的对象结构
 */
import { EnumItem } from '../../../shared/common'

export const USER_ENUMS = {
  /**
   * 用户状态
   */
  USER_STATUS: {
    PENDING: {
      value: 1,
      label: '待激活',
      disabled: false,
      extra: { color: 'info', description: '用户账户等待激活' }
    },
    ACTIVE: {
      value: 2,
      label: '激活',
      disabled: false,
      extra: JSON.stringify({ color: 'success', description: '用户账户正常激活状态' })
    },
    OFFLINE: {
      value: 3,
      label: '下线',
      disabled: false,
      extra: JSON.stringify({ color: 'danger', description: '用户账户已下线' })
    },
    LOCKED: {
      value: 4,
      label: '锁定',
      disabled: false,
      extra: JSON.stringify({ color: 'warning', description: '用户账户被锁定' })
    }
  } as Record<string, EnumItem>,

  /**
   * 用户类型
   */
  USER_TYPE: {
    GUEST: {
      value: 0,
      label: '访客',
      disabled: true,
      extra: JSON.stringify({ level: 3, description: '访客用户' })
    },
    USER: {
      value: 1,
      label: '普通用户',
      disabled: false,
      extra: JSON.stringify({ level: 2, description: '普通业务用户' })
    },
    ADMIN: {
      value: 99,
      label: '管理员',
      disabled: false,
      extra: JSON.stringify({ level: 1, description: '系统管理员用户' })
    }
  } as Record<string, EnumItem>
} as const
