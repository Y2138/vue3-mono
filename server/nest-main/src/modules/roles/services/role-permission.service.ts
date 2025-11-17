import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResourceService } from '../../resource/services/resource.service';

@Injectable()
export class RolePermissionService {
  constructor(
    private prisma: PrismaService,
    private resourceService: ResourceService
  ) {}

  /**
   * 分配资源权限给角色
   */
  async assignResourcesToRole(assignResourcesDto: { role_id: string; resource_ids: string[] }) {
    const { role_id, resource_ids } = assignResourcesDto;

    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: role_id }
    });

    if (!role) {
      throw new NotFoundException(`角色ID "${role_id}" 不存在`);
    }

    // 检查所有资源是否存在
    const resources = await this.prisma.resource.findMany({
      where: {
        id: { in: resource_ids }
      }
    });

    if (resources.length !== resource_ids.length) {
      throw new BadRequestException('部分资源不存在');
    }

    // 删除旧的角色资源关联
    await this.prisma.roleResource.deleteMany({
      where: { roleId: role_id }
    });

    // 创建新的角色资源关联
    if (resource_ids.length > 0) {
      await this.prisma.roleResource.createMany({
        data: resource_ids.map(resourceId => ({
          roleId: role_id,
          resourceId
        }))
      });
    }

    return { message: '权限分配成功' };
  }

  /**
   * 获取角色的权限树
   */
  async getRolePermissionTree(roleId: string) {
    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException(`角色ID "${roleId}" 不存在`);
    }

    // 获取所有资源树
    const allResources = await this.resourceService.findTree();

    // 获取角色已分配的资源ID
    const assignedResourceIds = await this.prisma.roleResource.findMany({
      where: { roleId },
      select: { resourceId: true }
    });

    const assignedIds = new Set(assignedResourceIds.map(ar => ar.resourceId));

    // 标记权限状态
    const markPermissionStatus = (nodes: any[]): any[] => {
      return nodes.map(node => {
        const isAssigned = assignedIds.has(node.id);
        const children = node.children && node.children.length > 0 
          ? markPermissionStatus(node.children) 
          : [];

        // 计算是否有子节点被选中（用于确定 indeterminate 状态）
        const hasAssignedChildren = children.some(child => 
          child.isAssigned || child.isIndeterminate
        );

        return {
          ...node,
          isAssigned,
          isIndeterminate: !isAssigned && hasAssignedChildren,
          children,
          // 确保树形结构字段标准化
          level: node.level,
          parentId: node.parentId,
          resourceType: node.type,
          resourceUrl: node.path,
          resourceName: node.name,
          resourceId: node.id
        };
      });
    };

    const markedTree = markPermissionStatus(allResources);

    return {
      roleId,
      roleName: role.name,
      permissionTree: markedTree
    };
  }

  /**
   * 批量分配权限
   */
  async batchAssignPermissions(roleId: string, grantResourceIds: string[], revokeResourceIds: string[]) {
    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException(`角色ID "${roleId}" 不存在`);
    }

    // 检查要授予的资源是否存在
    if (grantResourceIds.length > 0) {
      const resources = await this.prisma.resource.findMany({
        where: {
          id: { in: grantResourceIds }
        }
      });

      if (resources.length !== grantResourceIds.length) {
        throw new BadRequestException('部分要授予的资源不存在');
      }
    }

    // 检查要撤销的资源是否存在
    if (revokeResourceIds.length > 0) {
      const resources = await this.prisma.resource.findMany({
        where: {
          id: { in: revokeResourceIds }
        }
      });

      if (resources.length !== revokeResourceIds.length) {
        throw new BadRequestException('部分要撤销的资源不存在');
      }
    }

    // 事务处理权限分配
    await this.prisma.$transaction(async (tx) => {
      // 撤销权限
      if (revokeResourceIds.length > 0) {
        await tx.roleResource.deleteMany({
          where: {
            roleId,
            resourceId: { in: revokeResourceIds }
          }
        });
      }

      // 授予权限
      if (grantResourceIds.length > 0) {
        // 先删除可能存在的重复关联
        await tx.roleResource.deleteMany({
          where: {
            roleId,
            resourceId: { in: grantResourceIds }
          }
        });

        // 创建新的关联
        await tx.roleResource.createMany({
          data: grantResourceIds.map(resourceId => ({
            roleId,
            resourceId
          }))
        });
      }
    });

    return { message: '权限批量分配成功' };
  }

  /**
   * 获取角色权限统计
   */
  async getRolePermissionStats(roleId: string) {
    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException(`角色ID "${roleId}" 不存在`);
    }

    // 获取资源统计
    const [totalResources, assignedResources] = await Promise.all([
      this.prisma.resource.count(),
      this.prisma.roleResource.count({
        where: { roleId }
      })
    ]);

    // 按资源类型统计
    const typeStats = await this.prisma.roleResource.groupBy({
      by: ['resourceId'],
      where: { roleId },
      _count: {
        resourceId: true
      }
    });

    // 获取资源详细信息
    const resourceDetails = await this.prisma.resource.findMany({
      where: {
        id: {
          in: typeStats.map(ts => ts.resourceId)
        }
      }
    });

    const typeDistribution = resourceDetails.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      roleId,
      roleName: role.name,
      totalResources,
      assignedResources,
      unassignedResources: totalResources - assignedResources,
      permissionCoverage: totalResources > 0 ? (assignedResources / totalResources) * 100 : 0,
      typeDistribution
    };
  }

  /**
   * 检查角色是否具有指定权限
   */
  async checkRolePermission(roleId: string, resourceId: string): Promise<boolean> {
    const roleResource = await this.prisma.roleResource.findFirst({
      where: {
        roleId,
        resourceId
      }
    });

    return !!roleResource;
  }

  /**
   * 获取角色权限差异
   */
  async getRolePermissionDiff(roleId: string, targetResourceIds: string[]) {
    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException(`角色ID "${roleId}" 不存在`);
    }

    // 获取角色当前权限
    const currentPermissions = await this.prisma.roleResource.findMany({
      where: { roleId },
      select: { resourceId: true }
    });

    const currentIds = new Set(currentPermissions.map(cp => cp.resourceId));
    const targetIds = new Set(targetResourceIds);

    // 计算差异
    const toGrant = targetResourceIds.filter(id => !currentIds.has(id));
    const toRevoke = Array.from(currentIds).filter(id => !targetIds.has(id));
    const unchanged = targetResourceIds.filter(id => currentIds.has(id));

    // 获取资源详细信息
    const allResourceIds = [...toGrant, ...toRevoke];
    const resources = await this.prisma.resource.findMany({
      where: {
        id: { in: allResourceIds }
      }
    });

    const resourceMap = new Map(resources.map(r => [r.id, r]));

    return {
      roleId,
      roleName: role.name,
      toGrant: toGrant.map(id => ({
        resourceId: id,
        resourceName: resourceMap.get(id)?.name || 'Unknown',
        resourceType: resourceMap.get(id)?.type || 'Unknown'
      })),
      toRevoke: toRevoke.map(id => ({
        resourceId: id,
        resourceName: resourceMap.get(id)?.name || 'Unknown',
        resourceType: resourceMap.get(id)?.type || 'Unknown'
      })),
      unchangedCount: unchanged.length,
      totalChanges: toGrant.length + toRevoke.length
    };
  }
}