import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/**
 * 响应拦截器
 * 
 * 仅负责日志记录和性能监控，不处理响应格式化
 * 成功响应的格式化由 BaseController 负责
 * 异常处理由异常过滤器负责
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const contextType = context.getType();
    const handler = context.getHandler();
    const methodName = handler?.name || 'unknown';

    // 记录请求开始
    let requestInfo = '';
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();
      requestInfo = `${request.method} ${request.url}`;
      this.logger.log(`开始处理请求: ${requestInfo}`);
    } else if (contextType === 'rpc') {
      requestInfo = `gRPC ${methodName}`;
      this.logger.log(`开始处理 gRPC 调用: ${requestInfo}`);
    }

    // 直接处理响应，不进行格式化，只记录日志和执行时间
    return next.handle().pipe(
      tap({
        next: (_data) => {
          const executionTime = Date.now() - startTime;
          this.logger.log(`请求处理完成: ${requestInfo}, 耗时: ${executionTime}ms`);
        }
      })
    );
  }
}
