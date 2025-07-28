import { status } from '@grpc/grpc-js';

/**
 * gRPC 状态码映射
 * 将常见的 HTTP 状态码和异常类型映射为 gRPC 状态码
 */
export const GrpcStatusMapping = {
  // 成功
  OK: status.OK,
  
  // 客户端错误
  BAD_REQUEST: status.INVALID_ARGUMENT,
  UNAUTHORIZED: status.UNAUTHENTICATED, 
  FORBIDDEN: status.PERMISSION_DENIED,
  NOT_FOUND: status.NOT_FOUND,
  CONFLICT: status.ALREADY_EXISTS,
  UNPROCESSABLE_ENTITY: status.INVALID_ARGUMENT,
  
  // 服务器错误
  INTERNAL_SERVER_ERROR: status.INTERNAL,
  SERVICE_UNAVAILABLE: status.UNAVAILABLE,
  TIMEOUT: status.DEADLINE_EXCEEDED,
  
  // 特定业务错误
  VALIDATION_ERROR: status.INVALID_ARGUMENT,
  RATE_LIMIT: status.RESOURCE_EXHAUSTED,
} as const;

/**
 * NestJS 异常名称到 gRPC 状态码的映射
 */
export const ExceptionToGrpcStatus: Record<string, number> = {
  BadRequestException: GrpcStatusMapping.BAD_REQUEST,
  UnauthorizedException: GrpcStatusMapping.UNAUTHORIZED,
  ForbiddenException: GrpcStatusMapping.FORBIDDEN,
  NotFoundException: GrpcStatusMapping.NOT_FOUND,
  ConflictException: GrpcStatusMapping.CONFLICT,
  UnprocessableEntityException: GrpcStatusMapping.UNPROCESSABLE_ENTITY,
  InternalServerErrorException: GrpcStatusMapping.INTERNAL_SERVER_ERROR,
  ServiceUnavailableException: GrpcStatusMapping.SERVICE_UNAVAILABLE,
  RequestTimeoutException: GrpcStatusMapping.TIMEOUT,
};

/**
 * gRPC 错误响应接口
 */
export interface GrpcErrorResponse {
  code: number;
  message: string;
  details?: Record<string, any>;
}

/**
 * 将 NestJS 异常转换为 gRPC 错误响应
 */
export function mapNestExceptionToGrpc(error: any): GrpcErrorResponse {
  const errorName = error.constructor.name;
  const statusCode = ExceptionToGrpcStatus[errorName] || GrpcStatusMapping.INTERNAL_SERVER_ERROR;
  
  return {
    code: statusCode,
    message: error.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? {
      stack: error.stack,
      type: errorName,
    } : undefined,
  };
}

/**
 * 创建标准化的 gRPC 异常
 */
export class GrpcException extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'GrpcException';
  }
} 