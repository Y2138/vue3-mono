import { Injectable, Logger } from '@nestjs/common';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
}

/**
 * 请求事件接口
 */
export interface RequestEvent {
  method: string;
  protocol: 'grpc' | 'http';
  startTime: number;
  endTime: number;
  success: boolean;
  error?: string;
  responseTime: number;
}

/**
 * 连接状态接口
 */
export interface ConnectionStatus {
  activeConnections: number;
  totalConnections: number;
  lastConnectionTime: Date;
  connectionHistory: Array<{
    timestamp: Date;
    type: 'connect' | 'disconnect';
  }>;
}

/**
 * 监控服务
 * 负责收集和管理服务性能指标
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  
  // 性能指标存储
  private readonly metrics = new Map<string, PerformanceMetrics>();
  
  // 连接状态
  private connectionStatus: ConnectionStatus = {
    activeConnections: 0,
    totalConnections: 0,
    lastConnectionTime: new Date(),
    connectionHistory: [],
  };

  // 最近的请求事件
  private recentRequests: RequestEvent[] = [];
  private readonly maxRecentRequests = 1000;

  constructor() {
    this.initializeMetrics();
  }

  /**
   * 初始化指标
   */
  private initializeMetrics(): void {
    const services = ['UserService', 'PermissionService', 'RoleService', 'Health'];
    
    for (const service of services) {
      this.metrics.set(service, {
        requestCount: 0,
        errorCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        errorRate: 0,
      });
    }
  }

  /**
   * 记录请求事件
   */
  recordRequest(event: RequestEvent): void {
    const serviceName = this.extractServiceName(event.method);
    const metrics = this.metrics.get(serviceName);
    
    if (metrics) {
      // 更新基本计数
      metrics.requestCount++;
      if (!event.success) {
        metrics.errorCount++;
      }

      // 更新响应时间统计
      metrics.totalResponseTime += event.responseTime;
      metrics.averageResponseTime = metrics.totalResponseTime / metrics.requestCount;
      metrics.minResponseTime = Math.min(metrics.minResponseTime, event.responseTime);
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, event.responseTime);

      // 计算错误率
      metrics.errorRate = (metrics.errorCount / metrics.requestCount) * 100;

      this.metrics.set(serviceName, metrics);

      // 检查告警条件
      this.checkAlerts(serviceName, metrics, event);
    }

    // 保存最近的请求
    this.recentRequests.push(event);
    if (this.recentRequests.length > this.maxRecentRequests) {
      this.recentRequests.shift();
    }

    this.logger.debug(`Recorded ${event.protocol} request: ${event.method} (${event.responseTime}ms, success: ${event.success})`);
  }

  /**
   * 从方法名提取服务名
   */
  private extractServiceName(method: string): string {
    if (method.includes('UserService')) return 'UserService';
    if (method.includes('PermissionService')) return 'PermissionService';
    if (method.includes('RoleService')) return 'RoleService';
    if (method.includes('Health')) return 'Health';
    return 'Unknown';
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(serviceName: string, metrics: PerformanceMetrics, event: RequestEvent): void {
    // 错误率告警
    if (metrics.errorRate > 10) { // 错误率超过10%
      this.logger.warn(`High error rate detected for ${serviceName}: ${metrics.errorRate.toFixed(2)}%`);
    }

    // 响应时间告警
    if (event.responseTime > 5000) { // 响应时间超过5秒
      this.logger.warn(`Slow response detected for ${serviceName}: ${event.responseTime}ms`);
    }
  }

  /**
   * 获取服务指标
   */
  getMetrics(serviceName?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (serviceName) {
      return this.metrics.get(serviceName) || this.createEmptyMetrics();
    }
    return new Map(this.metrics);
  }

  /**
   * 创建空的指标对象
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      errorRate: 0,
    };
  }

  /**
   * 重置指标
   */
  resetMetrics(serviceName?: string): void {
    if (serviceName) {
      this.metrics.set(serviceName, this.createEmptyMetrics());
      this.logger.log(`Reset metrics for service: ${serviceName}`);
    } else {
      this.initializeMetrics();
      this.recentRequests = [];
      this.logger.log('Reset all metrics');
    }
  }

  /**
   * 记录连接事件
   */
  recordConnection(type: 'connect' | 'disconnect'): void {
    const now = new Date();
    
    if (type === 'connect') {
      this.connectionStatus.activeConnections++;
      this.connectionStatus.totalConnections++;
      this.connectionStatus.lastConnectionTime = now;
    } else {
      this.connectionStatus.activeConnections = Math.max(0, this.connectionStatus.activeConnections - 1);
    }

    // 记录连接历史
    this.connectionStatus.connectionHistory.push({
      timestamp: now,
      type: type,
    });

    // 保留最近的连接历史（最多100条）
    if (this.connectionStatus.connectionHistory.length > 100) {
      this.connectionStatus.connectionHistory.shift();
    }

    this.logger.debug(`Connection ${type}: ${this.connectionStatus.activeConnections} active connections`);

    // 连接数告警
    if (this.connectionStatus.activeConnections > 100) {
      this.logger.warn(`High connection count: ${this.connectionStatus.activeConnections} active connections`);
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * 获取最近的请求
   */
  getRecentRequests(limit = 50): RequestEvent[] {
    return this.recentRequests.slice(-limit);
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): Record<string, any> {
    const stats = {
      totalErrors: 0,
      errorsByService: {} as Record<string, number>,
      recentErrors: [] as RequestEvent[],
    };

    // 统计各服务错误数
    for (const [serviceName, metrics] of this.metrics) {
      stats.totalErrors += metrics.errorCount;
      stats.errorsByService[serviceName] = metrics.errorCount;
    }

    // 获取最近的错误请求
    stats.recentErrors = this.recentRequests
      .filter(req => !req.success)
      .slice(-20);

    return stats;
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): Record<string, any> {
    const report = {
      timestamp: new Date(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeConnections: this.connectionStatus.activeConnections,
      totalConnections: this.connectionStatus.totalConnections,
      services: {} as Record<string, any>,
    };

    // 添加各服务的性能指标
    for (const [serviceName, metrics] of this.metrics) {
      report.services[serviceName] = {
        ...metrics,
        requestsPerSecond: this.calculateRequestsPerSecond(serviceName),
      };
    }

    return report;
  }

  /**
   * 计算每秒请求数
   */
  private calculateRequestsPerSecond(serviceName: string): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 1分钟前

    const recentRequests = this.recentRequests.filter(
      req => this.extractServiceName(req.method) === serviceName &&
             req.endTime >= oneMinuteAgo
    );

    return recentRequests.length / 60; // 每秒请求数
  }
} 