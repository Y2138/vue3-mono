import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoleRequest, UpdateRoleRequest, GetRolesRequest, Role } from '@/shared/role';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建角色
   */
  async createRole(createRoleDto: CreateRoleRequest): Promise<Role> {
    const { name, description, isActive = true, isSuperAdmin = false } = createRoleDto;

    // 检查角色名称是否已存在
    const existingRole = await this.prisma.client.role.findFirst({ where: { name } });

    if (existingRole) {
      throw new ConflictException(`角色名称 "${name}" 已存在`);
    }

    const role = await this.prisma.client.role.create({
      data: {
        name,
        description,
        isActive,
        isSuperAdmin
      }
    });

    return {
      ...role,
      description: role.description ?? undefined,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString()
    };
  }

  /**
   * 获取所有角色
   */
  async getRoles(queryDto: GetRolesRequest) {
    const { search, isActive, isSuperAdmin, pagination } = queryDto;
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (typeof isSuperAdmin === 'boolean') {
      where.isSuperAdmin = isSuperAdmin;
    }

    const [roles, total] = await Promise.all([
      this.prisma.client.role.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user_roles: {
            include: {
              user: {
                select: {
                  phone: true,
                  username: true
                }
              }
            }
          },
          role_resources: {
            include: {
              resource: true
            }
          }
        }
      }).then(roles => roles.map(role => ({
        ...role,
        description: role.description ?? undefined,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString()
      }))),
      this.prisma.client.role.count({ where })
    ]);

    return {
      data: roles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  /**
   * 根据ID获取角色
   */
  async getRoleById(id: string) {
    const role = await this.prisma.client.role.findUnique({
      where: { id },
      include: {
        user_roles: {
          include: {
            user: {
              select: {
                phone: true,
                username: true
              }
            }
          }
        },
        role_resources: {
          include: {
            resource: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException(`角色ID "${id}" 不存在`);
    }

    return {
      ...role,
      description: role.description ?? undefined,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString()
    };
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, updateRoleDto: Omit<UpdateRoleRequest, 'id'>): Promise<Role> {
    // 检查角色是否存在
    await this.getRoleById(id);

    // 如果更新名称，检查名称是否已被其他角色使用
    if (updateRoleDto.name) {
      const existingRole = await this.prisma.client.role.findFirst({
        where: {
          name: updateRoleDto.name,
          NOT: { id }
        }
      });

      if (existingRole) {
        throw new ConflictException(`角色名称 "${updateRoleDto.name}" 已被其他角色使用`);
      }
    }

    const role = await this.prisma.client.role.update({
      where: { id },
      data: updateRoleDto
    });

    return {
      ...role,
      description: role.description ?? undefined,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString()
    };
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<void> {
    // 检查角色是否存在
    const role = await this.getRoleById(id);

    // 检查是否有用户分配了这个角色
    if (role.user_roles.length > 0) {
      throw new ConflictException(`无法删除角色 "${role.name}"，该角色已被 ${role.user_roles.length} 个用户使用`);
    }

    // 删除角色资源关联
    await this.prisma.client.roleResource.deleteMany({ where: { roleId: id } });

    // 删除角色权限关联
    await this.prisma.client.rolePermission.deleteMany({ where: { roleId: id } });

    // 删除角色用户关联
    await this.prisma.client.userRole.deleteMany({ where: { roleId: id } });

    // 删除角色
    await this.prisma.client.role.delete({ where: { id } });
  }

  /**
   * 获取角色统计信息
   */
  async getRoleStatistics() {
    const [totalRoles, activeRoles, inactiveRoles] = await Promise.all([
      this.prisma.client.role.count(),
      this.prisma.client.role.count({ where: { isActive: true } }),
      this.prisma.client.role.count({ where: { isActive: false } })
    ]);

    return {
      totalRoles,
      activeRoles,
      inactiveRoles
    };
  }

  /**
   * 检查用户是否具有指定权限
   */
  async checkUserPermission(userId: string, resourceIds: string[]): Promise<boolean> {
    const userRoles = await this.prisma.client.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            role_resources: {
              where: {
                resourceId: {
                  in: resourceIds
                }
              }
            }
          }
        }
      }
    });

    // 检查用户的所有角色中是否有任何一个角色具有所需权限
    for (const userRole of userRoles) {
      if (userRole.role.role_resources.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取用户角色列表
   */
  async getUserRoles(userId: string) {
    const userRoles = await this.prisma.client.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            role_resources: {
              include: {
                resource: true
              }
            }
          }
        }
      }
    });

    return userRoles.map(userRole => ({
      roleId: userRole.roleId,
      roleName: userRole.role.name,
      roleDescription: userRole.role.description,
      assignedAt: userRole.assignedAt,
      permissions: userRole.role.role_resources.map(rr => ({
        resourceId: rr.resourceId,
        resourceName: rr.resource.name,
        resourceType: rr.resource.type,
        resourcePath: rr.resource.path
      }))
    }));
  }
}