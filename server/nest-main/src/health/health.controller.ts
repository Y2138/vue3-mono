import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
} 