import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    let request;
    const contextType = context.getType();

    if (contextType === 'http') {
      // REST请求
      request = context.switchToHttp().getRequest();
      this.logger.log(`REST Request ${request.method} ${request.url}`);
    } else {
      // 尝试处理为GraphQL请求
      try {
        const gqlContext = GqlExecutionContext.create(context);
        const info = gqlContext.getInfo();
        request = gqlContext.getContext().req;

        if (info && info.fieldName) {
          this.logger.log(`GraphQL Request ${info.fieldName}`);
          
          if (request?.headers?.authorization) {
            this.logger.log(`With Auth: ${request.headers.authorization.substring(0, 20)}...`);
          }
        }
      } catch (error) {
        this.logger.warn(`Unknown request type: ${contextType}`);
      }
    }

    return next
      .handle()
      .pipe(
        tap(data => {
          const duration = Date.now() - now;
          if (contextType === 'http') {
            this.logger.log(`Response time: ${duration}ms`);
          } else {
            try {
              const gqlContext = GqlExecutionContext.create(context);
              const info = gqlContext.getInfo();
              if (info && info.fieldName) {
                this.logger.log(`GraphQL ${info.fieldName} - Response time: ${duration}ms`);
              }
            } catch (error) {
              this.logger.log(`Response time: ${duration}ms`);
            }
          }
        }),
      );
  }
} 