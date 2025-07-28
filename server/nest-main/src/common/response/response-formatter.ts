import { Logger } from '@nestjs/common';
import { 
  UnifiedResponse, 
  PaginatedResponse, 
  ErrorResponse,
  UnifiedStatusCode,
  DefaultResponseMessages,
  ResponseBuilderOptions,
  ResponseFormatterConfig,
  ValidationError,
  GrpcToHttpStatusMap
} from './response-types';
import { ProtocolType } from '../middleware/protocol-detection.middleware';

/**
 * 响应格式化器
 * 统一处理 gRPC 和 HTTP 的响应格式
 */
export class ResponseFormatter {
  private readonly logger = new Logger(ResponseFormatter.name);
  private readonly config: ResponseFormatterConfig;

  constructor(config?: Partial<ResponseFormatterConfig>) {
    this.config = {
      includeStackInProduction: false,
      includeExecutionTime: true,
      includeProtocolInfo: true,
      ...config,
    };
  }

  /**
   * 创建成功响应
   */
  success<T>(
    data: T,
    message?: string,
    options?: ResponseBuilderOptions
  ): UnifiedResponse<T> {
    const finalMessage = message || this.getDefaultMessage(UnifiedStatusCode.SUCCESS, options);
    
    return {
      success: true,
      code: UnifiedStatusCode.SUCCESS,
      message: finalMessage,
      data,
      meta: this.buildMeta(options),
    };
  }

