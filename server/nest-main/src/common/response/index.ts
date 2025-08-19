// 导出响应类型定义
export * from './types';

// 响应拦截器导出
export { ResponseInterceptor } from '../interceptors/response-interceptor';

// 基础控制器导出
export { BaseController } from '../controllers/base.controller';

// 响应构建器导出
export { ResponseBuilder, type ResponseBuilderChain } from './response-builder';

// 响应模块聚合对象
import { ResponseInterceptor } from '../interceptors/response-interceptor';
import { BaseController } from '../controllers/base.controller';
import { ResponseBuilder } from './response-builder';

export const ResponseModule = {
  ResponseInterceptor,
  BaseController,
  ResponseBuilder,
}; 