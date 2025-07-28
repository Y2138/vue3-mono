import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MonitoringService, RequestEvent } from '../health/monitoring.service';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MonitoringInterceptor.name);

  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const requestInfo = this.extractRequestInfo(context);

    this.logger.debug(`Starting ${requestInfo.protocol} request: ${requestInfo.method}`);

    return next.handle().pipe(
      tap(() => {
        // 请求成功
        const endTime = Date.now();
        const event: RequestEvent = {
          ...requestInfo,
          endTime,
          success: true,
          responseTime: endTime - startTime,
        };

        this.monitoringService.recordRequest(event);
        this.logger.debug(`Completed ${requestInfo.protocol} request: ${requestInfo.method} (${event.responseTime}ms)`);
      }),
      catchError((error) => {
        // 请求失败
        const endTime = Date.now();
        const event: RequestEvent = {
          ...requestInfo,
          endTime,
          success: false,
          error: error.message || 'Unknown error',
          responseTime: endTime - startTime,
        };

        this.monitoringService.recordRequest(event);
        this.logger.error(`Failed ${requestInfo.protocol} request: ${requestInfo.method} (${event.responseTime}ms) - ${error.message}`);

        return throwError(() => error);
      }),
    );
  }

  /**
   * 从执行上下文中提取请求信息
   */
  private extractRequestInfo(context: ExecutionContext): Omit<RequestEvent, 'endTime' | 'success' | 'responseTime'> {
    const contextType = context.getType();
    const startTime = Date.now();

    if (contextType === 'http') {
      return this.extractHttpRequestInfo(context, startTime);
    } else if (contextType === 'rpc') {
      return this.extractGrpcRequestInfo(context, startTime);
    } else {
      return {
        method: 'Unknown',
        protocol: 'http',
        startTime,
      };
    }
  }

  /**
   * 提取HTTP请求信息
   */
  private extractHttpRequestInfo(context: ExecutionContext, startTime: number): Omit<RequestEvent, 'endTime' | 'success' | 'responseTime'> {
    const request = context.switchToHttp().getRequest();
    const method = `${request.method} ${request.url}`;

    return {
      method,
      protocol: 'http',
      startTime,
    };
  }

  /**
   * 提取gRPC请求信息
   */
  private extractGrpcRequestInfo(context: ExecutionContext, startTime: number): Omit<RequestEvent, 'endTime' | 'success' | 'responseTime'> {
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    const method = `${className}.${methodName}`;

    return {
      method,
      protocol: 'grpc',
      startTime,
    };
  }
} 