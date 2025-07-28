import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { ResponseFormatter, defaultResponseFormatter } from './response-formatter';
import { ProtocolType, getProtocolType } from '../middleware/protocol-detection.middleware';

/**
 * 响应拦截器
 * 自动格式化所有出站响应，统一 gRPC 和 HTTP 响应格式
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private readonly formatter: ResponseFormatter = defaultResponseFormatter) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const contextType = context.getType();
    const requestId = this.generateRequestId();

    return next.handle().pipe(
      map(data => {
        const executionTime = Date.now() - startTime;
        return this.formatSuccessResponse(data, context, contextType, requestId, executionTime);
      }),
      catchError(error => {
        const executionTime = Date.now() - startTime;
        const formattedError = this.formatErrorResponse(error, context, contextType, requestId, executionTime);
        return throwError(() => formattedError);
      })
    );
  }

  /**
   * 格式化成功响应
   */
  private formatSuccessResponse(
    data: any,
    context: ExecutionContext,
    contextType: string,
    requestId: string,
    executionTime: number
  ): any {
    try {
      const protocol = this.getProtocolFromContext(context, contextType);
      const options = {
        protocol,
        requestId,
        executionTime,
      };

      // 如果数据已经是格式化的响应（有 success 和 code 字段），直接返回
      if (this.isAlreadyFormatted(data)) {
        return this.addMetadata(data, options);
      }

      // 检查是否是分页响应
      if (this.isPaginatedData(data)) {
        return this.formatter.paginated(
          data.data,
          data.pagination,
          data.message || this.getSuccessMessage(context, contextType),
          options
        );
      }

      // 常规成功响应
      return this.formatter.success(
        data,
        this.getSuccessMessage(context, contextType),
        options
      );
    } catch (error) {
      this.logger.error('Failed to format success response:', error);
      return data; // 格式化失败时返回原始数据
    }
  }

  /**
   * 格式化错误响应
   */
  private formatErrorResponse(
    error: any,
    context: ExecutionContext,
    contextType: string,
    requestId: string,
    executionTime: number
  ): any {
    try {
      const protocol = this.getProtocolFromContext(context, contextType);
      const options = {
        protocol,
        requestId,
        executionTime,
      };

      // 如果错误已经是格式化的响应，直接返回
      if (this.isAlreadyFormatted(error)) {
        return this.addMetadata(error, options);
      }

      // 记录错误
      this.logError(error, context, contextType, requestId);

      // 格式化错误响应
      return this.formatter.fromException(error, options);
    } catch (formatError) {
      this.logger.error('Failed to format error response:', formatError);
      
      // 格式化失败时返回基本错误响应
      return this.formatter.error(
        500,
        'Internal server error',
        error,
        { protocol: ProtocolType.UNKNOWN, requestId, executionTime }
      );
    }
  }

  /**
   * 从上下文获取协议类型
   */
  private getProtocolFromContext(context: ExecutionContext, contextType: string): ProtocolType {
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      return getProtocolType(request);
    } else if (contextType === 'rpc') {
      return ProtocolType.GRPC;
    }
    
    return ProtocolType.UNKNOWN;
  }

  /**
   * 获取成功消息
   */
  private getSuccessMessage(context: ExecutionContext, contextType: string): string {
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const method = request.method;
      
      switch (method) {
        case 'GET':
          return 'Data retrieved successfully';
        case 'POST':
          return 'Resource created successfully';
        case 'PUT':
        case 'PATCH':
          return 'Resource updated successfully';
        case 'DELETE':
          return 'Resource deleted successfully';
        default:
          return 'Operation completed successfully';
      }
    } else if (contextType === 'rpc') {
      const handler = context.getHandler();
      const methodName = handler?.name || 'unknown';
      return `gRPC ${methodName} completed successfully`;
    }

    return 'Operation completed successfully';
  }

  /**
   * 检查数据是否已经格式化
   */
  private isAlreadyFormatted(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           'success' in data && 
           'code' in data && 
           'message' in data;
  }

  /**
   * 检查是否是分页数据
   */
  private isPaginatedData(data: any): boolean {
    return data &&
           typeof data === 'object' &&
           'data' in data &&
           'pagination' in data &&
           Array.isArray(data.data);
  }

  /**
   * 添加元数据到已格式化的响应
   */
  private addMetadata(response: any, options: any): any {
    if (!response.meta) {
      response.meta = {};
    }

    Object.assign(response.meta, {
      protocol: options.protocol,
      timestamp: new Date().toISOString(),
      requestId: options.requestId,
      executionTime: options.executionTime,
    });

    return response;
  }

  /**
   * 记录错误
   */
  private logError(
    error: any,
    context: ExecutionContext,
    contextType: string,
    requestId: string
  ): void {
    const handler = context.getHandler();
    const className = context.getClass();
    const methodName = handler?.name || 'unknown';
    
    let contextInfo = '';
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      contextInfo = `${request.method} ${request.url}`;
    } else if (contextType === 'rpc') {
      contextInfo = `gRPC ${methodName}`;
    }

    this.logger.error(
      `[${requestId}] Error in ${className.name}.${methodName} (${contextInfo}): ${error.message}`,
      error.stack
    );
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 创建自定义响应拦截器
 */
export const createResponseInterceptor = (formatter?: ResponseFormatter): ResponseInterceptor => {
  return new ResponseInterceptor(formatter);
};

/**
 * 创建带配置的响应拦截器
 */
export const createResponseInterceptorWithConfig = (config: any): ResponseInterceptor => {
  const formatter = new ResponseFormatter(config);
  return new ResponseInterceptor(formatter);
}; 