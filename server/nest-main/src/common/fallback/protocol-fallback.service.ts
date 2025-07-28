import { Injectable, Logger } from '@nestjs/common';
import { ProtocolType } from '../middleware/protocol-detection.middleware';

/**
 * 降级策略枚举
 */
export enum FallbackStrategy {
  /** 自动降级 */
  AUTO = 'auto',
  /** 手动降级 */
  MANUAL = 'manual',
  /** 禁用降级 */
  DISABLED = 'disabled',
}

/**
 * 降级配置接口
 */
export interface FallbackConfig {
  /** 降级策略 */
  strategy: FallbackStrategy;
  /** 是否启用降级 */
  enabled: boolean;
  /** 失败阈值（连续失败次数触发降级） */
  failureThreshold: number;
  /** 恢复阈值（连续成功次数恢复服务） */
  recoveryThreshold: number;
  /** 降级超时时间（毫秒） */
  fallbackTimeout: number;
  /** 重试间隔（毫秒） */
  retryInterval: number;
  /** 最大重试次数 */
  maxRetries: number;
}

/**
 * 服务状态枚举
 */
export enum ServiceStatus {
  /** 正常运行 */
  ACTIVE = 'active',
  /** 已降级 */
  FALLBACK = 'fallback',
  /** 服务不可用 */
  UNAVAILABLE = 'unavailable',
}

/**
 * 协议降级服务
 * 提供 gRPC 到 HTTP 的自动降级能力
 */
@Injectable()
export class ProtocolFallbackService {
  private readonly logger = new Logger(ProtocolFallbackService.name);
  private readonly config: FallbackConfig;
  private readonly serviceStatus = new Map<string, ServiceStatus>();
  private readonly failureCount = new Map<string, number>();
  private readonly successCount = new Map<string, number>();
  private readonly lastFailureTime = new Map<string, Date>();

  constructor(config?: Partial<FallbackConfig>) {
    this.config = {
      strategy: FallbackStrategy.AUTO,
      enabled: true,
      failureThreshold: 3,
      recoveryThreshold: 2,
      fallbackTimeout: 5000,
      retryInterval: 30000,
      maxRetries: 5,
      ...config,
    };

    this.logger.log(`Protocol fallback service initialized with strategy: ${this.config.strategy}`);
  }

