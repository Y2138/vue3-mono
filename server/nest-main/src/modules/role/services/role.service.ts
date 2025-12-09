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
  async create(data: { name: string; description?: string; is_active?: boolean; is_super_admin?: boolean; resource_ids?: string[] }) {
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

    // 使用事务确保数据一致性
    return this.prisma.$transaction(async (tx) => {
      // 创建角色
      const role = await tx.role.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim(),
          isActive: data.is_active !== false, // 默认为 true
          isSuperAdmin: data.is_super_admin || false // 默认为 false
        }
      })

      // 如果提供了资源ID列表，创建角色资源关联
      if (data.resource_ids && data.resource_ids.length > 0) {
        // 验证所有资源存在
        const resources = await tx.resource.findMany({
          where: { id: { in: data.resource_ids } }
        })

        if (resources.length !== data.resource_ids.length) {
          throw new DataNotFoundException('资源', '部分资源不存在')
        }

        // 创建角色资源关联
        const roleResources = data.resource_ids.map((resourceId) => ({
          roleId: role.id,
          resourceId
        }))

        await tx.roleResource.createMany({
          data: roleResources,
          skipDuplicates: true
        })
      }

      return role
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
      resource_ids?: string[]
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

    // 使用事务确保数据一致性
    return this.prisma.$transaction(async (tx) => {
      // 更新角色基本信息
      const updatedRole = await tx.role.update({
        where: { id },
        data: updateData
      })

      // 如果提供了资源ID列表，更新角色资源关联
      if (data.resource_ids !== undefined) {
        // 删除现有关联
        await tx.roleResource.deleteMany({
          where: { roleId: id }
        })

        // 如果资源ID列表不为空，创建新关联
        if (data.resource_ids.length > 0) {
          // 验证所有资源存在
          const resources = await tx.resource.findMany({
            where: { id: { in: data.resource_ids } }
          })

          if (resources.length !== data.resource_ids.length) {
            throw new DataNotFoundException('资源', '部分资源不存在')
          }

          // 创建新的角色资源关联
          const roleResources = data.resource_ids.map((resourceId) => ({
            roleId: id,
            resourceId
          }))

          await tx.roleResource.createMany({
            data: roleResources,
            skipDuplicates: true
          })
        }
      }

      return updatedRole
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
   * 根据角色ID列表聚合查询权限
   * @param roleIds 角色ID列表
   * @returns 资源树和平铺列表
   */
  async getResourcesByRoleIds(roleIds: string[]) {
    this.logger.log(`根据角色ID列表查询权限: ${roleIds.join(', ')}`)

    // 验证角色ID列表不为空
    if (!roleIds || roleIds.length === 0) {
      return {
        tree: [],
        list: []
      }
    }

    // 查询这些角色关联的所有资源
    const roleResources = await this.prisma.client.roleResource.findMany({
      where: {
        roleId: { in: roleIds }
      },
      include: {
        resource: true
      }
    })

    // 收集所有资源ID（去重）
    const resourceIdSet = new Set<string>()
    const resourceMap = new Map<string, any>()

    roleResources.forEach((rr) => {
      if (!resourceIdSet.has(rr.resourceId)) {
        resourceIdSet.add(rr.resourceId)
        resourceMap.set(rr.resourceId, {
          ...rr.resource,
          createdAt: rr.resource.createdAt.toISOString(),
          updatedAt: rr.resource.updatedAt.toISOString()
        })
      }
    })

    // 获取所有资源（包括父级资源，用于构建完整树）
    const allResourceIds = Array.from(resourceIdSet)
    if (allResourceIds.length === 0) {
      return {
        tree: [],
        list: []
      }
    }

    // 查询所有相关资源（包括父级）
    const resources = await this.prisma.client.resource.findMany({
      where: {
        OR: [
          { id: { in: allResourceIds } },
          {
            children: {
              some: {
                id: { in: allResourceIds }
              }
            }
          }
        ]
      },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
    })

    // 转换资源时间字段
    const convertedResources = resources.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))

    // 构建资源树（使用简化的树结构，不包含 is_assigned 等字段）
    const tree = this.buildResourcesTreeForPreview(convertedResources)

    // 过滤出实际拥有的资源（平铺列表）
    const resourceList = convertedResources.filter((r) => resourceIdSet.has(r.id))

    return {
      tree,
      list: resourceList
    }
  }

  /**
   * 构建资源树（用于预览，返回简化的树结构）
   */
  private buildResourcesTreeForPreview(resources: any[], parentId?: string | null): any[] {
    return resources
      .filter((resource) => resource.parentId === parentId)
      .map((resource) => ({
        ...resource,
        children: this.buildResourcesTreeForPreview(resources, resource.id)
      }))
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
   * 获取角色总数
   */
  async getCount(
    options: {
      search?: string
      is_active?: boolean
      is_super_admin?: boolean
    } = {}
  ): Promise<number> {
    this.logger.log(`获取角色总数，查询条件: ${JSON.stringify(options)}`)

    const { search, is_active, is_super_admin } = options

    // 构建查询条件
    const where: any = {}

    if (search && search.trim()) {
      where.OR = [{ name: { contains: search.trim() } }, { description: { contains: search.trim() } }]
    }

    if (is_active !== undefined) {
      where.isActive = is_active
    }

    if (is_super_admin !== undefined) {
      where.isSuperAdmin = is_super_admin
    }

    // 计算总数
    return this.prisma.client.role.count({
      where
    })
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
