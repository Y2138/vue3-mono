import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { MetricsController } from './metrics.controller'
import { MonitoringService } from './monitoring.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, MetricsController],
  providers: [MonitoringService],
  exports: [MonitoringService]
})
export class HealthModule {}
