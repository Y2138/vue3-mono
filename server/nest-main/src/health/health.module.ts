import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { GrpcHealthController } from './grpc-health.controller';
import { MetricsController } from './metrics.controller';
import { MonitoringService } from './monitoring.service';
import { GrpcHealthService } from './grpc-health.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [
    HealthController,
    GrpcHealthController,
    MetricsController,
  ],
  providers: [
    MonitoringService,
    GrpcHealthService,
  ],
  exports: [
    MonitoringService,
    GrpcHealthService,
  ],
})
export class HealthModule {} 