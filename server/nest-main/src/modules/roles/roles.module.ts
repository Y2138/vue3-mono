import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { RoleService } from './services/role.service'
import { RoleController } from './role.controller'
import { RolePermissionService } from './services/role-permission.service'
import { RolePermissionController } from './role-permission.controller'
import { ResourceModule } from '../resource/resource.module'
// 种子服务
import { PermissionSeedService } from './seeds/permission-seed.service'
import { RoleSeedService } from './seeds/role-seed.service'
import { RolePermissionSeedService } from './seeds/role-permission-seed.service'
import { RolesSeedService } from './seeds/roles-seed.service'

@Module({
  imports: [PrismaModule, ResourceModule],
  controllers: [RoleController, RolePermissionController],
  providers: [
    RoleService,
    RolePermissionService,
    // 种子服务
    PermissionSeedService,
    RoleSeedService,
    RolePermissionSeedService,
    RolesSeedService
  ],
  exports: [RoleService, RolePermissionService]
})
export class RoleModule {}
