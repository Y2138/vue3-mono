import { Logger } from '@nestjs/common'
import { ApiResponse, ApiPaginatedResponse, PaginationInfo, RESPONSE_CODES } from '../response/types'
import { TimeUtil } from '../utils/time.util'
import { ExceptionUtils } from '../exceptions'

/**
 * 控制器基类
 *
 * 提供统一的响应处理方法，支持成功响应、分页响应和错误响应
 * 所有 HTTP 和 gRPC 控制器都应继承此基类
 */
export abstract class BaseController {
  protected readonly logger: Logger

  /**
   * 构造函数
   * @param controllerName 控制器名称，用于日志记录
   */
  constructor(controllerName: string) {
    this.logger = new Logger(controllerName)
  }

  // ==================== 时间格式化方法 ====================

  /**
   * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
   * @param date 日期对象、时间戳或日期字符串
   * @param format 自定义格式，默认为 YYYY-MM-DD HH:mm:ss
   * @returns 格式化后的时间字符串
   */
  protected formatDateTime(date: Date | string | number, format?: string): string {
    return TimeUtil.formatDateTime(date, format)
  }

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   * @param date 日期对象、时间戳或日期字符串
   * @param format 自定义格式，默认为 YYYY-MM-DD
   * @returns 格式化后的日期字符串
   */
  protected formatDate(date: Date | string | number, format?: string): string {
    return TimeUtil.formatDate(date, format)
  }

  /**
   * 格式化时间为 HH:mm:ss 格式
   * @param date 日期对象、时间戳或日期字符串
   * @param format 自定义格式，默认为 HH:mm:ss
   * @returns 格式化后的时间字符串
   */
  protected formatTime(date: Date | string | number, format?: string): string {
    return TimeUtil.formatTime(date, format)
  }

  // ==================== 成功响应方法 ====================

  /**
   * 创建成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @returns 标准化的成功响应
   */
  protected success<T>(data: T, message = '操作成功'): ApiResponse<T> {
    return {
      success: true,
      code: RESPONSE_CODES.SUCCESS,
      message,
      data
    }
  }

  /**
   * 创建分页响应
   * @param data 分页数据列表
   * @param pagination 分页信息
   * @param message 响应消息
   * @returns 标准化的分页响应
   */
  protected paginated<T>(data: T[], pagination: PaginationInfo, message = '查询成功'): ApiPaginatedResponse<T> {
    return {
      success: true,
      code: RESPONSE_CODES.SUCCESS,
      message,
      data,
      pagination
    }
  }

  /**
   * 创建空响应（无内容）
   * @param message 响应消息
   * @returns 标准化的无内容响应
   */
  protected noContent(message = '操作成功'): ApiResponse<null> {
    return {
      success: true,
      code: RESPONSE_CODES.NO_CONTENT,
      message,
      data: null
    }
  }

  /**
   * 创建创建成功响应
   * @param data 创建的资源数据
   * @param message 响应消息
   * @returns 标准化的创建成功响应
   */
  protected created<T>(data: T, message = '创建成功'): ApiResponse<T> {
    return {
      success: true,
      code: RESPONSE_CODES.CREATED,
      message,
      data
    }
  }

  // ==================== 异常抛出方法 ====================

  /**
   * 抛出数据不存在异常
   * @param entityType 实体类型名称（如：用户、角色、权限等）
   * @param identifier 标识符（如：ID、名称、手机号等）
   */
  protected throwDataNotFound(entityType: string, identifier: string | number): never {
    ExceptionUtils.throwDataNotFound(entityType, identifier)
  }

  /**
   * 抛出参数验证异常
   * @param message 错误消息
   * @param details 错误详情
   */
  protected throwValidationError(message: string, details?: any): never {
    ExceptionUtils.throwValidationError(message, details)
  }

  /**
   * 抛出数据冲突异常
   * @param message 错误消息
   * @param details 错误详情
   */
  protected throwConflictError(message: string, details?: any): never {
    ExceptionUtils.throwConflictError(message, details)
  }

  /**
   * 抛出业务规则异常
   * @param message 错误消息
   * @param details 错误详情
   */
  protected throwBusinessError(message: string, details?: any): never {
    ExceptionUtils.throwBusinessError(message, details)
  }

  /**
   * 检查条件，不满足时抛出验证异常
   * @param condition 条件
   * @param message 错误消息
   * @param details 错误详情
   */
  protected assert(condition: boolean, message: string, details?: any): void {
    ExceptionUtils.assert(condition, message, details)
  }

  /**
   * 检查值不为空，为空时抛出验证异常
   * @param value 要检查的值
   * @param fieldName 字段名称
   */
  protected assertNotEmpty(value: any, fieldName: string): void {
    ExceptionUtils.assertNotEmpty(value, fieldName)
  }

  /**
   * 检查数据存在，不存在时抛出数据不存在异常
   * @param data 数据
   * @param entityType 实体类型
   * @param identifier 标识符
   * @returns 数据（如果存在）
   */
  protected assertDataExists<T>(data: T | null | undefined, entityType: string, identifier: string | number): asserts data is T {
    ExceptionUtils.assertDataExists(data, entityType, identifier)
  }
}
