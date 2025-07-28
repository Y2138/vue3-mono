import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import { type Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const contextType = context.getType();
    let requestInfo = '';

    if (contextType === 'http') {
      // HTTP REST请求
      const request = context.switchToHttp().getRequest();
      requestInfo = `HTTP ${request.method} ${request.url}`;
      
      if (request?.headers?.authorization) {
        this.logger.log(`${requestInfo} - Auth: ${request.headers.authorization.substring(0, 20)}...`);
      } else {
        this.logger.log(`${requestInfo}`);
      }
    } else if (contextType === 'rpc') {
      // gRPC请求
      const rpcContext = context.switchToRpc();
      const handler = context.getHandler();
      const data = rpcContext.getData();
      
      requestInfo = `gRPC ${handler.name}`;
      this.logger.log(`${requestInfo} - Data: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      requestInfo = `Unknown ${contextType}`;
      this.logger.warn(`Unknown request type: ${contextType}`);
    }

    return next
      .handle()
      .pipe(
        tap((response) => {
          const duration = Date.now() - now;
          this.logger.log(`${requestInfo} - Response time: ${duration}ms`);
          
          // 在开发环境下记录响应数据
          if (process.env.NODE_ENV === 'development' && process.env.ENABLE_REQUEST_LOGGING === 'true') {
            const responseData = typeof response === 'object' ? JSON.stringify(response).substring(0, 200) : String(response);
            this.logger.debug(`Response: ${responseData}...`);
          }
        }),
      );
  }
} 