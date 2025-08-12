import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RbacSeedService } from './seeds/rbac-seed.service';
import { PermissionService } from './services/permission.service';
import { RbacInitService } from './services/rbac-init.service';
import { RoleService } from './services/role.service';
import { PermissionGrpcController } from './permission.grpc.controller';
import { PermissionHttpController } from './permission.http.controller';
import { RoleGrpcController } from './role.grpc.controller';
import { RoleHttpController } from './role.http.controller';
import { RbacTransformer } from '../../common/transformers/rbac.transformer';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [
    PermissionGrpcController,
    PermissionHttpController,
    RoleGrpcController,
    RoleHttpController,
  ],
  providers: [
    RoleService,
    PermissionService,
    RbacSeedService,
    RbacInitService,
    {
      provide: 'RBAC_TRANSFORMER',
      useValue: RbacTransformer,
    },
  ],
  exports: [RoleService, PermissionService, RbacSeedService],
})
export class RbacModule {
  // RBAC模块：提供权限和角色管理的双协议支持（gRPC + HTTP）
} 