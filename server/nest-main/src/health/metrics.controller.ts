import { Controller, Get, Header } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * 指标收集控制器
 * 为 Prometheus 提供应用性能指标
 */
@Controller('metrics')
export class MetricsController {
  constructor(private readonly monitoringService: MonitoringService) {}

  /**
   * Prometheus 指标端点
   */
  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    const report = this.monitoringService.getPerformanceReport();
    
    // 生成 Prometheus 格式的指标
    const prometheusMetrics = this.formatPrometheusMetrics(report);
    
    return prometheusMetrics;
  }

  /**
   * 详细监控数据端点
   */
  @Public()
  @Get('detailed')
  async getDetailedMetrics() {
    const report = this.monitoringService.getPerformanceReport();
    const errorStats = this.monitoringService.getErrorStats();
    const connectionStatus = this.monitoringService.getConnectionStatus();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      performanceReport: report,
      errorStats,
      connectionStatus,
    };
  }

  /**
   * 性能监控端点
   */
  @Public()
  @Get('performance')
  async getPerformanceMetrics() {
    const report = this.monitoringService.getPerformanceReport();
    
    return {
      timestamp: new Date().toISOString(),
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        pid: process.pid,
      },
      connections: {
        active: report.activeConnections,
        total: report.totalConnections,
      },
      services: report.services,
    };
  }

  /**
   * 错误监控端点
   */
  @Public()
  @Get('errors')
  async getErrorMetrics() {
    const errorStats = this.monitoringService.getErrorStats();
    
    return {
      timestamp: new Date().toISOString(),
      ...errorStats,
    };
  }

  /**
   * 连接状态端点
   */
  @Public()
  @Get('connections')
  async getConnectionMetrics() {
    const connectionStatus = this.monitoringService.getConnectionStatus();
    
    return {
      timestamp: new Date().toISOString(),
      ...connectionStatus,
    };
  }

  /**
   * 最近请求端点
   */
  @Public()
  @Get('requests')
  async getRecentRequests() {
    const recentRequests = this.monitoringService.getRecentRequests(100);
    
    return {
      timestamp: new Date().toISOString(),
      totalRequests: recentRequests.length,
      requests: recentRequests,
      statistics: this.calculateRequestStatistics(recentRequests),
    };
  }

  /**
   * 将指标格式化为 Prometheus 格式
   */
  private formatPrometheusMetrics(report: any): string {
    const lines: string[] = [];
    
    // 系统指标
    const memory = process.memoryUsage();
    lines.push('# HELP nest_app_memory_usage_bytes Memory usage in bytes');
    lines.push('# TYPE nest_app_memory_usage_bytes gauge');
    lines.push(`nest_app_memory_usage_bytes{type="rss"} ${memory.rss}`);
    lines.push(`nest_app_memory_usage_bytes{type="heap_used"} ${memory.heapUsed}`);
    lines.push(`nest_app_memory_usage_bytes{type="heap_total"} ${memory.heapTotal}`);
    lines.push(`nest_app_memory_usage_bytes{type="external"} ${memory.external}`);
    
    lines.push('# HELP nest_app_uptime_seconds Application uptime in seconds');
    lines.push('# TYPE nest_app_uptime_seconds gauge');
    lines.push(`nest_app_uptime_seconds ${process.uptime()}`);
    
    // 连接指标
    lines.push('# HELP nest_app_connections_active Active connections');
    lines.push('# TYPE nest_app_connections_active gauge');
    lines.push(`nest_app_connections_active ${report.activeConnections || 0}`);
    
    lines.push('# HELP nest_app_connections_total Total connections');
    lines.push('# TYPE nest_app_connections_total counter');
    lines.push(`nest_app_connections_total ${report.totalConnections || 0}`);
    
    // 服务指标
    if (report.services) {
      for (const [serviceName, serviceMetrics] of Object.entries(report.services as any)) {
        const metrics = serviceMetrics as any;
        
        lines.push(`# HELP nest_app_service_requests_total Total requests for service ${serviceName}`);
        lines.push(`# TYPE nest_app_service_requests_total counter`);
        lines.push(`nest_app_service_requests_total{service="${serviceName}"} ${metrics.requestCount || 0}`);
        
        lines.push(`# HELP nest_app_service_errors_total Total errors for service ${serviceName}`);
        lines.push(`# TYPE nest_app_service_errors_total counter`);
        lines.push(`nest_app_service_errors_total{service="${serviceName}"} ${metrics.errorCount || 0}`);
        
        lines.push(`# HELP nest_app_service_response_time_ms Average response time for service ${serviceName}`);
        lines.push(`# TYPE nest_app_service_response_time_ms gauge`);
        lines.push(`nest_app_service_response_time_ms{service="${serviceName}"} ${metrics.averageResponseTime || 0}`);
        
        lines.push(`# HELP nest_app_service_error_rate Error rate for service ${serviceName}`);
        lines.push(`# TYPE nest_app_service_error_rate gauge`);
        lines.push(`nest_app_service_error_rate{service="${serviceName}"} ${metrics.errorRate || 0}`);
      }
    }
    
    return lines.join('\n') + '\n';
  }

  /**
   * 计算请求统计
   */
  private calculateRequestStatistics(requests: any[]) {
    if (requests.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        avgResponseTime: 0,
      };
    }

    const successful = requests.filter(req => req.success).length;
    const failed = requests.length - successful;
    const totalResponseTime = requests.reduce((sum, req) => sum + req.responseTime, 0);

    return {
      total: requests.length,
      successful,
      failed,
      successRate: (successful / requests.length) * 100,
      avgResponseTime: totalResponseTime / requests.length,
    };
  }
} 