  /**
   * 注册服务
   */
  registerService(serviceName: string, initialStatus = ServiceStatus.ACTIVE): void {
    this.serviceStatus.set(serviceName, initialStatus);
    this.failureCount.set(serviceName, 0);
    this.successCount.set(serviceName, 0);
    
    this.logger.log(`Registered service: ${serviceName} with status: ${initialStatus}`);
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(serviceName: string): ServiceStatus {
    return this.serviceStatus.get(serviceName) || ServiceStatus.UNAVAILABLE;
  }

  /**
   * 获取所有服务状态
   */
  getAllServiceStatus(): Record<string, ServiceStatus> {
    const status: Record<string, ServiceStatus> = {};
    for (const [serviceName, serviceStatus] of this.serviceStatus) {
      status[serviceName] = serviceStatus;
    }
    return status;
  }

  /**
   * 记录服务调用成功
   */
  recordSuccess(serviceName: string): void {
    if (!this.config.enabled) return;

    const currentSuccessCount = (this.successCount.get(serviceName) || 0) + 1;
    this.successCount.set(serviceName, currentSuccessCount);
    this.failureCount.set(serviceName, 0);

    // 检查是否可以从降级状态恢复
    if (this.shouldRecover(serviceName, currentSuccessCount)) {
      this.recoverService(serviceName);
    }

    this.logger.debug(`Recorded success for ${serviceName}, count: ${currentSuccessCount}`);
  }

  /**
   * 记录服务调用失败
   */
  recordFailure(serviceName: string, error?: any): void {
    if (!this.config.enabled) return;

    const currentFailureCount = (this.failureCount.get(serviceName) || 0) + 1;
    this.failureCount.set(serviceName, currentFailureCount);
    this.successCount.set(serviceName, 0);
    this.lastFailureTime.set(serviceName, new Date());

    // 检查是否需要降级
    if (this.shouldFallback(serviceName, currentFailureCount)) {
      this.fallbackService(serviceName);
    }

    this.logger.warn(
      `Recorded failure for ${serviceName}, count: ${currentFailureCount}, error: ${error?.message}`
    );
  }

  /**
   * 获取推荐的协议类型
   */
  getRecommendedProtocol(serviceName: string, preferredProtocol: ProtocolType): ProtocolType {
    if (!this.config.enabled) {
      return preferredProtocol;
    }

    const status = this.getServiceStatus(serviceName);

    switch (status) {
      case ServiceStatus.ACTIVE:
        return preferredProtocol;
      
      case ServiceStatus.FALLBACK:
        // 如果首选协议是 gRPC，降级到 HTTP
        if (preferredProtocol === ProtocolType.GRPC) {
          this.logger.debug(`Fallback recommendation: ${serviceName} gRPC -> HTTP`);
          return ProtocolType.HTTP;
        }
        return preferredProtocol;
      
      case ServiceStatus.UNAVAILABLE:
        this.logger.warn(`Service ${serviceName} is unavailable, returning preferred protocol`);
        return preferredProtocol;
      
      default:
        return preferredProtocol;
    }
  }

  /**
   * 检查服务是否可以使用指定协议
   */
  canUseProtocol(serviceName: string, protocol: ProtocolType): boolean {
    if (!this.config.enabled) {
      return true;
    }

    const status = this.getServiceStatus(serviceName);

    switch (status) {
      case ServiceStatus.ACTIVE:
        return true;
      
      case ServiceStatus.FALLBACK:
        // 在降级状态下，只允许使用 HTTP
        return protocol === ProtocolType.HTTP;
      
      case ServiceStatus.UNAVAILABLE:
        return false;
      
      default:
        return false;
    }
  }

  /**
   * 手动触发服务降级
   */
  manualFallback(serviceName: string, reason?: string): void {
    this.fallbackService(serviceName, reason);
    this.logger.log(`Manual fallback triggered for ${serviceName}: ${reason || 'No reason provided'}`);
  }

  /**
   * 手动恢复服务
   */
  manualRecover(serviceName: string, reason?: string): void {
    this.recoverService(serviceName, reason);
    this.logger.log(`Manual recovery triggered for ${serviceName}: ${reason || 'No reason provided'}`);
  }

  /**
   * 重置服务状态
   */
  resetService(serviceName: string): void {
    this.serviceStatus.set(serviceName, ServiceStatus.ACTIVE);
    this.failureCount.set(serviceName, 0);
    this.successCount.set(serviceName, 0);
    this.lastFailureTime.delete(serviceName);
    
    this.logger.log(`Reset service status for ${serviceName}`);
  }

  /**
   * 获取服务统计信息
   */
  getServiceStats(serviceName: string): {
    status: ServiceStatus;
    failureCount: number;
    successCount: number;
    lastFailureTime?: Date;
  } {
    return {
      status: this.getServiceStatus(serviceName),
      failureCount: this.failureCount.get(serviceName) || 0,
      successCount: this.successCount.get(serviceName) || 0,
      lastFailureTime: this.lastFailureTime.get(serviceName),
    };
  }

  /**
   * 检查是否应该降级
   */
  private shouldFallback(serviceName: string, failureCount: number): boolean {
    if (this.config.strategy === FallbackStrategy.DISABLED) {
      return false;
    }

    const currentStatus = this.getServiceStatus(serviceName);
    
    // 如果已经在降级状态，不需要再次降级
    if (currentStatus === ServiceStatus.FALLBACK) {
      return false;
    }

    // 检查失败次数是否达到阈值
    return failureCount >= this.config.failureThreshold;
  }

  /**
   * 检查是否应该恢复
   */
  private shouldRecover(serviceName: string, successCount: number): boolean {
    if (this.config.strategy === FallbackStrategy.DISABLED) {
      return false;
    }

    const currentStatus = this.getServiceStatus(serviceName);
    
    // 只有在降级状态才能恢复
    if (currentStatus !== ServiceStatus.FALLBACK) {
      return false;
    }

    // 检查成功次数是否达到恢复阈值
    return successCount >= this.config.recoveryThreshold;
  }

  /**
   * 执行服务降级
   */
  private fallbackService(serviceName: string, reason?: string): void {
    const previousStatus = this.getServiceStatus(serviceName);
    this.serviceStatus.set(serviceName, ServiceStatus.FALLBACK);

    this.logger.warn(
      `Service ${serviceName} fallback: ${previousStatus} -> ${ServiceStatus.FALLBACK}` +
      (reason ? ` (${reason})` : '')
    );

    // 这里可以发送事件通知其他组件
    // this.eventEmitter.emit('service.fallback', { serviceName, previousStatus, reason });
  }

  /**
   * 执行服务恢复
   */
  private recoverService(serviceName: string, reason?: string): void {
    const previousStatus = this.getServiceStatus(serviceName);
    this.serviceStatus.set(serviceName, ServiceStatus.ACTIVE);
    
    // 重置计数器
    this.failureCount.set(serviceName, 0);
    this.successCount.set(serviceName, 0);

    this.logger.log(
      `Service ${serviceName} recovered: ${previousStatus} -> ${ServiceStatus.ACTIVE}` +
      (reason ? ` (${reason})` : '')
    );

    // 这里可以发送事件通知其他组件
    // this.eventEmitter.emit('service.recovery', { serviceName, previousStatus, reason });
  }

  /**
   * 获取配置信息
   */
  getConfig(): FallbackConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Fallback configuration updated:', newConfig);
  }

  /**
   * 清理资源
   */
  onModuleDestroy(): void {
    this.serviceStatus.clear();
    this.failureCount.clear();
    this.successCount.clear();
    this.lastFailureTime.clear();
    this.logger.log('Protocol fallback service destroyed');
  }
} 