import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RbacSeedService } from './seeds/rbac-seed.service';
import { PermissionService } from './services/permission.service';
import { RbacInitService } from './services/rbac-init.service';
import { RoleService } from './services/role.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
  ],
  providers: [
    RoleService,
    PermissionService,
    RbacSeedService,
    RbacInitService,
  ],
  exports: [RoleService, PermissionService, RbacSeedService],
})
export class RbacModule {} 