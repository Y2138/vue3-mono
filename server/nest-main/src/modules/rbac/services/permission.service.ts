import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    this.logger.log('获取所有权限')
    return this.prisma.client.permission.findMany()
  }

  async findById(id: string) {
    this.logger.log(`根据ID ${id} 获取权限`)
    const permission = await this.prisma.client.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    })

    if (!permission) {
      this.logger.error(`权限ID ${id} 不存在`)
      throw new NotFoundException(`Permission with ID ${id} not found`)
    }

    return permission
  }

  async findByName(name: string) {
    this.logger.log(`根据名称 ${name} 获取权限`)
    const permission = await this.prisma.client.permission.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      }
    })

    if (!permission) {
      this.logger.error(`权限名称 ${name} 不存在`)
      throw new NotFoundException(`Permission with name ${name} not found`)
    }

    return permission
  }

  async create(data: { name: string; action: string; resource: string; description?: string }) {
    this.logger.log(`创建权限: ${data.name}`)
    return this.prisma.client.permission.create({
      data
    })
  }

  async update(
    id: string,
    data: {
      name?: string
      action?: string
      resource?: string
      description?: string
      isActive?: boolean
    }
  ) {
    this.logger.log(`更新权限: ${id}`)

    // 确保权限存在
    await this.findById(id)

    return this.prisma.client.permission.update({
      where: { id },
      data
    })
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`删除权限: ${id}`)

    // 确保权限存在
    await this.findById(id)

    // 删除权限与角色的关联
    await this.prisma.client.rolePermission.deleteMany({
      where: { permissionId: id }
    })

    // 删除权限
    await this.prisma.client.permission.delete({
      where: { id }
    })
  }

  async findByResourceAndAction(resource: string, action: string) {
    this.logger.log(`根据资源 ${resource} 和操作 ${action} 获取权限`)
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
    })

    if (!permission) {
      this.logger.error(`权限 ${resource}:${action} 不存在`)
      throw new NotFoundException(`Permission for ${resource}:${action} not found`)
    }

    return permission
  }

  /**
   * 分页查询权限列表
   */
  async findMany(options: { page?: number; pageSize?: number; search?: string; isActive?: boolean; action?: string; resource?: string }) {
    this.logger.log('分页获取权限列表')

    const page = options.page || 1
    const pageSize = options.pageSize || 20
    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where: any = {}

    if (options.search) {
      where.OR = [{ name: { contains: options.search } }, { description: { contains: options.search } }, { resource: { contains: options.search } }, { action: { contains: options.search } }]
    }

    if (options.action) {
      where.action = { contains: options.action }
    }

    if (options.resource) {
      where.resource = { contains: options.resource }
    }

    // 查询总数
    const total = await this.prisma.client.permission.count({ where })

    // 查询数据
    const permissions = await this.prisma.client.permission.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    })

    return {
      permissions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }

  /**
   * 根据 action 和 resource 查找权限
   */
  async findByActionAndResource(action: string, resource: string) {
    this.logger.log(`根据 action: ${action}, resource: ${resource} 查找权限`)

    return await this.prisma.client.permission.findFirst({
      where: {
        action,
        resource
      }
    })
  }

  /**
   * 批量删除权限
   */
  async batchDelete(ids: string[]): Promise<void> {
    this.logger.log(`批量删除权限: ${ids.join(', ')}`)

    await this.prisma.client.permission.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })
  }

  /**
   * 检查用户权限
   */
  async checkUserPermission(userPhone: string, action: string, resource: string): Promise<boolean> {
    this.logger.log(`检查用户 ${userPhone} 的权限: ${resource}:${action}`)

    // 通过用户的角色检查权限
    const userWithRoles = await this.prisma.client.user.findUnique({
      where: { phone: userPhone },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!userWithRoles) {
      return false
    }

    // 检查用户的所有角色是否有该权限
    for (const userRole of userWithRoles.userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        const permission = rolePermission.permission
        if (permission.action === action && permission.resource === resource) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 获取权限统计信息
   */
  async getStats() {
    this.logger.log('获取权限统计信息')

    const totalPermissions = await this.prisma.client.permission.count()
    const activePermissions = totalPermissions // 假设所有权限都是活跃的
    const inactivePermissions = 0

    // 按资源分组统计权限数量
    const permissionsByResource = await this.prisma.client.permission.groupBy({
      by: ['resource'],
      _count: {
        id: true
      }
    })

    const permissionsByResourceMap: Record<string, number> = {}
    permissionsByResource.forEach((item) => {
      permissionsByResourceMap[item.resource || 'unknown'] = item._count.id
    })

    return {
      totalPermissions,
      activePermissions,
      inactivePermissions,
      permissionsByResource: permissionsByResourceMap
    }
  }
}
