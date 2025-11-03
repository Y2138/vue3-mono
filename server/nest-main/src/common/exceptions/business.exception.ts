import { RESPONSE_CODES, ERROR_TYPES } from '../response/types'

/**
 * 业务异常基类
 * 用于统一处理业务逻辑相关的错误
 */
export class BusinessException extends Error {
  constructor(message: string, public readonly code: number = RESPONSE_CODES.BAD_REQUEST, public readonly type: string = ERROR_TYPES.BUSINESS, public readonly details?: any) {
    super(message)
    this.name = 'BusinessException'
  }
}

/**
 * 数据不存在异常
 * 用于表示数据库中的记录不存在，如用户、角色等
 */
export class DataNotFoundException extends BusinessException {
  constructor(entityType: string, identifier: string | number) {
    super(`${entityType} ${identifier} 不存在`, RESPONSE_CODES.BAD_REQUEST, ERROR_TYPES.DATA_ERROR, { entityType, identifier })
    this.name = 'DataNotFoundException'
  }
}

/**
 * 参数验证异常
 * 用于表示请求参数验证失败
 */
export class ValidationException extends BusinessException {
  constructor(message: string, details?: any) {
    super(message, RESPONSE_CODES.VALIDATION_ERROR, ERROR_TYPES.VALIDATION, details)
    this.name = 'ValidationException'
  }
}

/**
 * 数据冲突异常
 * 用于表示数据已存在或冲突的情况
 */
export class ConflictException extends BusinessException {
  constructor(message: string, details?: any) {
    super(
      message,
      409, // 保持409状态码用于区分，但HTTP响应仍为200
      ERROR_TYPES.BUSINESS,
      details
    )
    this.name = 'ConflictException'
  }
}

/**
 * 业务规则异常
 * 用于表示违反业务规则的情况
 */
export class BusinessRuleException extends BusinessException {
  constructor(message: string, details?: any) {
    super(message, RESPONSE_CODES.BAD_REQUEST, ERROR_TYPES.BUSINESS, details)
    this.name = 'BusinessRuleException'
  }
}
