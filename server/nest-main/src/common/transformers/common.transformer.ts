import { Timestamp, PaginationRequest, PaginationResponse, ResponseStatus } from '../../shared/common';

/**
 * 时间戳转换工具
 */
export const TimestampTransformer = {
  /**
   * 将 JavaScript Date 转换为 Protobuf Timestamp
   */
  toProtobuf(date: Date | string | null | undefined): Timestamp | undefined {
    if (!date) {
      return undefined;
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return {
      value: dateObj.toISOString(),
    };
  },

  /**
   * 将 Protobuf Timestamp 转换为 JavaScript Date
   */
  fromProtobuf(timestamp: Timestamp | null | undefined): Date | undefined {
    if (!timestamp || !timestamp.value) {
      return undefined;
    }
    
    return new Date(timestamp.value);
  },

  /**
   * 获取当前时间的 Protobuf Timestamp
   */
  now(): Timestamp {
    return this.toProtobuf(new Date())!;
  },
};

/**
 * 分页转换工具
 */
export const PaginationTransformer = {
  /**
   * 创建分页请求
   */
  createRequest(page = 1, pageSize = 10): PaginationRequest {
    return {
      page: Math.max(1, page),
      pageSize: Math.max(1, Math.min(100, pageSize)), // 限制每页最大100条
    };
  },

  /**
   * 创建分页响应
   */
  createResponse<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number
  ): PaginationResponse & { data: T[] } {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      page,
      pageSize,
      total,
      totalPages,
    };
  },

  /**
   * 计算数据库查询的偏移量
   */
  calculateOffset(page: number, pageSize: number): number {
    return (Math.max(1, page) - 1) * Math.max(1, pageSize);
  },
};

/**
 * 响应状态转换工具
 */
export const ResponseStatusTransformer = {
  /**
   * 创建成功响应状态
   */
  success(message = 'Success'): ResponseStatus {
    return {
      code: 0,
      message,
      success: true,
    };
  },

  /**
   * 创建错误响应状态
   */
  error(code: number, message: string): ResponseStatus {
    return {
      code,
      message,
      success: false,
    };
  },

  /**
   * 从异常创建响应状态
   */
  fromError(error: any): ResponseStatus {
    return {
      code: error.code || 500,
      message: error.message || 'Internal server error',
      success: false,
    };
  },
};

/**
 * 数组转换工具
 */
export const ArrayTransformer = {
  /**
   * 安全地转换数组，处理 null/undefined
   */
  toArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
  },

  /**
   * 将单个值转换为数组
   */
  fromSingle<T>(value: T | null | undefined): T[] {
    return value ? [value] : [];
  },

  /**
   * 过滤掉 null/undefined 值
   */
  filterNulls<T>(array: (T | null | undefined)[]): T[] {
    return array.filter((item): item is T => item !== null && item !== undefined);
  },
};

/**
 * 字符串转换工具
 */
export const StringTransformer = {
  /**
   * 安全地转换字符串，处理 null/undefined
   */
  toString(value: string | null | undefined, defaultValue = ''): string {
    return value || defaultValue;
  },

  /**
   * 转换为非空字符串，如果为空则返回 undefined
   */
  toNonEmptyString(value: string | null | undefined): string | undefined {
    return value && value.trim() ? value.trim() : undefined;
  },

  /**
   * 验证和清理手机号
   */
  cleanPhone(phone: string | null | undefined): string | undefined {
    if (!phone) return undefined;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 ? cleaned : undefined;
  },
};

/**
 * 数字转换工具
 */
export const NumberTransformer = {
  /**
   * 安全地转换为数字
   */
  toNumber(value: string | number | null | undefined, defaultValue = 0): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  },

  /**
   * 转换为正整数
   */
  toPositiveInt(value: string | number | null | undefined, defaultValue = 1): number {
    const num = this.toNumber(value, defaultValue);
    return Math.max(1, Math.floor(num));
  },
};

/**
 * 通用转换器导出
 */
export const CommonTransformers = {
  timestamp: TimestampTransformer,
  pagination: PaginationTransformer,
  responseStatus: ResponseStatusTransformer,
  array: ArrayTransformer,
  string: StringTransformer,
  number: NumberTransformer,
}; 