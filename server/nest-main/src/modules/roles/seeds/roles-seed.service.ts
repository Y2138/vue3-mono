import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionSeedService } from './permission-seed.service';
import { RoleSeedService } from './role-seed.service';
import { RolePermissionSeedService } from './role-permission-seed.service';

/**
 * 角色模块统一种子服务
 * 负责初始化权限、角色和角色权限关联数据
 */
@Injectable()
export class RolesSeedService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private permissionSeedService: PermissionSeedService,
    private roleSeedService: RoleSeedService,
    private rolePermissionSeedService: RolePermissionSeedService,
  ) {}

  async onModuleInit() {
    console.log('🚀 开始角色模块数据初始化...');
    
    try {
      // 1. 首先初始化权限数据
      await this.permissionSeedService.onModuleInit();
      
      // 2. 然后初始化角色数据（包含角色权限关联）
      await this.roleSeedService.onModuleInit();
      
      // 3. 验证初始化结果
      await this.validateSeedData();
      
      console.log('✅ 角色模块数据初始化完成');
    } catch (error) {
      console.error('❌ 角色模块数据初始化失败:', error);
      throw error;
    }
  }

  /**
   * 验证种子数据的完整性
   */
  private async validateSeedData() {
    console.log('🔍 验证种子数据...');

    // 检查权限数据
    const permissionStats = await this.rolePermissionSeedService.getPermissionAssignmentStats();
    if (permissionStats.totalPermissions === 0) {
      throw new Error('权限数据初始化失败');
    }
    console.log(`✅ 权限数据: ${permissionStats.totalPermissions} 个权限`);

    // 检查角色数据
    const roleStats = await this.roleSeedService.getRoleStatistics();
    if (roleStats.total === 0) {
      throw new Error('角色数据初始化失败');
    }
    console.log(`✅ 角色数据: ${roleStats.total} 个角色 (${roleStats.active} 个活跃)`);

    // 检查角色权限关联数据
    if (permissionStats.totalRolePermissions === 0) {
      throw new Error('角色权限关联数据初始化失败');
    }
    console.log(`✅ 角色权限关联: ${permissionStats.totalRolePermissions} 个关联`);

    // 验证权限分配的完整性
    const rolePermissionCounts = permissionStats.rolePermissionDistribution;
    for (const roleStat of rolePermissionCounts) {
      const validation = await this.rolePermissionSeedService.verifyRolePermissions(roleStat.roleId);
      if (!validation.isValid) {
        console.warn(`⚠️  角色 ${roleStat.roleId} 权限验证失败:`, validation.issues);
      }
    }

    console.log('✅ 种子数据验证完成');
  }

  /**
   * 重置所有角色模块数据
   */
  async resetAllData() {
    console.log('🔄 重置所有角色模块数据...');

    // 按依赖关系顺序删除数据
    await this.prisma.client.rolePermission.deleteMany({});
    await this.prisma.client.role.deleteMany({});
    await this.prisma.client.permission.deleteMany({});

    // 重新初始化
    await this.onModuleInit();

    console.log('✅ 角色模块数据重置完成');
  }

  /**
   * 快速初始化 - 只创建基本角色和权限
   */
  async quickInit() {
    console.log('⚡ 快速初始化基本角色和权限...');

    // 创建基本权限
    const basicPermissions = [
      { name: '查看仪表盘', code: 'DASHBOARD_VIEW', description: '查看仪表盘' },
      { name: '查看个人资料', code: 'PROFILE_VIEW', description: '查看个人资料' },
      { name: '编辑个人资料', code: 'PROFILE_EDIT', description: '编辑个人资料' },
    ];

    for (const perm of basicPermissions) {
      await this.permissionSeedService.addPermission(perm as any);
    }

    // 创建基本角色
    const basicRoles = [
      {
        name: '普通用户',
        description: '基本用户权限',
        isActive: true,
        permissionCodes: ['DASHBOARD_VIEW', 'PROFILE_VIEW', 'PROFILE_EDIT'],
      },
    ];

    for (const role of basicRoles) {
      await this.roleSeedService.createRoleWithPermissions(role as any);
    }

    console.log('✅ 快速初始化完成');
  }

  /**
   * 获取初始化状态
   */
  async getInitStatus() {
    const permissionStats = await this.rolePermissionSeedService.getPermissionAssignmentStats();
    const roleStats = await this.roleSeedService.getRoleStatistics();

    return {
      isInitialized: permissionStats.totalPermissions > 0 && roleStats.total > 0,
      permissions: {
        total: permissionStats.totalPermissions,
        hasData: permissionStats.totalPermissions > 0,
      },
      roles: {
        total: roleStats.total,
        active: roleStats.active,
        hasData: roleStats.total > 0,
      },
      rolePermissions: {
        total: permissionStats.totalRolePermissions,
        averagePerRole: permissionStats.averagePermissionsPerRole,
        hasData: permissionStats.totalRolePermissions > 0,
      },
    };
  }

  /**
   * 导出初始化数据（用于备份或迁移）
   */
  async exportSeedData() {
    const [permissions, roles, rolePermissions] = await Promise.all([
      this.prisma.client.permission.findMany(),
      this.prisma.client.role.findMany(),
      this.prisma.client.rolePermission.findMany({
        include: {
          role: true,
          permission: true,
        },
      }),
    ]);

    return {
      permissions: permissions.map(p => ({
        name: p.name,
        code: p.code,
        description: p.description,
        resourceId: p.resourceId,
        action: p.action,
      })),
      roles: roles.map(r => ({
        name: r.name,
        description: r.description,
        isActive: r.isActive,
      })),
      rolePermissions: rolePermissions.map(rp => ({
        roleName: rp.role.name,
        permissionCode: rp.permission.code,
      })),
    };
  }
}