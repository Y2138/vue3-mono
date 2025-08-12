import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Permission } from '@prisma/client';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(): Promise<Permission[]> {
    this.logger.log('获取所有权限');
    return this.prisma.client.permission.findMany();
  }

  async findById(id: string): Promise<Permission> {
    this.logger.log(`根据ID ${id} 获取权限`);
    const permission = await this.prisma.client.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!permission) {
      this.logger.error(`权限ID ${id} 不存在`);
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    
    return permission;
  }

  async findByName(name: string): Promise<Permission> {
    this.logger.log(`根据名称 ${name} 获取权限`);
    const permission = await this.prisma.client.permission.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!permission) {
      this.logger.error(`权限名称 ${name} 不存在`);
      throw new NotFoundException(`Permission with name ${name} not found`);
    }
    
    return permission;
  }

  async create(data: {
    name: string;
    action: string;
    resource: string;
    description?: string;
  }): Promise<Permission> {
    this.logger.log(`创建权限: ${data.name}`);
    return this.prisma.client.permission.create({
      data
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      action?: string;
      resource?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<Permission> {
    this.logger.log(`更新权限: ${id}`);
    
    // 确保权限存在
    await this.findById(id);
    
    return this.prisma.client.permission.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`删除权限: ${id}`);
    
    // 确保权限存在
    await this.findById(id);
    
    // 删除权限与角色的关联
    await this.prisma.client.rolePermission.deleteMany({
      where: { permissionId: id }
    });
    
    // 删除权限
    await this.prisma.client.permission.delete({
      where: { id }
    });
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission> {
    this.logger.log(`根据资源 ${resource} 和操作 ${action} 获取权限`);
    const permission = await this.prisma.client.permission.findFirst({
      where: { 
        resource,
        action 
      },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!permission) {
      this.logger.error(`权限 ${resource}:${action} 不存在`);
      throw new NotFoundException(`Permission for ${resource}:${action} not found`);
    }
    
    return permission;
  }
} 