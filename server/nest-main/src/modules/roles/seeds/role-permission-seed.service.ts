import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RolePermissionSeedService {
  constructor(private prisma: PrismaService) {}

  /**
   * 为角色分配权限
   */
  async assignPermissionsToRole(roleId: string, permissionCodes: string[]) {
    // 获取权限
    const permissions = await this.prisma.permission.findMany({
      where: {
        code: {
          in: permissionCodes,
        },
      },
    });

    if (permissions.length !== permissionCodes.length) {
      const foundCodes = permissions.map(p => p.code);
      const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
      console.warn(`⚠️  部分权限代码未找到: ${missingCodes.join(', ')}`);
    }

    // 创建角色权限关联
    const rolePermissions = permissions.map(permission => ({
      roleId,
      permissionId: permission.id,
    }));

    // 批量创建角色权限关联
    for (const rolePermission of rolePermissions) {
      await this.prisma.rolePermission.create({
        data: rolePermission,
      });
    }

    console.log(`✅ 为角色 ${roleId} 分配了 ${permissions.length} 个权限`);
  }

  /**
   * 移除角色的所有权限
   */
  async removeAllPermissionsFromRole(roleId: string) {
    const deletedCount = await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    console.log(`🗑️  移除了角色 ${roleId} 的 ${deletedCount.count} 个权限`);
    return deletedCount.count;
  }

  /**
   * 为角色添加单个权限
   */
  async addPermissionToRole(roleId: string, permissionCode: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (!permission) {
      throw new Error(`权限代码 ${permissionCode} 不存在`);
    }

    // 检查是否已存在
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      console.log(`ℹ️  角色 ${roleId} 已拥有权限 ${permissionCode}`);
      return existing;
    }

    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId: permission.id,
      },
    });
  }

  /**
   * 从角色中移除单个权限
   */
  async removePermissionFromRole(roleId: string, permissionCode: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (!permission) {
      throw new Error(`权限代码 ${permissionCode} 不存在`);
    }

    return this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: permission.id,
      },
    });
  }

  /**
   * 批量为多个角色分配相同的权限
   */
  async assignPermissionsToMultipleRoles(roleIds: string[], permissionCodes: string[]): Promise<Array<{ roleId: string; permissionCount: number }>> {
    const results: Array<{ roleId: string; permissionCount: number }> = [];

    for (const roleId of roleIds) {
      await this.assignPermissionsToRole(roleId, permissionCodes);
      results.push({ roleId, permissionCount: permissionCodes.length });
    }

    return results;
  }

  /**
   * 复制角色的权限到其他角色
   */
  async copyPermissionsFromRole(sourceRoleId: string, targetRoleIds: string[]) {
    // 获取源角色的所有权限
    const sourcePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: sourceRoleId },
      include: { permission: true },
    });

    const permissionCodes = sourcePermissions.map(rp => rp.permission.code);

    console.log(`🔄 从角色 ${sourceRoleId} 复制 ${permissionCodes.length} 个权限到角色 ${targetRoleIds.join(', ')}`);

    // 为每个目标角色分配相同的权限
    return this.assignPermissionsToMultipleRoles(targetRoleIds, permissionCodes);
  }

  /**
   * 验证角色权限分配的完整性
   */
  async verifyRolePermissions(roleId: string) {
    // 获取角色
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new Error(`角色 ${roleId} 不存在`);
    }

    // 单独获取角色的所有权限
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: {
          include: {
            resource: true
          }
        }
      }
    });

    // 检查权限的完整性
    const issues: string[] = [];

    for (const rolePermission of rolePermissions) {
      const permission = rolePermission.permission;
      
      // 检查权限关联的资源是否存在
      if (permission.resourceId && !permission.resource) {
        issues.push(`权限 ${permission.code} 关联的资源不存在`);
      }

      // 检查权限代码格式
      if (!permission.code || permission.code.length === 0) {
        issues.push(`权限 ${permission.name} 缺少权限代码`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      totalPermissions: rolePermissions.length
    };
  }

  /**
   * 获取权限分配统计
   */
  async getPermissionAssignmentStats() {
    const [totalRolePermissions, totalRoles, totalPermissions] = await Promise.all([
        this.prisma.rolePermission.count(),
        this.prisma.role.count(),
        this.prisma.permission.count(),
      ]);

    const rolePermissionCounts = await this.prisma.rolePermission.groupBy({
      by: ['roleId'],
      _count: {
        permissionId: true,
      },
    });

    return {
      totalRolePermissions,
      totalRoles,
      totalPermissions,
      averagePermissionsPerRole: totalRoles > 0 ? totalRolePermissions / totalRoles : 0,
      rolePermissionDistribution: rolePermissionCounts.map(rp => ({
        roleId: rp.roleId,
        permissionCount: rp._count.permissionId,
      })),
    };
  }
}