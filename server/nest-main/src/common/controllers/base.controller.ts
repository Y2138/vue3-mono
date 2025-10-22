import { Logger } from '@nestjs/common'
import { ApiResponse, ApiPaginatedResponse, ApiErrorResponse, PaginationInfo, ErrorInfo, RESPONSE_CODES, ERROR_TYPES } from '../response/types'
import { TimeUtil } from '../utils/time.util'

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

  // ==================== 错误响应方法 ====================

  /**
   * 创建用户友好的错误响应
   * 适用于需要直接展示给用户的错误信息
   * @param message 错误消息
   * @param code 错误代码
   * @returns 用户友好的错误响应
   */
  protected userError(message: string, code = RESPONSE_CODES.BAD_REQUEST): ApiErrorResponse {
    const error: ErrorInfo = {
      type: ERROR_TYPES.BUSINESS,
      details: { message }
    }

    return {
      success: false,
      code,
      message,
      data: null,
      error
    }
  }

  /**
   * 创建业务错误响应
   * @param message 错误消息
   * @param code 错误代码
   * @returns 业务错误响应
   */
  protected businessError(message: string, code = RESPONSE_CODES.BAD_REQUEST): ApiErrorResponse {
    const error: ErrorInfo = {
      type: ERROR_TYPES.BUSINESS,
      details: { message }
    }

    this.logger.warn(`业务错误: ${message}`)

    return {
      success: false,
      code,
      message,
      data: null,
      error
    }
  }

  /**
   * 创建资源未找到错误响应
   * 仅用于表示路由或API端点不存在的情况
   * @param resource 资源名称
   * @returns 资源未找到错误响应
   */
  protected notFound(resource: string): ApiErrorResponse {
    const message = `${resource}不存在`
    const error: ErrorInfo = {
      type: ERROR_TYPES.NOT_FOUND,
      details: { resource }
    }

    return {
      success: false,
      code: RESPONSE_CODES.NOT_FOUND,
      message,
      data: null,
      error
    }
  }

  /**
   * 创建数据不存在错误响应
   * 用于表示数据库中的记录不存在，如用户、角色等
   * @param entityType 实体类型名称（如：用户、角色、权限等）
   * @param identifier 标识符（如：ID、名称、手机号等）
   * @returns 数据不存在错误响应
   */
  protected dataNotFound(entityType: string, identifier: string | number): ApiErrorResponse {
    const message = `${entityType} ${identifier} 不存在`
    const error: ErrorInfo = {
      type: ERROR_TYPES.DATA_ERROR,
      details: { entityType, identifier }
    }

    return {
      success: false,
      code: RESPONSE_CODES.BAD_REQUEST,
      message,
      data: null,
      error
    }
  }

  /**
   * 创建权限不足错误响应
   * @param message 错误消息
   * @returns 权限不足错误响应
   */
  protected forbidden(message = '权限不足'): ApiErrorResponse {
    const error: ErrorInfo = {
      type: ERROR_TYPES.AUTHORIZATION,
      details: { message }
    }

    return {
      success: false,
      code: RESPONSE_CODES.FORBIDDEN,
      message,
      data: null,
      error
    }
  }

  /**
   * 创建验证错误响应
   * @param message 错误消息
   * @param details 错误详情
   * @returns 验证错误响应
   */
  protected validationError(message = '请求参数验证失败', details?: any): ApiErrorResponse {
    const error: ErrorInfo = {
      type: ERROR_TYPES.VALIDATION,
      details
    }

    return {
      success: false,
      code: RESPONSE_CODES.VALIDATION_ERROR,
      message,
      data: null,
      error
    }
  }

  /**
   * 创建服务器错误响应
   * @param message 错误消息
   * @param error 原始错误
   * @returns 服务器错误响应
   */
  protected serverError(message = '服务器内部错误', error?: any): ApiErrorResponse {
    const errorInfo: ErrorInfo = {
      type: ERROR_TYPES.INTERNAL,
      details: error
    }

    this.logger.error(`服务器错误: ${message}`, error?.stack || error)

    return {
      success: false,
      code: RESPONSE_CODES.INTERNAL_ERROR,
      message,
      data: null,
      error: errorInfo
    }
  }

  // ==================== 安全执行方法 ====================

  /**
   * 安全执行异步操作并返回标准响应
   * @param operation 要执行的异步操作
   * @param successMessage 成功消息
   * @returns 标准响应或错误响应
   */
  protected async safeExecute<T>(operation: () => Promise<T>, successMessage = '操作成功'): Promise<ApiResponse<T> | ApiErrorResponse> {
    try {
      const result = await operation()
      return this.success(result, successMessage)
    } catch (error) {
      this.logger.error('操作执行失败', error?.stack || error)
      return this.handleOperationError(error)
    }
  }

  /**
   * 安全执行分页查询操作并返回标准分页响应
   * @param operation 要执行的分页查询操作
   * @param page 页码
   * @param pageSize 每页大小
   * @param successMessage 成功消息
   * @returns 标准分页响应或错误响应
   */
  protected async safePaginatedExecute<T>(operation: () => Promise<{ data: T[]; total: number }>, page: number, pageSize: number, successMessage = '查询成功'): Promise<ApiPaginatedResponse<T> | ApiErrorResponse> {
    try {
      const { data, total } = await operation()

      const totalPages = Math.ceil(total / pageSize)

      const pagination: PaginationInfo = {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }

      return this.paginated(data, pagination, successMessage)
    } catch (error) {
      this.logger.error('分页查询失败', error?.stack || error)
      return this.handleOperationError(error)
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 处理操作错误
   * @param error 错误对象
   * @returns 标准化的错误响应
   */
  private handleOperationError(error: any): ApiErrorResponse {
    // 根据错误类型返回不同的错误响应
    if (error.status === 404) {
      // 判断是资源不存在还是数据不存在
      if (error.entityType && error.identifier) {
        return this.dataNotFound(error.entityType, error.identifier)
      } else if (error.message?.includes('不存在') && error.message?.includes('用户')) {
        // 如果是用户不存在的错误，则使用数据错误
        return this.dataNotFound('用户', error.resource || '')
      } else {
        // 其他资源不存在的错误
        return this.notFound(error.resource || '资源')
      }
    }

    if (error.status === 403 || error.message?.includes('forbidden')) {
      return this.forbidden(error.message)
    }

    // 处理 BadRequestException 和其他验证错误
    if (error.status === 400 || error.name === 'BadRequestException' || error.message?.includes('validation') || error.message?.includes('格式不正确')) {
      return this.validationError(error.message, error.errors)
    }

    // 检查是否是 NotFoundException 实例，但实际上是数据错误
    if (error.name === 'NotFoundException' && error.message?.includes('用户')) {
      return this.dataNotFound('用户', error.message.replace(/.*\s([^\s]+)\s不存在.*/, '$1'))
    }

    // 默认返回服务器错误
    return this.serverError(error.message || '操作执行失败', error)
  }

  /**
   * 通用错误响应方法
   * @param message 错误消息
   * @param code HTTP 状态码
   * @returns 错误响应
   */
  protected error(message: string, code = 400): any {
    if (code === 404) {
      return this.notFound(message)
    } else if (code === 403) {
      return this.forbidden(message)
    } else if (code === 409) {
      return this.businessError(message)
    } else if (code >= 500) {
      return this.serverError(message)
    } else {
      return this.userError(message)
    }
  }

  /**
   * 统一错误处理方法
   * @param error 错误对象
   * @param defaultMessage 默认错误消息
   * @returns 错误响应
   */
  protected handleError(error: any, defaultMessage = '操作失败'): any {
    this.logger.error(`${defaultMessage}: ${error.message}`, error.stack)

    if (error.response) {
      // 如果是已经格式化的错误响应，直接返回
      return error.response
    }

    // 使用统一的错误处理逻辑
    return this.handleOperationError(error)
  }
}
