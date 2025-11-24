import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { DataNotFoundException, ValidationException, ConflictException } from '../../../common/exceptions'
import { PaginationRequest } from '../../../shared/common'

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建角色
   */
  async create(data: { name: string; description?: string; is_active?: boolean; is_super_admin?: boolean }) {
    this.logger.log(`创建角色: ${data.name}`)

    // 验证角色名称
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationException('角色名称不能为空')
    }

    // 检查角色名称是否已存在
    const existingRole = await this.prisma.client.role.findUnique({
      where: { name: data.name.trim() }
    })

    if (existingRole) {
      throw new ConflictException(`角色名称 ${data.name} 已存在`)
    }

    return this.prisma.client.role.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        isActive: data.is_active !== false, // 默认为 true
        isSuperAdmin: data.is_super_admin || false // 默认为 false
      }
    })
  }

  /**
   * 获取角色详情
   */
  async findOne(id: string) {
    this.logger.log(`获取角色详情: ${id}`)

    // 验证角色ID格式
    if (!id) {
      throw new ValidationException('角色ID不能为空')
    }

    const role = await this.prisma.client.role.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: {
            permission: true
          }
        },
        role_resources: {
          include: {
            resource: true
          }
        },
        user_roles: {
          include: {
            user: true
          }
        }
      }
    })

    if (!role) {
      throw new DataNotFoundException('角色', id)
    }

    return role
  }

  /**
   * 获取角色列表
   */
  async findAll(options?: { search?: string; is_active?: boolean; is_super_admin?: boolean; pagination?: PaginationRequest }) {
    this.logger.log(`查询角色列表: ${JSON.stringify(options)}`)

    let skip: number | undefined
    let take: number | undefined

    if (options?.pagination) {
      const { page, pageSize } = options.pagination
      skip = (page - 1) * pageSize
      take = pageSize
    }

    // 构建查询条件
    const where: any = {}

    // 搜索关键词
    if (options?.search) {
      where.OR = [{ name: { contains: options.search, mode: 'insensitive' } }, { description: { contains: options.search, mode: 'insensitive' } }]
    }

    // 激活状态过滤
    if (options?.is_active !== undefined) {
      where.isActive = options.is_active
    }

    // 超级管理员过滤
    if (options?.is_super_admin !== undefined) {
      where.isSuperAdmin = options.is_super_admin
    }

    let data: any[]
    let total: number

    if (options?.pagination) {
      // 使用事务同时获取总数和数据
      ;[total, data] = await this.prisma.$transaction([
        this.prisma.client.role.count({ where }),
        this.prisma.client.role.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' }
        })
      ])
    } else {
      // 查询所有数据
      data = await this.prisma.client.role.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
      total = data.length
    }

    // 转换日期字段为字符串
    const convertedData = data.map((role) => ({
      ...role,
      createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : role.createdAt,
      updatedAt: role.updatedAt instanceof Date ? role.updatedAt.toISOString() : role.updatedAt
    }))

    return {
      data: convertedData,
      total
    }
  }

  /**
   * 更新角色
   */
  async update(
    id: string,
    data: {
      name?: string
      description?: string
      is_active?: boolean
      is_super_admin?: boolean
    }
  ) {
    this.logger.log(`更新角色: ${id}`)

    // 验证角色ID
    if (!id) {
      throw new ValidationException('角色ID不能为空')
    }

    // 验证角色存在
    const existingRole = await this.findOne(id)

    // 如果更新角色名称，验证名称唯一性
    if (data.name && data.name !== existingRole.name) {
      if (!data.name.trim().length) {
        throw new ValidationException('角色名称不能为空')
      }

      // 检查新名称是否已存在
      const existingRoleWithNewName = await this.prisma.client.role.findUnique({
        where: { name: data.name.trim() }
      })

      if (existingRoleWithNewName) {
        throw new ConflictException(`角色名称 ${data.name} 已存在`)
      }
    }

    // 构建更新数据
    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim()
    }

    if (data.is_active !== undefined) {
      updateData.isActive = data.is_active
    }

    if (data.is_super_admin !== undefined) {
      updateData.isSuperAdmin = data.is_super_admin
    }

    return this.prisma.client.role.update({
      where: { id },
      data: updateData
    })
  }

  /**
   * 删除角色
   */
  async remove(id: string) {
    this.logger.log(`删除角色: ${id}`)

    // 验证角色ID
    if (!id) {
      throw new ValidationException('角色ID不能为空')
    }

    // 验证角色存在
    const existingRole = await this.findOne(id)

    // 超级管理员角色不能删除
    if (existingRole.isSuperAdmin) {
      throw new BadRequestException('超级管理员角色不能删除')
    }

    // 检查是否有关联用户
    const userCount = await this.prisma.client.userRole.count({
      where: { roleId: id }
    })

    if (userCount > 0) {
      throw new BadRequestException(`无法删除角色，存在 ${userCount} 个用户关联此角色`)
    }

    return this.prisma.client.role.delete({
      where: { id }
    })
  }

  /**
   * 分配用户到角色
   */
  async assignUsersToRole(roleId: string, userIds: string[]) {
    this.logger.log(`分配用户到角色: ${roleId}, 用户数量: ${userIds.length}`)

    // 验证参数
    if (!roleId) {
      throw new ValidationException('角色ID不能为空')
    }

    if (!userIds || userIds.length === 0) {
      throw new ValidationException('用户ID列表不能为空')
    }

    // 验证角色存在
    const existingRole = await this.findOne(roleId)

    // 验证所有用户存在
    const users = await this.prisma.client.user.findMany({
      where: { phone: { in: userIds } }
    })

    if (users.length !== userIds.length) {
      throw new DataNotFoundException('用户', '部分用户不存在')
    }

    // 使用事务确保数据一致性
    return this.prisma.$transaction(async (tx) => {
      // 删除现有关联
      await tx.userRole.deleteMany({
        where: { roleId, user: { phone: { in: userIds } } }
      })

      // 创建新关联
      const createData = userIds.map((phone) => ({
        roleId,
        user: { connect: { phone } }
      }))

      await tx.userRole.createMany({
        data: createData,
        skipDuplicates: true
      })

      this.logger.log(`成功为角色 ${roleId} 分配 ${userIds.length} 个用户`)
      return { success: true, assignedCount: userIds.length }
    })
  }

  /**
   * 移除角色用户
   */
  async removeUsersFromRole(roleId: string, userIds: string[]) {
    this.logger.log(`移除角色用户: ${roleId}, 用户数量: ${userIds.length}`)

    // 验证参数
    if (!roleId) {
      throw new ValidationException('角色ID不能为空')
    }

    if (!userIds || userIds.length === 0) {
      throw new ValidationException('用户ID列表不能为空')
    }

    // 验证角色存在
    await this.findOne(roleId)

    // 删除关联
    const deletedCount = await this.prisma.client.userRole.deleteMany({
      where: {
        roleId,
        userId: { in: userIds }
      }
    })

    this.logger.log(`成功从角色 ${roleId} 移除 ${deletedCount.count} 个用户`)
    return { success: true, removedCount: deletedCount.count }
  }

  /**
   * 获取角色用户列表
   */
  async getRoleUsers(roleId: string, pagination?: PaginationRequest) {
    this.logger.log(`获取角色用户: ${roleId}`)

    // 验证参数
    if (!roleId) {
      throw new ValidationException('角色ID不能为空')
    }

    // 验证角色存在并获取角色信息
    const existingRole = await this.findOne(roleId)

    let skip: number | undefined
    let take: number | undefined

    if (pagination) {
      const { page, pageSize } = pagination
      skip = (page - 1) * pageSize
      take = pageSize
    }

    // 查询角色用户关联
    const roleUsers = await this.prisma.client.userRole.findMany({
      where: { roleId },
      include: {
        user: {
          select: {
            phone: true,
            username: true,
            status: true,
            statusDesc: true,
            createdAt: true
          }
        }
      },
      skip,
      take,
      orderBy: { assignedAt: 'desc' }
    })

    // 转换用户时间字段格式
    const convertedUsers = roleUsers.map((ur) => ({
      ...ur.user,
      createdAt: ur.user.createdAt.toISOString()
    }))

    // 提取用户ID列表
    const userIds = convertedUsers.map((user) => user.phone)

    // 转换角色时间字段格式
    const convertedRole = {
      ...existingRole,
      createdAt: existingRole.createdAt.toISOString(),
      updatedAt: existingRole.updatedAt.toISOString()
    }

    return {
      role: convertedRole,
      data: userIds,
      users: convertedUsers,
      total: await this.prisma.client.userRole.count({ where: { roleId } })
    }
  }

  /**
   * 分配权限给角色
   */
  async assignResourcesToRole(roleId: string, resourceIds: string[]) {
    this.logger.log(`分配权限给角色: ${roleId}, 资源数量: ${resourceIds.length}`)

    // 验证参数
    if (!roleId) {
      throw new ValidationException('角色ID不能为空')
    }

    if (!resourceIds || resourceIds.length === 0) {
      throw new ValidationException('资源ID列表不能为空')
    }

    // 验证角色存在
    const existingRole = await this.findOne(roleId)

    // 验证所有资源存在
    const resources = await this.prisma.client.resource.findMany({
      where: { id: { in: resourceIds } }
    })

    if (resources.length !== resourceIds.length) {
      throw new DataNotFoundException('资源', '部分资源不存在')
    }

    // 使用事务确保数据一致性
    return this.prisma.$transaction(async (tx) => {
      // 删除现有关联
      await tx.roleResource.deleteMany({
        where: { roleId, resourceId: { in: resourceIds } }
      })

      // 创建新关联
      const createData = resourceIds.map((resourceId) => ({
        roleId,
        resourceId
      }))

      await tx.roleResource.createMany({
        data: createData,
        skipDuplicates: true
      })

      this.logger.log(`成功为角色 ${roleId} 分配 ${resourceIds.length} 个资源权限`)
      return { success: true, assignedCount: resourceIds.length }
    })
  }

  /**
   * 移除角色权限
   */
  async removeResourcesFromRole(roleId: string, resourceIds: string[]) {
    this.logger.log(`移除角色权限: ${roleId}, 资源数量: ${resourceIds.length}`)

    // 验证参数
    if (!roleId) {
      throw new ValidationException('角色ID不能为空')
    }

    if (!resourceIds || resourceIds.length === 0) {
      throw new ValidationException('资源ID列表不能为空')
    }

    // 验证角色存在
    await this.findOne(roleId)

    // 删除关联
    const deletedCount = await this.prisma.client.roleResource.deleteMany({
      where: {
        roleId,
        resourceId: { in: resourceIds }
      }
    })

    this.logger.log(`成功从角色 ${roleId} 移除 ${deletedCount.count} 个资源权限`)
    return { success: true, removedCount: deletedCount.count }
  }

  /**
   * 获取角色权限树
   */
  async getRoleResources(roleId: string) {
    this.logger.log(`获取角色权限树: ${roleId}`)

    // 验证参数
    if (!roleId) {
      throw new ValidationException('角色ID不能为空')
    }

    // 验证角色存在并获取完整信息
    const role = await this.findOne(roleId)

    // 获取角色的所有资源权限
    const roleResources = await this.prisma.client.roleResource.findMany({
      where: { roleId },
      include: {
        resource: {
          include: {
            children: true
          }
        }
      }
    })

    // 转换资源时间字段格式
    const convertedResources = roleResources.map((rr) => ({
      ...rr.resource,
      createdAt: rr.resource.createdAt.toISOString(),
      updatedAt: rr.resource.updatedAt.toISOString()
    }))

    // 构建权限树结构
    const permissionTree = this.buildResourceTree(convertedResources)

    return {
      role: {
        ...role,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString()
      },
      permissionTree,
      permissions: convertedResources
    }
  }

  /**
   * 构建资源树
   */
  private buildResourceTree(resources: any[], parentId?: string): any[] {
    return resources
      .filter((resource) => resource.parentId === parentId)
      .map((resource) => ({
        resource: {
          ...resource,
          createdAt: resource.createdAt instanceof Date ? resource.createdAt.toISOString() : resource.createdAt,
          updatedAt: resource.updatedAt instanceof Date ? resource.updatedAt.toISOString() : resource.updatedAt
        },
        is_assigned: true, // 这些都是已分配的资源
        is_indeterminate: false,
        children: this.buildResourceTree(resources, resource.id)
      }))
  }

  /**
   * 验证角色数据
   */
  validateRoleData(data: any): void {
    if (!data.name || typeof data.name !== 'string') {
      throw new ValidationException('角色名称必须为字符串且不能为空')
    }

    if (data.name.trim().length < 2 || data.name.trim().length > 50) {
      throw new ValidationException('角色名称长度必须在2-50个字符之间')
    }

    if (data.description && typeof data.description !== 'string') {
      throw new ValidationException('角色描述必须为字符串')
    }

    if (data.description && data.description.length > 200) {
      throw new ValidationException('角色描述长度不能超过200个字符')
    }
  }

  /**
   * 检查角色是否存在
   */
  async checkRoleExists(id: string): Promise<boolean> {
    if (!id) return false

    const role = await this.prisma.client.role.findUnique({
      where: { id }
    })

    return !!role
  }

  /**
   * 获取角色统计信息
   */
  async getRoleStatistics() {
    const [totalRoles, activeRoles, superAdminRoles, totalUserRoleAssignments] = await Promise.all([this.prisma.client.role.count(), this.prisma.client.role.count({ where: { isActive: true } }), this.prisma.client.role.count({ where: { isSuperAdmin: true } }), this.prisma.client.userRole.count()])

    return {
      totalRoles,
      activeRoles,
      inactiveRoles: totalRoles - activeRoles,
      superAdminRoles,
      regularRoles: totalRoles - superAdminRoles,
      totalUserRoleAssignments,
      averageUsersPerRole: totalRoles > 0 ? (totalUserRoleAssignments / totalRoles).toFixed(2) : 0
    }
  }
}
