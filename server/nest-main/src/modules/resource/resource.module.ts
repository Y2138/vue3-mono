import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { ResourceService } from './services/resource.service'
import { ResourceController } from './resource.controller'
import { ResourceTreeService } from './services/resource-tree.service'
import { ResourceSeedService } from './seeds/resource-seed.service'

@Module({
  imports: [PrismaModule],
  controllers: [ResourceController],
  providers: [ResourceService, ResourceTreeService, ResourceSeedService],
  exports: [ResourceService, ResourceTreeService]
})
export class ResourceModule {}
