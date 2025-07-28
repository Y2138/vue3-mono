import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  HttpException, 
  HttpStatus, 
  Logger 
} from '@nestjs/common';
import { Request, Response } from 'express';

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
    response.status(statusCode).json(errorResponse);
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
      ValidationError: HttpStatus.BAD_REQUEST,
      UnauthorizedException: HttpStatus.UNAUTHORIZED,
      ForbiddenException: HttpStatus.FORBIDDEN,
      NotFoundException: HttpStatus.NOT_FOUND,
      ConflictException: HttpStatus.CONFLICT,
      UnprocessableEntityException: HttpStatus.UNPROCESSABLE_ENTITY,
      BadRequestException: HttpStatus.BAD_REQUEST,
    };

    return statusMapping[errorName] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * 构建错误响应对象
   */
  private getErrorResponse(exception: any, request: Request, requestId: string): any {
    const statusCode = this.getStatusCode(exception);
    const timestamp = new Date().toISOString();

    // 基础错误响应
    const baseResponse = {
      success: false,
      statusCode,
      timestamp,
      path: request.url,
      method: request.method,
      requestId,
    };

    // 如果是 HttpException，获取详细错误信息
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        return {
          ...baseResponse,
          message: exceptionResponse,
          error: exception.constructor.name,
        };
      } else if (typeof exceptionResponse === 'object') {
        return {
          ...baseResponse,
          ...(exceptionResponse as object),
          error: exception.constructor.name,
        };
      }
    }

    // 处理验证错误
    if (exception.name === 'ValidationError' || exception.errors) {
      return {
        ...baseResponse,
        message: '请求参数验证失败',
        error: 'ValidationError',
        details: exception.errors || exception.details,
      };
    }

    // 处理其他类型的错误
    const message = exception.message || 'Internal server error';
    const error = exception.constructor?.name || 'InternalServerError';

    // 在生产环境隐藏敏感错误信息
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
      return {
        ...baseResponse,
        message: 'Internal server error',
        error: 'InternalServerError',
      };
    }

    return {
      ...baseResponse,
      message,
      error,
      // 在开发环境提供更多调试信息
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception.stack,
        details: exception.details,
      }),
    };
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
    return Math.random().toString(36).substring(2, 15);
  }
} 