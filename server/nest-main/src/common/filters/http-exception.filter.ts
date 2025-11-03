import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiErrorResponse, ERROR_TYPES, RESPONSE_CODES, ErrorInfo } from '../response/types'
import { BusinessException, DataNotFoundException, ValidationException } from '../exceptions'

/**
 * HTTP 异常过滤器
 * 统一处理 HTTP 请求中的异常，提供标准化的错误响应格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost): void {
    const contextType = host.getType<'http'>()

    // 确保只处理 HTTP 请求
    if (contextType !== 'http') {
      return
    }

    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // 生成请求 ID 用于日志追踪
    const requestId = this.generateRequestId()

    // 统一的异常处理逻辑
    const { httpStatus, errorResponse } = this.processException(exception, request, requestId)

    // 记录异常详情
    this.logException(exception, request, requestId, httpStatus)

    // 返回统一格式的响应
    response.status(httpStatus).json(errorResponse)
  }

  /**
   * 统一异常处理逻辑
   * 根据异常类型决定HTTP状态码和响应格式
   */
  private processException(
    exception: any,
    request: Request,
    requestId: string
  ): {
    httpStatus: number
    errorResponse: ApiErrorResponse
  } {
    const timestamp = new Date().toISOString()

    // 认证相关异常 - 返回对应 HTTP 状态码
    if (exception instanceof UnauthorizedException) {
      return {
        httpStatus: 401,
        errorResponse: this.buildErrorResponse(401, exception.message || '认证失败', ERROR_TYPES.AUTHENTICATION, { message: exception.message }, requestId, request.url, timestamp)
      }
    }

    if (exception instanceof ForbiddenException) {
      return {
        httpStatus: 403,
        errorResponse: this.buildErrorResponse(403, exception.message || '权限不足', ERROR_TYPES.AUTHORIZATION, { message: exception.message }, requestId, request.url, timestamp)
      }
    }

    // API 端点不存在 - 返回 404（仅当不是数据错误时）
    if (exception instanceof NotFoundException && !this.isDataError(exception)) {
      return {
        httpStatus: 404,
        errorResponse: this.buildErrorResponse(404, exception.message || '资源不存在', ERROR_TYPES.NOT_FOUND, { resource: exception.message }, requestId, request.url, timestamp)
      }
    }

    // 所有其他异常 - 统一返回 HTTP 200
    return {
      httpStatus: 200,
      errorResponse: this.buildBusinessErrorResponse(exception, requestId, request.url, timestamp)
    }
  }

  /**
   * 构建标准错误响应
   */
  private buildErrorResponse(code: number, message: string, type: string, details: any, requestId: string, path: string, timestamp: string): ApiErrorResponse {
    return {
      success: false,
      code,
      message,
      data: null,
      error: {
        type,
        details,
        ...(process.env.NODE_ENV !== 'production' && {
          requestId,
          path,
          timestamp
        })
      }
    }
  }

  /**
   * 构建业务错误响应（HTTP 200）
   */
  private buildBusinessErrorResponse(exception: any, requestId: string, path: string, timestamp: string): ApiErrorResponse {
    // 处理自定义业务异常
    if (exception instanceof BusinessException) {
      return this.buildErrorResponse(exception.code, exception.message, exception.type, exception.details, requestId, path, timestamp)
    }

    // 处理数据不存在异常（包括旧的NotFoundException）
    if (exception instanceof DataNotFoundException || this.isDataError(exception)) {
      const details = exception instanceof DataNotFoundException ? exception.details : this.extractDataErrorDetails(exception)

      return this.buildErrorResponse(RESPONSE_CODES.BAD_REQUEST, exception.message, ERROR_TYPES.DATA_ERROR, details, requestId, path, timestamp)
    }

    // 处理参数验证异常
    if (exception instanceof ValidationException || exception instanceof BadRequestException) {
      const details = exception instanceof ValidationException ? exception.details : this.extractValidationDetails(exception)

      return this.buildErrorResponse(RESPONSE_CODES.VALIDATION_ERROR, exception.message || '请求参数错误', ERROR_TYPES.VALIDATION, details, requestId, path, timestamp)
    }

    // 处理冲突异常
    if (exception instanceof ConflictException) {
      return this.buildErrorResponse(409, exception.message || '资源冲突', ERROR_TYPES.BUSINESS, { message: exception.message }, requestId, path, timestamp)
    }

    // 处理其他HTTP异常
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      let message = exception.message || '请求处理失败'
      let details: any = undefined

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>
        message = resp.message || message
        details = resp.details || resp.errors
      }

      return this.buildErrorResponse(status, message, this.getErrorTypeByStatus(status), details, requestId, path, timestamp)
    }

    // 处理其他异常 - 内部错误
    const message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : exception.message || '服务器内部错误'
    return this.buildErrorResponse(RESPONSE_CODES.INTERNAL_ERROR, message, ERROR_TYPES.INTERNAL, process.env.NODE_ENV === 'production' ? undefined : exception, requestId, path, timestamp)
  }

  /**
   * 检查是否是数据错误（如用户不存在）
   */
  private isDataError(exception: any): boolean {
    return exception.message?.includes('不存在') && (exception.message?.includes('用户') || exception.message?.includes('角色') || exception.message?.includes('权限') || exception.entityType || exception.message?.match(/\w+\s+\w+\s+不存在/))
  }

  /**
   * 提取数据错误详情
   */
  private extractDataErrorDetails(exception: any): any {
    if (exception.entityType && exception.identifier) {
      return { entityType: exception.entityType, identifier: exception.identifier }
    }

    // 从消息中提取信息，如 "用户 15316120580 不存在"
    const match = exception.message?.match(/(\w+)\s+([^\s]+)\s+不存在/)
    if (match) {
      return { entityType: match[1], identifier: match[2] }
    }

    return { message: exception.message }
  }

  /**
   * 提取验证错误详情
   */
  private extractValidationDetails(exception: any): any {
    if (exception.getResponse && typeof exception.getResponse === 'function') {
      const response = exception.getResponse()
      if (typeof response === 'object' && response !== null) {
        const resp = response as Record<string, any>
        return resp.details || resp.errors || resp.message
      }
    }
    return undefined
  }

  /**
   * 根据 HTTP 状态码获取错误类型
   */
  private getErrorTypeByStatus(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) {
      return ERROR_TYPES.VALIDATION
    } else if (status === HttpStatus.UNAUTHORIZED) {
      return ERROR_TYPES.AUTHENTICATION
    } else if (status === HttpStatus.FORBIDDEN) {
      return ERROR_TYPES.AUTHORIZATION
    } else if (status === HttpStatus.NOT_FOUND) {
      return ERROR_TYPES.NOT_FOUND
    } else if (status >= 500) {
      return ERROR_TYPES.INTERNAL
    }
    return ERROR_TYPES.BUSINESS
  }

  /**
   * 记录异常详情
   */
  private logException(exception: any, request: Request, requestId: string, statusCode: number): void {
    const logLevel = statusCode >= 500 ? 'error' : 'warn'
    const errorName = exception.constructor?.name || 'UnknownError'
    const message = exception.message || 'Unknown error occurred'

    const logData = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode,
      errorName,
      message,
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.connection.remoteAddress,
      // 在开发环境记录更多信息
      ...(process.env.NODE_ENV === 'development' && {
        body: request.body,
        query: request.query,
        params: request.params
      })
    }

    if (logLevel === 'error') {
      this.logger.error(`[${requestId}] HTTP ${statusCode} - ${errorName}: ${message}`, exception.stack)
    } else {
      this.logger.warn(`[${requestId}] HTTP ${statusCode} - ${errorName}: ${message}`)
    }

    // 在开发环境记录详细的请求信息
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`[${requestId}] Request Details: ${JSON.stringify(logData, null, 2)}`)
    }
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
