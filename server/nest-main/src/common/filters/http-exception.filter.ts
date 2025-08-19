import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException, 
  HttpStatus, 
  Logger 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ERROR_TYPES, RESPONSE_CODES } from '../response/types';

/**
 * HTTP 异常过滤器
 * 统一处理 HTTP 请求中的异常，提供标准化的错误响应格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const contextType = host.getType<'http'>();
    
    // 确保只处理 HTTP 请求
    if (contextType !== 'http') {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 生成请求 ID 用于日志追踪
    const requestId = this.generateRequestId();
    
    // 获取状态码和错误信息
    const statusCode = this.getStatusCode(exception);
    const errorResponse = this.getErrorResponse(exception, request, requestId);

    // 记录异常详情
    this.logException(exception, request, requestId, statusCode);

    // 返回标准化的错误响应
    response.status(200).json(errorResponse); // 始终返回 200 状态码，错误信息在响应体中
  }

  /**
   * 获取 HTTP 状态码
   */
  private getStatusCode(exception: any): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // 根据异常类型映射状态码
    const errorName = exception.constructor?.name;
    const statusMapping: Record<string, number> = {
      ValidationError: RESPONSE_CODES.VALIDATION_ERROR,
      UnauthorizedException: RESPONSE_CODES.UNAUTHORIZED,
      ForbiddenException: RESPONSE_CODES.FORBIDDEN,
      NotFoundException: RESPONSE_CODES.NOT_FOUND,
      ConflictException: 409,
      UnprocessableEntityException: RESPONSE_CODES.VALIDATION_ERROR,
      BadRequestException: RESPONSE_CODES.BAD_REQUEST,
    };

    return statusMapping[errorName] || RESPONSE_CODES.INTERNAL_ERROR;
  }

  /**
   * 构建错误响应对象
   */
  private getErrorResponse(exception: any, request: Request, requestId: string): ApiErrorResponse {
    const code = this.getStatusCode(exception);
    const timestamp = new Date().toISOString();
    
    // 提取错误类型
    const errorType = this.getErrorType(exception);
    
    // 提取错误消息
    let message = '服务器内部错误';
    let details: any = undefined;
    
    // 处理 HttpException
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || exception.message || '请求处理失败';
        details = resp.details || resp.errors || resp;
      } else {
        message = exception.message;
      }
    } 
    // 处理验证错误
    else if (exception.name === 'ValidationError' || exception.errors) {
      message = '请求参数验证失败';
      details = exception.errors || exception.details;
    } 
    // 处理其他错误
    else {
      message = exception.message || '服务器内部错误';
    }
    
    // 在生产环境隐藏敏感错误信息
    if (process.env.NODE_ENV === 'production' && code >= 500) {
      message = '服务器内部错误';
      details = undefined;
    }

    // 构建标准 ApiErrorResponse
    return {
      success: false,
      code,
      message,
      data: null,
      error: {
        type: errorType,
        details,
        // 在开发环境提供更多调试信息
        ...(process.env.NODE_ENV !== 'production' && {
          stack: exception.stack,
          requestId,
          path: request.url,
          timestamp,
        }),
      }
    };
  }

  /**
   * 获取错误类型
   */
  private getErrorType(exception: any): string {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      
      if (status === HttpStatus.BAD_REQUEST) {
        return ERROR_TYPES.VALIDATION;
      } else if (status === HttpStatus.UNAUTHORIZED) {
        return ERROR_TYPES.AUTHENTICATION;
      } else if (status === HttpStatus.FORBIDDEN) {
        return ERROR_TYPES.AUTHORIZATION;
      } else if (status === HttpStatus.NOT_FOUND) {
        return ERROR_TYPES.NOT_FOUND;
      } else if (status >= 500) {
        return ERROR_TYPES.INTERNAL;
      }
    }

    // 根据异常名称推断类型
    const errorName = exception.constructor?.name || '';
    
    if (errorName.includes('Validation') || errorName.includes('BadRequest')) {
      return ERROR_TYPES.VALIDATION;
    } else if (errorName.includes('Unauthorized') || errorName.includes('Auth')) {
      return ERROR_TYPES.AUTHENTICATION;
    } else if (errorName.includes('Forbidden') || errorName.includes('Permission')) {
      return ERROR_TYPES.AUTHORIZATION;
    } else if (errorName.includes('NotFound')) {
      return ERROR_TYPES.NOT_FOUND;
    }
    
    return ERROR_TYPES.INTERNAL;
  }

  /**
   * 记录异常详情
   */
  private logException(
    exception: any, 
    request: Request, 
    requestId: string, 
    statusCode: number
  ): void {
    const logLevel = statusCode >= 500 ? 'error' : 'warn';
    const errorName = exception.constructor?.name || 'UnknownError';
    const message = exception.message || 'Unknown error occurred';

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
        params: request.params,
      }),
    };

    if (logLevel === 'error') {
      this.logger.error(
        `[${requestId}] HTTP ${statusCode} - ${errorName}: ${message}`,
        exception.stack
      );
    } else {
      this.logger.warn(
        `[${requestId}] HTTP ${statusCode} - ${errorName}: ${message}`
      );
    }

    // 在开发环境记录详细的请求信息
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`[${requestId}] Request Details: ${JSON.stringify(logData, null, 2)}`);
    }
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
} 