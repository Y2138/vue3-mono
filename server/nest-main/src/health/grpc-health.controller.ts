import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable, BehaviorSubject } from 'rxjs';
import {
  HealthCheckRequest,
  HealthCheckResponse,
  HealthCheckResponse_ServingStatus as ServingStatus,
  HealthController as IHealthController,
} from '../shared/health';

interface ServiceStatus {
  status: ServingStatus;
  lastCheck: Date;
  error?: string;
}

@Controller()
export class GrpcHealthController implements IHealthController {
  private readonly logger = new Logger(GrpcHealthController.name);
  private readonly serviceStatuses = new Map<string, ServiceStatus>();
  private readonly statusSubjects = new Map<string, BehaviorSubject<HealthCheckResponse>>();

  constructor() {
    // 初始化默认服务状态
    this.setServiceStatus('', ServingStatus.SERVING); // 整个服务器状态
    this.setServiceStatus('UserService', ServingStatus.SERVING);
    this.setServiceStatus('PermissionService', ServingStatus.SERVING);
    this.setServiceStatus('RoleService', ServingStatus.SERVING);
  }

  @GrpcMethod('Health', 'Check')
  check(request: HealthCheckRequest): HealthCheckResponse {
    this.logger.log(`Health check requested for service: ${request.service || 'server'}`);

    const serviceName = request.service || '';
    const serviceStatus = this.serviceStatuses.get(serviceName);

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
    
    // 获取或创建该服务的状态主题
    let subject = this.statusSubjects.get(serviceName);
    if (!subject) {
      const serviceStatus = this.serviceStatuses.get(serviceName);
      const initialStatus = serviceStatus ? serviceStatus.status : ServingStatus.SERVICE_UNKNOWN;
      
      subject = new BehaviorSubject<HealthCheckResponse>({
        status: initialStatus,
      });
      this.statusSubjects.set(serviceName, subject);
    }

    return subject.asObservable();
  }

  /**
   * 设置服务状态
   */
  setServiceStatus(serviceName: string, status: ServingStatus, error?: string): void {
    const now = new Date();
    const serviceStatus: ServiceStatus = {
      status,
      lastCheck: now,
      error,
    };

    this.serviceStatuses.set(serviceName, serviceStatus);
    
    // 通知所有监听者
    const subject = this.statusSubjects.get(serviceName);
    if (subject) {
      subject.next({ status });
    }

    this.logger.log(`Service ${serviceName} status updated to ${ServingStatus[status]}`);
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.serviceStatuses.get(serviceName);
  }

  /**
   * 获取所有服务状态
   */
  getAllServiceStatuses(): Map<string, ServiceStatus> {
    return new Map(this.serviceStatuses);
  }

  /**
   * 检查数据库连接状态
   */
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // 这里应该实现实际的数据库连接检查
      // 例如执行一个简单的查询
      return true;
    } catch (error) {
      this.logger.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * 检查外部依赖服务
   */
  async checkExternalServices(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    // 检查数据库
    results.database = await this.checkDatabaseConnection();

    // 根据检查结果更新服务状态
    const overallStatus = Object.values(results).every(status => status) 
      ? ServingStatus.SERVING 
      : ServingStatus.NOT_SERVING;

    this.setServiceStatus('', overallStatus);

    return results;
  }

  /**
   * 定期健康检查
   */
  async performPeriodicHealthCheck(): Promise<void> {
    try {
      this.logger.debug('Performing periodic health check');
      
      const externalServices = await this.checkExternalServices();
      
      // 更新各个服务状态
      for (const [serviceName, isHealthy] of Object.entries(externalServices)) {
        const status = isHealthy ? ServingStatus.SERVING : ServingStatus.NOT_SERVING;
        this.setServiceStatus(serviceName, status);
      }

    } catch (error) {
      this.logger.error('Periodic health check failed:', error);
      this.setServiceStatus('', ServingStatus.NOT_SERVING, error.message);
    }
  }
} 