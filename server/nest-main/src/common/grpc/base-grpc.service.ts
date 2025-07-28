import { Logger } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { extractAuthToken, extractUserInfo, extractRequestId } from './grpc-metadata';
import { mapNestExceptionToGrpc, GrpcException } from './grpc-exceptions';

/**
 * gRPC 服务基类
 * 提供统一的错误处理、日志记录和性能监控
 */
export abstract class BaseGrpcService {
  protected readonly logger: Logger;

  constructor(serviceName: string) {
    this.logger = new Logger(serviceName);
  }

  /**
   * 包装 gRPC 方法调用，提供统一的错误处理和日志记录
   */
  protected async executeGrpcMethod<T>(
    methodName: string,
    metadata: Metadata,
    handler: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = extractRequestId(metadata) || this.generateRequestId();
    const userInfo = extractUserInfo(metadata);
    
    // 记录请求开始
    this.logger.log(
      `[${requestId}] gRPC ${methodName} started - User: ${userInfo.userPhone || 'anonymous'}`
    );

    try {
      // 执行业务逻辑
      const result = await handler();
      
      // 记录成功响应
      const duration = Date.now() - startTime;
      this.logger.log(
        `[${requestId}] gRPC ${methodName} completed - Duration: ${duration}ms`
      );

      // 在开发环境记录响应详情
      if (process.env.NODE_ENV === 'development' && process.env.ENABLE_REQUEST_LOGGING === 'true') {
        this.logger.debug(
          `[${requestId}] Response: ${JSON.stringify(result).substring(0, 200)}...`
        );
      }

      return result;
    } catch (error) {
      // 记录错误
      const duration = Date.now() - startTime;
      this.logger.error(
        `[${requestId}] gRPC ${methodName} failed - Duration: ${duration}ms - Error: ${error.message}`,
        error.stack
      );

      // 转换并重新抛出异常
      throw this.handleGrpcError(error);
    }
  }

  /**
   * 处理 gRPC 错误
   */
  protected handleGrpcError(error: any): RpcException {
    // 如果已经是 RpcException，直接返回
    if (error instanceof RpcException) {
      return error;
    }

    // 如果是 GrpcException，转换为 RpcException
    if (error instanceof GrpcException) {
      return new RpcException({
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    // 将 NestJS 异常转换为 gRPC 异常
    const grpcError = mapNestExceptionToGrpc(error);
    return new RpcException(grpcError);
  }

  /**
   * 验证必需参数
   */
  protected validateRequired<T>(value: T | null | undefined, fieldName: string): T {
    if (value === null || value === undefined) {
      throw new GrpcException(
        3, // INVALID_ARGUMENT
        `Missing required field: ${fieldName}`
      );
    }
    return value;
  }

  /**
   * 验证字符串参数
   */
  protected validateString(value: string | null | undefined, fieldName: string, minLength = 1): string {
    const validValue = this.validateRequired(value, fieldName);
    if (typeof validValue !== 'string' || validValue.length < minLength) {
      throw new GrpcException(
        3, // INVALID_ARGUMENT
        `Invalid ${fieldName}: must be a string with at least ${minLength} character(s)`
      );
    }
    return validValue;
  }

  /**
   * 验证手机号格式
   */
  protected validatePhone(phone: string | null | undefined): string {
    const validPhone = this.validateString(phone, 'phone', 11);
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      throw new GrpcException(
        3, // INVALID_ARGUMENT
        'Invalid phone number format'
      );
    }
    return validPhone;
  }

  /**
   * 记录性能指标
   */
  protected recordMetric(methodName: string, duration: number, success: boolean): void {
    // 这里可以集成监控系统（如 Prometheus）
    if (process.env.ENABLE_METRICS === 'true') {
      this.logger.log(
        `Metric - Method: ${methodName}, Duration: ${duration}ms, Success: ${success}`
      );
    }
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从元数据中提取认证用户
   */
  protected extractAuthUser(metadata: Metadata): { userPhone: string; token: string } {
    const token = extractAuthToken(metadata);
    if (!token) {
      throw new GrpcException(
        16, // UNAUTHENTICATED
        'Missing authentication token'
      );
    }

    const userInfo = extractUserInfo(metadata);
    if (!userInfo.userPhone) {
      throw new GrpcException(
        16, // UNAUTHENTICATED
        'Missing user information in metadata'
      );
    }

    return {
      userPhone: userInfo.userPhone,
      token,
    };
  }

  /**
   * 检查用户权限
   */
  protected checkPermission(userPermissions: string[], requiredPermission: string): void {
    if (!userPermissions.includes(requiredPermission)) {
      throw new GrpcException(
        7, // PERMISSION_DENIED
        `Permission denied: required '${requiredPermission}'`
      );
    }
  }
} 