import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { GrpcHealthService } from './grpc-health.service';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: string;
    redis: string;
    grpc: string;
  };
}

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly grpcHealthService: GrpcHealthService,
  ) {}
  @Get()
  @ApiOperation({ summary: '健康检查', description: '检查应用程序和各服务状态' })
  @ApiResponse({ 
    status: 200, 
    description: '健康检查成功',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-25T19:30:00.000Z' },
        uptime: { type: 'number', example: 123456 },
        environment: { type: 'string', example: 'development' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'connected' },
            redis: { type: 'string', example: 'connected' },
            grpc: { type: 'string', example: 'running' }
          }
        }
      }
    }
  })
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected', // 实际应用中可以检查数据库连接状态
        redis: 'connected',    // 实际应用中可以检查Redis连接状态
        grpc: 'running'        // 实际应用中可以检查gRPC服务状态
      }
    };
  }

  @Get('check')
  @ApiOperation({ summary: '简单健康检查', description: '简单的存活检查' })
  @ApiResponse({ 
    status: 200, 
    description: '服务正常',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Service is healthy' }
      }
    }
  })
  getSimpleHealth(): { message: string } {
    return { message: 'Service is healthy' };
  }

  @Get('metrics')
  @ApiOperation({ summary: '性能指标', description: '获取服务性能指标' })
  @ApiResponse({ 
    status: 200, 
    description: '性能指标获取成功',
  })
  getMetrics() {
    return this.monitoringService.getPerformanceReport();
  }

  @Get('grpc-status')
  @ApiOperation({ summary: 'gRPC服务状态', description: '获取gRPC服务健康状态' })
  @ApiResponse({ 
    status: 200, 
    description: 'gRPC状态获取成功',
  })
  getGrpcStatus() {
    const statuses = this.grpcHealthService.getAllServiceStatuses();
    const result: Record<string, any> = {};
    
    for (const [serviceName, status] of statuses) {
      result[serviceName || 'server'] = {
        status: status.status,
        lastCheck: status.lastCheck,
        error: status.error,
      };
    }
    
    return result;
  }

  @Get('connections')
  @ApiOperation({ summary: '连接状态', description: '获取连接状态信息' })
  @ApiResponse({ 
    status: 200, 
    description: '连接状态获取成功',
  })
  getConnections() {
    return this.monitoringService.getConnectionStatus();
  }

  @Get('errors')
  @ApiOperation({ summary: '错误统计', description: '获取错误统计信息' })
  @ApiResponse({ 
    status: 200, 
    description: '错误统计获取成功',
  })
  getErrors() {
    return this.monitoringService.getErrorStats();
  }

  @Get('recent-requests')
  @ApiOperation({ summary: '最近请求', description: '获取最近的请求记录' })
  @ApiResponse({ 
    status: 200, 
    description: '最近请求获取成功',
  })
  getRecentRequests() {
    return {
      requests: this.monitoringService.getRecentRequests(20),
      timestamp: new Date(),
    };
  }
} 