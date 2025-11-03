import { BusinessException, DataNotFoundException, ValidationException, ConflictException, BusinessRuleException } from './business.exception'

/**
 * 异常工具类
 * 提供统一的异常抛出方法，简化异常使用
 */
export class ExceptionUtils {
  /**
   * 抛出数据不存在异常
   */
  static throwDataNotFound(entityType: string, identifier: string | number): never {
    throw new DataNotFoundException(entityType, identifier)
  }

  /**
   * 抛出参数验证异常
   */
  static throwValidationError(message: string, details?: any): never {
    throw new ValidationException(message, details)
  }

  /**
   * 抛出数据冲突异常
   */
  static throwConflictError(message: string, details?: any): never {
    throw new ConflictException(message, details)
  }

  /**
   * 抛出业务规则异常
   */
  static throwBusinessError(message: string, details?: any): never {
    throw new BusinessRuleException(message, details)
  }

  /**
   * 抛出通用业务异常
   */
  static throwError(message: string, code?: number, type?: string, details?: any): never {
    throw new BusinessException(message, code, type, details)
  }

  /**
   * 检查条件，不满足时抛出验证异常
   */
  static assert(condition: boolean, message: string, details?: any): void {
    if (!condition) {
      throw new ValidationException(message, details)
    }
  }

  /**
   * 检查值不为空，为空时抛出验证异常
   */
  static assertNotEmpty(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationException(`${fieldName}不能为空`)
    }
  }

  /**
   * 检查数据存在，不存在时抛出数据不存在异常
   */
  static assertDataExists<T>(data: T | null | undefined, entityType: string, identifier: string | number): asserts data is T {
    if (!data) {
      throw new DataNotFoundException(entityType, identifier)
    }
  }
}
