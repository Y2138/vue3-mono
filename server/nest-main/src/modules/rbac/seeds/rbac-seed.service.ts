import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ACTIONS, RESOURCES, initialPermissions, initialRoles } from './initial-data';

@Injectable()
export class RbacSeedService {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async seed() {
    await this.seedPermissions();
    await this.seedRoles();
    await this.assignPermissionsToRoles();
  }

  private async seedPermissions() {
    this.logger.log('开始初始化权限数据...');
    
    for (const permissionData of initialPermissions) {
      const existingPermission = await this.prisma.client.permission.findFirst({
        where: {
          resource: permissionData.resource,
          action: permissionData.action,
        },
      });

      if (!existingPermission) {
        await this.prisma.client.permission.create({
          data: permissionData
        });
        this.logger.log(`创建权限: ${permissionData.name}`);
      }
    }
  }

  private async seedRoles() {
    this.logger.log('开始初始化角色数据...');
    
    for (const roleData of initialRoles) {
      const existingRole = await this.prisma.client.role.findUnique({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        await this.prisma.client.role.create({
          data: roleData
        });
        this.logger.log(`创建角色: ${roleData.name}`);
      }
    }
  }

  private async assignPermissionsToRoles() {
    this.logger.log('开始分配角色权限...');

    // 获取所有权限
    const allPermissions = await this.prisma.client.permission.findMany();
    
    // 为超级管理员分配所有权限
    const superAdmin = await this.prisma.client.role.findUnique({
      where: { name: '超级管理员' },
    });
    
    if (superAdmin) {
      // 先删除所有现有的权限关联
      await this.prisma.client.rolePermission.deleteMany({
        where: { roleId: superAdmin.id }
      });
      
      // 创建新的权限关联
      await this.prisma.client.rolePermission.createMany({
        data: allPermissions.map(permission => ({
          roleId: superAdmin.id,
          permissionId: permission.id
        })),
        skipDuplicates: true
      });
      
      this.logger.log('已为超级管理员分配所有权限');
    }

    // 为管理员分配除系统管理外的所有权限
    const admin = await this.prisma.client.role.findUnique({
      where: { name: '管理员' },
    });
    
    if (admin) {
      // 过滤权限
      const adminPermissions = allPermissions.filter(
        p => p.resource !== RESOURCES.SYSTEM
      );
      
      // 先删除所有现有的权限关联
      await this.prisma.client.rolePermission.deleteMany({
        where: { roleId: admin.id }
      });
      
      // 创建新的权限关联
      await this.prisma.client.rolePermission.createMany({
        data: adminPermissions.map(permission => ({
          roleId: admin.id,
          permissionId: permission.id
        })),
        skipDuplicates: true
      });
      
      this.logger.log('已为管理员分配权限');
    }

    // 为普通用户分配基本查看权限
    const normalUser = await this.prisma.client.role.findUnique({
      where: { name: '普通用户' },
    });
    
    if (normalUser) {
      // 过滤权限
      const userPermissions = allPermissions.filter(
        p => p.action === ACTIONS.READ && p.resource !== RESOURCES.SYSTEM
      );
      
      // 先删除所有现有的权限关联
      await this.prisma.client.rolePermission.deleteMany({
        where: { roleId: normalUser.id }
      });
      
      // 创建新的权限关联
      await this.prisma.client.rolePermission.createMany({
        data: userPermissions.map(permission => ({
          roleId: normalUser.id,
          permissionId: permission.id
        })),
        skipDuplicates: true
      });
      
      this.logger.log('已为普通用户分配权限');
    }
  }
} 