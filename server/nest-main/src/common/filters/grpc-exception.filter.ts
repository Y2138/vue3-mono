import { Catch, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { GrpcException, mapNestExceptionToGrpc } from '../grpc/grpc-exceptions';

/**
 * gRPC 异常过滤器
 * 统一处理 gRPC 请求中的异常，转换为合适的 gRPC 错误格式
 */
@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const contextType = host.getType<'rpc'>();
    
    // 确保只处理 gRPC 请求
    if (contextType !== 'rpc') {
      return throwError(() => exception);
    }

    const rpcContext = host.switchToRpc();
    const data = rpcContext.getData();
    
    // 生成请求 ID 用于日志追踪
    const requestId = this.generateRequestId();
    
    // 记录异常详情
    this.logException(exception, requestId, data);

    // 转换异常为 gRPC 错误格式
    const grpcError = this.convertToGrpcError(exception);
    
    // 记录转换后的错误响应
    this.logger.warn(
      `[${requestId}] gRPC Error Response - Code: ${grpcError.code}, Message: ${grpcError.message}`
    );

    // 返回 RpcException
    return throwError(() => new RpcException(grpcError));
  }

  /**
   * 记录异常详情
   */
  private logException(exception: any, requestId: string, data: any): void {
    const errorInfo = {
      name: exception.constructor?.name || 'UnknownError',
      message: exception.message || 'Unknown error occurred',
      stack: exception.stack,
      data: process.env.NODE_ENV === 'development' ? data : undefined,
    };

    this.logger.error(
      `[${requestId}] gRPC Exception - ${errorInfo.name}: ${errorInfo.message}`,
      errorInfo.stack
    );

    // 在开发环境记录请求数据
    if (process.env.NODE_ENV === 'development' && data) {
      this.logger.debug(`[${requestId}] Request Data: ${JSON.stringify(data)}`);
    }
  }

  /**
   * 转换异常为 gRPC 错误格式
   */
  private convertToGrpcError(exception: any): any {
    // 如果已经是 RpcException，提取其错误信息
    if (exception instanceof RpcException) {
      const error = exception.getError();
      return {
        code: typeof error === 'object' && error && 'code' in error ? (error as any).code || status.INTERNAL : status.INTERNAL,
        message: typeof error === 'string' ? error : (typeof error === 'object' && error && 'message' in error ? (error as any).message : 'Internal server error'),
        details: typeof error === 'object' && error && 'details' in error ? (error as any).details : undefined,
      };
    }

    // 如果是 GrpcException，直接转换
    if (exception instanceof GrpcException) {
      return {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    // 使用映射函数处理 NestJS 异常
    const mappedError = mapNestExceptionToGrpc(exception);
    
    // 增强错误信息（在开发环境）
    if (process.env.NODE_ENV === 'development') {
      mappedError.details = {
        ...mappedError.details,
        originalError: exception.constructor?.name,
        timestamp: new Date().toISOString(),
      };
    }

    return mappedError;
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 