  /**
   * 创建分页响应
   */
  paginated<T>(
    data: T[],
    pagination: {
      page: number;
      pageSize: number;
      total: number;
    },
    message?: string,
    options?: ResponseBuilderOptions
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const finalMessage = message || `Retrieved ${data.length} items`;

    return {
      success: true,
      code: UnifiedStatusCode.SUCCESS,
      message: finalMessage,
      data,
      pagination: {
        ...pagination,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
      meta: this.buildMeta(options),
    };
  }

  /**
   * 创建错误响应
   */
  error(
    code: number,
    message: string,
    error?: any,
    options?: ResponseBuilderOptions
  ): ErrorResponse {
    const errorType = this.getErrorType(error);
    const shouldIncludeStack = this.shouldIncludeStack();

    return {
      success: false,
      code,
      message,
      data: null,
      error: {
        type: errorType,
        details: this.sanitizeErrorDetails(error),
        stack: shouldIncludeStack ? error?.stack : undefined,
        validation: this.extractValidationErrors(error),
      },
      meta: this.buildMeta(options),
    };
  }

  /**
   * 从异常创建错误响应
   */
  fromException(
    exception: any,
    options?: ResponseBuilderOptions
  ): ErrorResponse {
    const code = this.extractErrorCode(exception);
    const message = exception.message || this.getDefaultMessage(code, options);
    
    return this.error(code, message, exception, options);
  }

  /**
   * 创建验证错误响应
   */
  validationError(
    validationErrors: ValidationError[],
    message?: string,
    options?: ResponseBuilderOptions
  ): ErrorResponse {
    const finalMessage = message || 'Validation failed';
    
    return {
      success: false,
      code: UnifiedStatusCode.VALIDATION_ERROR,
      message: finalMessage,
      data: null,
      error: {
        type: 'ValidationError',
        validation: validationErrors,
      },
      meta: this.buildMeta(options),
    };
  }

  /**
   * 转换 gRPC 响应为 HTTP 响应
   */
  grpcToHttp<T>(grpcResponse: any, options?: ResponseBuilderOptions): UnifiedResponse<T> | ErrorResponse {
    if (grpcResponse.success === false || grpcResponse.error) {
      const httpStatusCode = GrpcToHttpStatusMap[grpcResponse.code] || 500;
      return this.error(httpStatusCode, grpcResponse.message, grpcResponse.error, options);
    }

    return this.success(grpcResponse.data, grpcResponse.message, options);
  }

  /**
   * 转换 HTTP 响应为 gRPC 响应
   */
  httpToGrpc<T>(httpResponse: UnifiedResponse<T>, options?: ResponseBuilderOptions): any {
    // gRPC 使用自己的状态码系统
    const grpcCode = this.httpToGrpcStatus(httpResponse.code);
    
    return {
      ...httpResponse,
      code: grpcCode,
      meta: this.buildMeta({ ...options, protocol: ProtocolType.GRPC }),
    };
  }

  /**
   * 构建响应元数据
   */
  private buildMeta(options?: ResponseBuilderOptions) {
    if (!this.config.includeProtocolInfo && !this.config.includeExecutionTime) {
      return undefined;
    }

    const meta: any = {};

    if (this.config.includeProtocolInfo && options?.protocol) {
      meta.protocol = options.protocol;
    }

    meta.timestamp = new Date().toISOString();

    if (options?.requestId) {
      meta.requestId = options.requestId;
    }

    if (this.config.includeExecutionTime && options?.executionTime !== undefined) {
      meta.executionTime = options.executionTime;
    }

    return Object.keys(meta).length > 0 ? meta : undefined;
  }

  /**
   * 获取默认消息
   */
  private getDefaultMessage(code: number, options?: ResponseBuilderOptions): string {
    // 自定义消息优先
    if (this.config.customMessages?.[code]) {
      return this.config.customMessages[code];
    }

    // HTTP 方法相关消息
    if (code === UnifiedStatusCode.SUCCESS && options?.protocol === ProtocolType.HTTP) {
      // 这里可以根据 HTTP 方法生成更具体的消息
      // 需要从 options 或其他地方获取 HTTP 方法
    }

    // 默认消息
    return DefaultResponseMessages[code] || 'Unknown status';
  }

  /**
   * 提取错误代码
   */
  private extractErrorCode(exception: any): number {
    if (exception.status) {
      return exception.status;
    }

    if (exception.code) {
      return exception.code;
    }

    // 根据异常类型推断错误代码
    const exceptionName = exception.constructor?.name;
    switch (exceptionName) {
      case 'BadRequestException':
        return UnifiedStatusCode.BAD_REQUEST;
      case 'UnauthorizedException':
        return UnifiedStatusCode.UNAUTHORIZED;
      case 'ForbiddenException':
        return UnifiedStatusCode.FORBIDDEN;
      case 'NotFoundException':
        return UnifiedStatusCode.NOT_FOUND;
      case 'ConflictException':
        return UnifiedStatusCode.CONFLICT;
      case 'ValidationException':
        return UnifiedStatusCode.VALIDATION_ERROR;
      default:
        return UnifiedStatusCode.INTERNAL_ERROR;
    }
  }

  /**
   * 获取错误类型
   */
  private getErrorType(error: any): string {
    if (error?.constructor?.name) {
      return error.constructor.name;
    }
    
    if (typeof error === 'string') {
      return 'StringError';
    }

    return 'UnknownError';
  }

  /**
   * 是否应该包含错误堆栈
   */
  private shouldIncludeStack(): boolean {
    if (process.env.NODE_ENV === 'production') {
      return this.config.includeStackInProduction;
    }
    return true;
  }

  /**
   * 清理错误详情
   */
  private sanitizeErrorDetails(error: any): any {
    if (!error) return undefined;

    // 移除敏感信息
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    
    if (typeof error === 'object') {
      const sanitized = { ...error };
      
      sensitiveKeys.forEach(key => {
        if (sanitized[key]) {
          sanitized[key] = '[REDACTED]';
        }
      });

      // 移除循环引用
      try {
        JSON.stringify(sanitized);
        return sanitized;
      } catch {
        return { message: error.message || 'Error details unavailable due to circular reference' };
      }
    }

    return error;
  }

  /**
   * 提取验证错误
   */
  private extractValidationErrors(error: any): ValidationError[] | undefined {
    // 处理 class-validator 错误
    if (error?.response?.message && Array.isArray(error.response.message)) {
      return error.response.message.map((msg: any) => ({
        field: msg.property || 'unknown',
        message: Object.values(msg.constraints || {}).join(', ') || msg.message || msg,
        value: msg.value,
        constraint: Object.keys(msg.constraints || {})[0],
      }));
    }

    // 处理其他验证错误格式
    if (error?.validationErrors && Array.isArray(error.validationErrors)) {
      return error.validationErrors;
    }

    return undefined;
  }

  /**
   * HTTP 状态码转 gRPC 状态码
   */
  private httpToGrpcStatus(httpCode: number): number {
    // 反向映射 HTTP 状态码到 gRPC 状态码
    const reverseMap: Record<number, number> = {
      200: 0,  // OK
      400: 3,  // INVALID_ARGUMENT
      401: 16, // UNAUTHENTICATED
      403: 7,  // PERMISSION_DENIED
      404: 5,  // NOT_FOUND
      409: 6,  // ALREADY_EXISTS
      422: 3,  // INVALID_ARGUMENT
      429: 8,  // RESOURCE_EXHAUSTED
      500: 13, // INTERNAL
      501: 12, // UNIMPLEMENTED
      503: 14, // UNAVAILABLE
      504: 4,  // DEADLINE_EXCEEDED
    };

    return reverseMap[httpCode] || 13; // 默认为 INTERNAL
  }
}

/**
 * 创建默认的响应格式化器实例
 */
export const createResponseFormatter = (config?: Partial<ResponseFormatterConfig>): ResponseFormatter => {
  return new ResponseFormatter(config);
};

/**
 * 默认响应格式化器实例
 */
export const defaultResponseFormatter = new ResponseFormatter(); 