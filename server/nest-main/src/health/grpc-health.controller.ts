import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  HealthCheckRequest,
  HealthCheckResponse,
  HealthCheckResponse_ServingStatus as ServingStatus,
  HealthController as IHealthController,
} from '../shared/health';
import { GrpcHealthService, ServiceStatus } from './grpc-health.service';

@Controller()
export class GrpcHealthController implements IHealthController {
  private readonly logger = new Logger(GrpcHealthController.name);

  constructor(private readonly grpcHealthService: GrpcHealthService) {}

  @GrpcMethod('Health', 'Check')
  check(request: HealthCheckRequest): HealthCheckResponse {
    this.logger.log(`Health check requested for service: ${request.service || 'server'}`);

    const serviceName = request.service || '';
    const serviceStatus = this.grpcHealthService.getServiceStatus(serviceName);

    if (!serviceStatus) {
      this.logger.warn(`Unknown service requested: ${serviceName}`);
      return {
        status: ServingStatus.SERVICE_UNKNOWN,
      };
    }

    this.logger.log(`Service ${serviceName} status: ${ServingStatus[serviceStatus.status]}`);
    
    return {
      status: serviceStatus.status,
    };
  }

  @GrpcStreamMethod('Health', 'Watch')
  watch(request: HealthCheckRequest): Observable<HealthCheckResponse> {
    this.logger.log(`Health watch requested for service: ${request.service || 'server'}`);
    const serviceName = request.service || '';
    return this.grpcHealthService.getStatusSubject(serviceName).asObservable();
  }

  /**
   * 获取所有服务状态
   */
  getAllServiceStatuses(): Map<string, ServiceStatus> {
    return this.grpcHealthService.getAllServiceStatuses();
  }
} 