import { HttpStatus } from '@nestjs/common';
import { ProtocolType } from '../middleware/protocol-detection.middleware';

/**
 * 统一响应状态码映射
 */
export const UnifiedStatusCode = {
  // 成功状态
  SUCCESS: 200,
  
  // 客户端错误 (4xx)
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  
  // 服务器错误 (5xx)
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  TIMEOUT: 504,
} as const;

/**
 * gRPC 状态码到 HTTP 状态码的映射
 */
export const GrpcToHttpStatusMap: Record<number, number> = {
  0: HttpStatus.OK,                    // OK
  1: HttpStatus.INTERNAL_SERVER_ERROR, // CANCELLED
  2: HttpStatus.INTERNAL_SERVER_ERROR, // UNKNOWN
  3: HttpStatus.BAD_REQUEST,           // INVALID_ARGUMENT
  4: HttpStatus.REQUEST_TIMEOUT,       // DEADLINE_EXCEEDED
  5: HttpStatus.NOT_FOUND,             // NOT_FOUND
  6: HttpStatus.CONFLICT,              // ALREADY_EXISTS
  7: HttpStatus.FORBIDDEN,             // PERMISSION_DENIED
  8: HttpStatus.TOO_MANY_REQUESTS,     // RESOURCE_EXHAUSTED
  9: HttpStatus.BAD_REQUEST,           // FAILED_PRECONDITION
  10: HttpStatus.CONFLICT,             // ABORTED
  11: HttpStatus.BAD_REQUEST,          // OUT_OF_RANGE
  12: HttpStatus.NOT_IMPLEMENTED,      // UNIMPLEMENTED
  13: HttpStatus.INTERNAL_SERVER_ERROR, // INTERNAL
  14: HttpStatus.SERVICE_UNAVAILABLE,  // UNAVAILABLE
  15: HttpStatus.INTERNAL_SERVER_ERROR, // DATA_LOSS
  16: HttpStatus.UNAUTHORIZED,         // UNAUTHENTICATED
};

/**
 * 统一响应接口
 */
export interface UnifiedResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data?: T;
  /** 错误详情（仅在失败时存在） */
  error?: {
    type: string;
    details?: any;
    stack?: string; // 仅开发环境
  };
  /** 元数据 */
  meta?: {
    protocol: ProtocolType;
    timestamp: string;
    requestId?: string;
    executionTime?: number;
  };
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T = any> extends UnifiedResponse<T[]> {
  /** 分页信息 */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 错误响应接口
 */
export interface ErrorResponse extends UnifiedResponse<null> {
  success: false;
  error: {
    type: string;
    details?: any;
    stack?: string;
    validation?: ValidationError[];
  };
}

/**
 * 验证错误详情
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

/**
 * 响应构建器选项
 */
export interface ResponseBuilderOptions {
  protocol?: ProtocolType;
  requestId?: string;
  executionTime?: number;
  includeStack?: boolean;
}

/**
 * 响应格式化配置
 */
export interface ResponseFormatterConfig {
  /** 是否在生产环境中包含错误堆栈 */
  includeStackInProduction: boolean;
  /** 是否记录响应时间 */
  includeExecutionTime: boolean;
  /** 是否包含协议信息 */
  includeProtocolInfo: boolean;
  /** 自定义消息映射 */
  customMessages?: Record<number, string>;
}

/**
 * 默认响应消息
 */
export const DefaultResponseMessages: Record<number, string> = {
  [UnifiedStatusCode.SUCCESS]: 'Success',
  [UnifiedStatusCode.BAD_REQUEST]: 'Bad Request',
  [UnifiedStatusCode.UNAUTHORIZED]: 'Unauthorized',
  [UnifiedStatusCode.FORBIDDEN]: 'Forbidden',
  [UnifiedStatusCode.NOT_FOUND]: 'Not Found',
  [UnifiedStatusCode.CONFLICT]: 'Conflict',
  [UnifiedStatusCode.VALIDATION_ERROR]: 'Validation Error',
  [UnifiedStatusCode.INTERNAL_ERROR]: 'Internal Server Error',
  [UnifiedStatusCode.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [UnifiedStatusCode.TIMEOUT]: 'Request Timeout',
};

/**
 * HTTP 方法到操作描述的映射
 */
export const HttpMethodMessages: Record<string, string> = {
  GET: 'Retrieved',
  POST: 'Created',
  PUT: 'Updated',
  PATCH: 'Updated',
  DELETE: 'Deleted',
};

/**
 * 响应类型枚举
 */
export enum ResponseType {
  SUCCESS = 'success',
  ERROR = 'error',
  PAGINATED = 'paginated',
  VALIDATION_ERROR = 'validation_error',
} 