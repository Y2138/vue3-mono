import {
  ApiResponse,
  ApiPaginatedResponse,
  ApiErrorResponse,
  PaginationInfo,
  ErrorInfo,
  RESPONSE_CODES,
  ERROR_TYPES
} from './types';

/**
 * 响应构建器链
 * 支持链式调用构建响应
 */
export interface ResponseBuilderChain<T> {
  /**
   * 设置响应消息
   * @param msg 响应消息
   */
  message(msg: string): ResponseBuilderChain<T>;

  /**
   * 设置响应状态码
   * @param code 状态码
   */
  code(code: number): ResponseBuilderChain<T>;

  /**
   * 设置为用户友好的响应
   * 用于直接展示给用户的消息
   */
  userFriendly(): ResponseBuilderChain<T>;

  /**
   * 构建最终响应对象
   */
  build(): ApiResponse<T> | ApiPaginatedResponse<T> | ApiErrorResponse;
}

/**
 * 响应构建器
 * 提供链式调用API，用于构建各种类型的响应
 */
export class ResponseBuilder {
  /**
   * 创建成功响应构建器
   * @param data 响应数据
   */
  static success<T>(data: T): ResponseBuilderChain<T> {
    return new SuccessResponseBuilder<T>(data);
  }

  /**
   * 创建分页响应构建器
   * @param data 分页数据
   * @param pagination 分页信息
   */
  static paginated<T>(data: T[], pagination: PaginationInfo): ResponseBuilderChain<T[]> {
    return new PaginatedResponseBuilder<T>(data, pagination);
  }

  /**
   * 创建错误响应构建器
   * @param message 错误消息
   * @param code 错误代码，默认为400
   */
  static error(message: string, code = RESPONSE_CODES.BAD_REQUEST): ResponseBuilderChain<null> {
    return new ErrorResponseBuilder(message, code);
  }

  /**
   * 创建"未找到"错误响应构建器
   * @param resource 资源名称
   */
  static notFound(resource: string): ResponseBuilderChain<null> {
    const message = `${resource}不存在`;
    return new ErrorResponseBuilder(message, RESPONSE_CODES.NOT_FOUND)
      .withErrorType(ERROR_TYPES.NOT_FOUND)
      .withErrorDetails({ resource });
  }

  /**
   * 创建验证错误响应构建器
   * @param message 错误消息
   * @param details 错误详情
   */
  static validationError(message = '请求参数验证失败', details?: any): ResponseBuilderChain<null> {
    return new ErrorResponseBuilder(message, RESPONSE_CODES.VALIDATION_ERROR)
      .withErrorType(ERROR_TYPES.VALIDATION)
      .withErrorDetails(details);
  }

  /**
   * 创建业务错误响应构建器
   * @param message 错误消息
   * @param code 错误代码，默认为400
   */
  static businessError(message: string, code = RESPONSE_CODES.BAD_REQUEST): ResponseBuilderChain<null> {
    return new ErrorResponseBuilder(message, code)
      .withErrorType(ERROR_TYPES.BUSINESS);
  }

  /**
   * 创建服务器错误响应构建器
   * @param message 错误消息
   * @param error 原始错误
   */
  static serverError(message = '服务器内部错误', error?: any): ResponseBuilderChain<null> {
    return new ErrorResponseBuilder(message, RESPONSE_CODES.INTERNAL_ERROR)
      .withErrorType(ERROR_TYPES.INTERNAL)
      .withErrorDetails(error)
      .withErrorStack(process.env.NODE_ENV !== 'production' ? error?.stack : undefined);
  }
}

/**
 * 基础响应构建器
 */
abstract class BaseResponseBuilder<T> implements ResponseBuilderChain<T> {
  protected _message: string;
  protected _code: number;
  protected _isUserFriendly: boolean = false;

  constructor(message: string, code: number) {
    this._message = message;
    this._code = code;
  }

  message(msg: string): ResponseBuilderChain<T> {
    this._message = msg;
    return this;
  }

  code(code: number): ResponseBuilderChain<T> {
    this._code = code;
    return this;
  }

  userFriendly(): ResponseBuilderChain<T> {
    this._isUserFriendly = true;
    return this;
  }

  abstract build(): ApiResponse<T> | ApiPaginatedResponse<T> | ApiErrorResponse;
}

/**
 * 成功响应构建器
 */
class SuccessResponseBuilder<T> extends BaseResponseBuilder<T> {
  private readonly _data: T;

  constructor(data: T) {
    super('操作成功', RESPONSE_CODES.SUCCESS);
    this._data = data;
  }

  build(): ApiResponse<T> {
    return {
      success: true,
      code: this._code,
      message: this._message,
      data: this._data
    };
  }
}

/**
 * 分页响应构建器
 */
class PaginatedResponseBuilder<T> extends BaseResponseBuilder<T[]> {
  private readonly _data: T[];
  private readonly _pagination: PaginationInfo;

  constructor(data: T[], pagination: PaginationInfo) {
    super('查询成功', RESPONSE_CODES.SUCCESS);
    this._data = data;
    this._pagination = pagination;
  }

  build(): ApiPaginatedResponse<T> {
    return {
      success: true,
      code: this._code,
      message: this._message,
      data: this._data,
      pagination: this._pagination
    };
  }
}

/**
 * 错误响应构建器
 */
class ErrorResponseBuilder extends BaseResponseBuilder<null> {
  private _error: ErrorInfo = {
    type: ERROR_TYPES.BUSINESS
  };

  constructor(message: string, code: number) {
    super(message, code);
  }

  /**
   * 设置错误类型
   * @param type 错误类型
   */
  withErrorType(type: string): ErrorResponseBuilder {
    this._error.type = type;
    return this;
  }

  /**
   * 设置错误详情
   * @param details 错误详情
   */
  withErrorDetails(details: any): ErrorResponseBuilder {
    this._error.details = details;
    return this;
  }

  /**
   * 设置错误堆栈
   * @param stack 错误堆栈
   */
  withErrorStack(stack?: string): ErrorResponseBuilder {
    this._error.stack = stack;
    return this;
  }

  build(): ApiErrorResponse {
    return {
      success: false,
      code: this._code,
      message: this._message,
      data: null,
      error: this._error
    };
  }
}
