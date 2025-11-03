import { ValidationException } from '../exceptions'

/**
 * 基础验证工具类
 *
 * 职责：
 * - 提供通用的格式验证方法
 * - 不涉及具体业务逻辑
 * - 可在所有模块中复用
 */
export class Validator {
  /**
   * 验证必填字段
   */
  static required(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationException(`${fieldName}不能为空`)
    }
  }

  /**
   * 验证手机号格式
   */
  static phone(value: string, fieldName = '手机号'): void {
    this.required(value, fieldName)
    if (!/^1[3-9]\d{9}$/.test(value)) {
      throw new ValidationException(`${fieldName}格式不正确`)
    }
  }

  /**
   * 验证密码强度
   */
  static password(value: string, minLength = 6, fieldName = '密码'): void {
    this.required(value, fieldName)
    if (value.length < minLength) {
      throw new ValidationException(`${fieldName}长度不能少于${minLength}位`)
    }
    // 可以根据需要添加更多密码规则
    // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    //   throw new ValidationException(`${fieldName}必须包含大小写字母和数字`)
    // }
  }

  /**
   * 验证用户名格式
   */
  static username(value: string, fieldName = '用户名'): void {
    this.required(value, fieldName)
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/.test(value)) {
      throw new ValidationException(`${fieldName}只能包含中英文、数字、下划线，长度2-20位`)
    }
  }

  /**
   * 验证身份证号
   */
  static idCard(value: string, fieldName = '身份证号'): void {
    this.required(value, fieldName)
    if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(value)) {
      throw new ValidationException(`${fieldName}格式不正确`)
    }
  }

  /**
   * 验证邮箱格式
   */
  static email(value: string, fieldName = '邮箱'): void {
    this.required(value, fieldName)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new ValidationException(`${fieldName}格式不正确`)
    }
  }

  /**
   * 验证数字范围
   */
  static numberRange(value: number, min: number, max: number, fieldName: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationException(`${fieldName}必须是有效数字`)
    }
    if (value < min || value > max) {
      throw new ValidationException(`${fieldName}必须在${min}-${max}之间`)
    }
  }

  /**
   * 验证字符串长度
   */
  static stringLength(value: string, min: number, max: number, fieldName: string): void {
    this.required(value, fieldName)
    if (value.length < min || value.length > max) {
      throw new ValidationException(`${fieldName}长度必须在${min}-${max}位之间`)
    }
  }

  /**
   * 验证正则表达式
   */
  static pattern(value: string, pattern: RegExp, fieldName: string, errorMessage?: string): void {
    this.required(value, fieldName)
    if (!pattern.test(value)) {
      throw new ValidationException(errorMessage || `${fieldName}格式不正确`)
    }
  }

  /**
   * 验证数组非空
   */
  static arrayNotEmpty<T>(value: T[], fieldName: string): void {
    if (!Array.isArray(value) || value.length === 0) {
      throw new ValidationException(`${fieldName}不能为空`)
    }
  }

  /**
   * 验证枚举值
   */
  static enum<T>(value: T, allowedValues: T[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new ValidationException(`${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`)
    }
  }

  /**
   * 验证 UUID 格式
   */
  static uuid(value: string, fieldName = 'ID'): void {
    this.required(value, fieldName)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new ValidationException(`${fieldName}格式不正确`)
    }
  }

  /**
   * 验证资源名称（权限系统用）
   */
  static resourceName(value: string, fieldName = '资源名称'): void {
    this.required(value, fieldName)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
      throw new ValidationException(`${fieldName}必须以字母开头，只能包含字母、数字、下划线`)
    }
  }

  /**
   * 验证操作名称（权限系统用）
   */
  static actionName(value: string, fieldName = '操作名称'): void {
    this.required(value, fieldName)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
      throw new ValidationException(`${fieldName}必须以字母开头，只能包含字母、数字、下划线`)
    }
  }

  /**
   * 验证角色名称
   */
  static roleName(value: string, fieldName = '角色名称'): void {
    this.required(value, fieldName)
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\s]{2,50}$/.test(value)) {
      throw new ValidationException(`${fieldName}只能包含中英文、数字、下划线、空格，长度2-50位`)
    }
  }

  /**
   * 验证权限名称
   */
  static permissionName(value: string, fieldName = '权限名称'): void {
    this.required(value, fieldName)
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\s]{2,100}$/.test(value)) {
      throw new ValidationException(`${fieldName}只能包含中英文、数字、下划线、空格，长度2-100位`)
    }
  }

  /**
   * 验证描述字段
   */
  static description(value: string, maxLength = 500, fieldName = '描述'): void {
    if (value && value.length > maxLength) {
      throw new ValidationException(`${fieldName}长度不能超过${maxLength}位`)
    }
  }
}
