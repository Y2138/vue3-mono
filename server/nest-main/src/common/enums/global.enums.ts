/**
 * 全局通用枚举配置
 */
import { EnumItem } from '../../shared/common'
// 枚举项接口

export const GLOBAL_ENUMS = {
  /**
   * 是否选择
   */
  YES_NO: {
    YES: {
      value: 1,
      label: '是',
      disabled: false,
      extra: JSON.stringify({ color: 'success', description: '是' })
    },
    NO: {
      value: 0,
      label: '否',
      disabled: false,
      extra: JSON.stringify({ color: 'danger', description: '否' })
    }
  } as Record<string, EnumItem>,

  /**
   * 启用状态
   */
  ENABLE_STATUS: {
    ENABLED: {
      value: 1,
      label: '启用',
      disabled: false,
      extra: JSON.stringify({ color: 'success', description: '启用' })
    },
    DISABLED: {
      value: 0,
      label: '禁用',
      disabled: false,
      extra: JSON.stringify({ color: 'danger', description: '禁用' })
    }
  } as Record<string, EnumItem>,

  /**
   * 通用状态
   */
  COMMON_STATUS: {
    ACTIVE: {
      value: 1,
      label: '激活',
      disabled: false,
      extra: JSON.stringify({ color: 'success', description: '激活' })
    },
    INACTIVE: {
      value: 0,
      label: '停用',
      disabled: false,
      extra: JSON.stringify({ color: 'danger', description: '停用' })
    }
  } as Record<string, EnumItem>,

  /**
   * 操作类型
   */
  OPERATION_TYPE: {
    CREATE: {
      value: 1,
      label: '创建',
      disabled: false,
      extra: JSON.stringify({ color: 'success', description: '创建' })
    },
    READ: {
      value: 2,
      label: '读取',
      disabled: false,
      extra: JSON.stringify({ color: 'primary', description: '读取' })
    },
    UPDATE: {
      value: 3,
      label: '更新',
      disabled: false,
      extra: JSON.stringify({ color: 'warning', description: '更新' })
    },
    DELETE: {
      value: 4,
      label: '删除',
      disabled: false,
      extra: JSON.stringify({ color: 'danger', description: '删除' })
    },
    VIEW: {
      value: 5,
      label: '查看',
      disabled: false,
      extra: JSON.stringify({ color: 'info', description: '查看' })
    }
  } as Record<string, EnumItem>
} as const
