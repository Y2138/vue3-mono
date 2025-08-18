import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    this.logger.log('获取所有角色');
    return this.prisma.client.role.findMany({
      include: { 
        rolePermissions: { 
          include: { 
            permission: true 
          } 
        }
      },
    });
  }

  async findAllBasic() {
    this.logger.log('获取所有角色（基础信息）');
    return this.prisma.client.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    this.logger.log(`根据ID ${id} 获取角色`);
    const role = await this.prisma.client.role.findUnique({
      where: { id },
      include: { 
        rolePermissions: { 
          include: { 
            permission: true 
          } 
        },
        userRoles: {
          include: {
            user: true
          }
        }
      },
    });
    
    if (!role) {
      this.logger.error(`角色ID ${id} 不存在`);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    return role;
  }

  async findByName(name: string) {
    this.logger.log(`根据名称 ${name} 获取角色`);
    const role = await this.prisma.client.role.findUnique({
      where: { name },
      include: { 
        rolePermissions: { 
          include: { 
            permission: true 
          } 
        },
        userRoles: {
          include: {
            user: true
          }
        }
      },
    });
    
    if (!role) {
      this.logger.error(`角色名称 ${name} 不存在`);
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    
    return role;
  }

  async create(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }) {
    this.logger.log(`创建角色: ${data.name}`);
    const { permissionIds, ...roleData } = data;

    // 创建角色
    const roleCreateData: any = {
      ...roleData
    };

    // 如果提供了权限ID，添加关联
    if (permissionIds?.length) {
      roleCreateData.rolePermissions = {
        create: permissionIds.map(permissionId => ({
          permission: {
            connect: { id: permissionId }
          }
        }))
      };
    }

    return this.prisma.client.role.create({
      data: roleCreateData,
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      permissionIds?: string[];
    },
  ) {
    this.logger.log(`更新角色: ${id}`);
    const { permissionIds, ...roleData } = data;
    
    // 确保角色存在
    await this.findById(id);

    // 如果提供了权限ID，更新关联
    if (permissionIds !== undefined) {
      // 先删除所有现有的权限关联
      await this.prisma.client.rolePermission.deleteMany({
        where: { roleId: id }
      });
      
      // 然后创建新的权限关联
      if (permissionIds.length > 0) {
        await this.prisma.client.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: id,
            permissionId
          }))
        });
      }
    }

    // 更新角色基本信息
    return this.prisma.client.role.update({
      where: { id },
      data: roleData,
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`删除角色: ${id}`);
    
    // 确保角色存在
    await this.findById(id);
    
    // 删除角色与权限的关联
    await this.prisma.client.rolePermission.deleteMany({
      where: { roleId: id }
    });
    
    // 删除角色与用户的关联
    await this.prisma.client.userRole.deleteMany({
      where: { roleId: id }
    });
    
    // 删除角色
    await this.prisma.client.role.delete({
      where: { id }
    });
  }

  async addPermissions(roleId: string, permissionIds: string[]) {
    this.logger.log(`添加权限到角色 ${roleId}`);
    
    // 确保角色存在
    await this.findById(roleId);
    
    // 获取角色现有的权限ID
    const existingRolePermissions = await this.prisma.client.rolePermission.findMany({
      where: { roleId }
    });
    
    const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permissionId));
    
    // 过滤出新的权限ID
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.has(id));
    
    // 添加新的权限关联
    if (newPermissionIds.length > 0) {
      await this.prisma.client.rolePermission.createMany({
        data: newPermissionIds.map(permissionId => ({
          roleId,
          permissionId
        })),
        skipDuplicates: true
      });
    }
    
    // 返回更新后的角色
    return this.prisma.client.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async removePermissions(roleId: string, permissionIds: string[]) {
    this.logger.log(`从角色 ${roleId} 移除权限`);
    
    // 确保角色存在
    await this.findById(roleId);
    
    // 删除指定的权限关联
    await this.prisma.client.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds
        }
      }
    });
    
    // 返回更新后的角色
    return this.prisma.client.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async setPermissions(roleId: string, permissionIds: string[]) {
    this.logger.log(`设置角色 ${roleId} 的权限`);
    
    // 确保角色存在
    await this.findById(roleId);
    
    // 删除所有现有权限关联
    await this.prisma.client.rolePermission.deleteMany({
      where: { roleId }
    });
    
    // 创建新的权限关联
    if (permissionIds.length > 0) {
      await this.prisma.client.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId,
          permissionId
        }))
      });
    }
    
    // 返回更新后的角色
    return this.prisma.client.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }
} 