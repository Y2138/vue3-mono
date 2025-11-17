import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RolePermissionSeedService } from './role-permission-seed.service';

export interface SeedRole {
  name: string;
  description: string;
  isActive: boolean;
  isSuperAdmin?: boolean; // 是否为超级管理员
  permissionCodes: string[]; // 权限代码列表
}

@Injectable()
export class RoleSeedService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private rolePermissionSeedService: RolePermissionSeedService,
  ) {}

  async onModuleInit() {
    // 检查是否已经初始化过
    const existingRoles = await this.prisma.client.role.count();
    if (existingRoles > 0) {
      console.log('👥 角色数据已存在，跳过初始化');
      return;
    }

    console.log('🌱 开始初始化角色数据...');
    await this.seedRoles();
    console.log('✅ 角色数据初始化完成');
  }

  private async seedRoles() {
    // 默认角色定义
    const defaultRoles: SeedRole[] = [
      {
        name: '超级管理员',
        description: '系统超级管理员，拥有所有权限',
        isActive: true,
        isSuperAdmin: true,
        permissionCodes: [
          'SYSTEM_ADMIN',
          'USER_VIEW',
          'USER_CREATE',
          'USER_EDIT',
          'USER_DELETE',
          'ROLE_VIEW',
          'ROLE_CREATE',
          'ROLE_EDIT',
          'ROLE_DELETE',
          'RESOURCE_VIEW',
          'RESOURCE_CREATE',
          'RESOURCE_EDIT',
          'RESOURCE_DELETE',
          'DASHBOARD_VIEW',
          'PROFILE_VIEW',
          'PROFILE_EDIT',
          'API_AUTH',
          'API_USERS',
          'API_RESOURCES',
          'API_ROLES',
        ],
      },
      {
        name: '系统管理员',
        description: '系统管理员，拥有用户管理和角色管理权限',
        isActive: true,
        permissionCodes: [
          'USER_VIEW',
          'USER_CREATE',
          'USER_EDIT',
          'USER_DELETE',
          'ROLE_VIEW',
          'ROLE_CREATE',
          'ROLE_EDIT',
          'ROLE_DELETE',
          'RESOURCE_VIEW',
          'RESOURCE_CREATE',
          'RESOURCE_EDIT',
          'RESOURCE_DELETE',
          'DASHBOARD_VIEW',
          'PROFILE_VIEW',
          'PROFILE_EDIT',
          'API_USERS',
          'API_RESOURCES',
          'API_ROLES',
        ],
      },
      {
        name: '用户管理员',
        description: '用户管理员，只能管理用户信息',
        isActive: true,
        permissionCodes: [
          'USER_VIEW',
          'USER_CREATE',
          'USER_EDIT',
          'DASHBOARD_VIEW',
          'PROFILE_VIEW',
          'PROFILE_EDIT',
          'API_USERS',
        ],
      },
      {
        name: '普通用户',
        description: '普通用户，只能查看和编辑个人信息',
        isActive: true,
        permissionCodes: [
          'DASHBOARD_VIEW',
          'PROFILE_VIEW',
          'PROFILE_EDIT',
        ],
      },
      {
        name: '只读用户',
        description: '只读用户，只能查看基本信息',
        isActive: true,
        permissionCodes: [
          'DASHBOARD_VIEW',
          'PROFILE_VIEW',
        ],
      },
    ];

    // 创建角色并分配权限
    for (const roleData of defaultRoles) {
      const role = await this.prisma.client.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          isActive: roleData.isActive,
          isSuperAdmin: roleData.isSuperAdmin ?? false,
        },
      });

      console.log(`✅ 创建角色: ${role.name} (${role.description})`);

      // 为角色分配权限
      await this.rolePermissionSeedService.assignPermissionsToRole(
        role.id,
        roleData.permissionCodes,
      );
    }
  }

  /**
   * 根据角色名称获取角色
   */
  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
      include: {
        role_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * 获取角色的所有权限
   */
  async getRolePermissions(roleId: string) {
    return this.prisma.client.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });
  }

  /**
   * 重置角色数据
   */
  async resetRoles() {
    console.log('🔄 重置角色数据...');
    // 删除所有角色权限关联
    await this.prisma.client.rolePermission.deleteMany({});
    // 删除所有角色
    await this.prisma.client.role.deleteMany({});
    await this.seedRoles();
    console.log('✅ 角色数据重置完成');
  }

  /**
   * 创建新角色并分配权限
   */
  async createRoleWithPermissions(roleData: SeedRole) {
    const role = await this.prisma.client.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        isActive: roleData.isActive,
        isSuperAdmin: roleData.isSuperAdmin ?? false,
      },
    });

    await this.rolePermissionSeedService.assignPermissionsToRole(
      role.id,
      roleData.permissionCodes,
    );

    return role;
  }

  /**
   * 获取角色统计信息
   */
  async getRoleStatistics() {
    const [totalRoles, activeRoles, inactiveRoles] = await Promise.all([
      this.prisma.client.role.count(),
      this.prisma.client.role.count({ where: { isActive: true } }),
      this.prisma.client.role.count({ where: { isActive: false } }),
    ]);

    return {
      total: totalRoles,
      active: activeRoles,
      inactive: inactiveRoles,
    };
  }
}