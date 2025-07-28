// 响应类型定义导出
export {
  UnifiedStatusCode,
  GrpcToHttpStatusMap,
  DefaultResponseMessages,
  HttpMethodMessages,
  ResponseType,
  type UnifiedResponse,
  type PaginatedResponse,
  type ErrorResponse,
  type ValidationError,
  type ResponseBuilderOptions,
  type ResponseFormatterConfig,
} from './response-types';

// 响应格式化器导出
export {
  ResponseFormatter,
  createResponseFormatter,
  defaultResponseFormatter,
} from './response-formatter';

// 响应拦截器导出
export {
  ResponseInterceptor,
  createResponseInterceptor,
  createResponseInterceptorWithConfig,
} from './response-interceptor';

// 响应模块聚合对象
import { 
  ResponseFormatter, 
  defaultResponseFormatter,
  createResponseFormatter 
} from './response-formatter';
import { 
  ResponseInterceptor, 
  createResponseInterceptor 
} from './response-interceptor';

export const ResponseModule = {
  Formatter: ResponseFormatter,
  Interceptor: ResponseInterceptor,
  createFormatter: createResponseFormatter,
  createInterceptor: createResponseInterceptor,
  defaultFormatter: defaultResponseFormatter,
}; 