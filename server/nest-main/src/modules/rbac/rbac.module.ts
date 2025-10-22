import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { RbacSeedService } from './seeds/rbac-seed.service'
import { PermissionService } from './services/permission.service'
import { RbacInitService } from './services/rbac-init.service'
import { RoleService } from './services/role.service'
import { PermissionHttpController } from './permission.http.controller'
import { RoleHttpController } from './role.http.controller'

@Module({
  imports: [PrismaModule],
  controllers: [PermissionHttpController, RoleHttpController],
  providers: [RoleService, PermissionService, RbacSeedService, RbacInitService],
  exports: [RoleService, PermissionService, RbacSeedService]
})
export class RbacModule {
  // RBAC模块：提供权限和角色管理的 HTTP REST API
}
