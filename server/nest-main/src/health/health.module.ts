import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { GrpcHealthController } from './grpc-health.controller';
import { MetricsController } from './metrics.controller';
import { MonitoringService } from './monitoring.service';

@Module({
  controllers: [
    HealthController,
    GrpcHealthController,
    MetricsController,
  ],
  providers: [
    MonitoringService,
  ],
  exports: [
    MonitoringService,
    GrpcHealthController,
  ],
})
export class HealthModule {} 