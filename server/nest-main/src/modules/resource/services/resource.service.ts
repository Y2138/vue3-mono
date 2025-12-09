import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { Prisma, Resource as ResourcePrisma } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateResourceRequest, UpdateResourceRequest } from '@/shared/resource'
import { PaginationRequest } from '@/shared/common'
import { isValidResourceType, ResourceType } from '@/modules/resource/enums/resource.enums'
import { ResourceGenerator } from '@/modules/resource/utils/resource-generator'
import { isNotEmpty } from '@/utils'

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建资源
   * 根据RBAC权限系统设计方案，自动生成resCode资源码
   * 规则：
   * - page类型：PAGE_{路径}，将路由path中的"/"转换为"_"
   * - api类型：API_{路径}，将接口path中的"/"转换为"_"
   * - module类型：MODULE_{自定义码}，用户手动配置
   */
  async create(createResourceRequest: CreateResourceRequest): Promise<ResourcePrisma> {
    const { name, type, path, parentId, sortOrder, description, suffix } = createResourceRequest

    try {
      // 验证必填字段
      if (!name) {
        throw new BadRequestException('资源名称不能为空')
      }
      if (type === undefined || type === null) {
        throw new BadRequestException('资源类型不能为空')
      }

      // 验证资源类型有效性
      if (!isValidResourceType(type)) {
        throw new BadRequestException('无效的资源类型')
      }
      let parent: ResourcePrisma | null = null
      // 如果有父级ID，验证父级是否存在
      if (parentId) {
        parent = await this.prisma.resource.findUnique({
          where: { id: parentId }
        })
        console.log('parent===>', parent)
        if (!parent) {
          throw new NotFoundException(`父级资源不存在，ID: ${parentId}`)
        }
      }

      // 使用ResourceGenerator工具类生成resCode生成resCode
      // 确保suffix不是null类型
      let resCode = type === ResourceType.MODULE ? ResourceGenerator.generateResCode(type, parent?.path || '', suffix || name) : ResourceGenerator.generateResCode(type, path)

      // 验证生成的resCode格式
      if (!ResourceGenerator.validateResCode(resCode)) {
        throw new BadRequestException(`生成的资源码格式无效: ${resCode}`)
      }

      // 校验sortOrder唯一性 - 同一parentId下不能有相同的sortOrder
      if (sortOrder !== undefined && sortOrder !== null) {
        const existingResourceWithSameOrder = await this.prisma.resource.findFirst({
          where: {
            parentId: parentId || null,
            sortOrder: sortOrder
          }
        })
        if (existingResourceWithSameOrder) {
          throw new BadRequestException(`在相同父级资源下已存在排序值为 ${sortOrder} 的资源`)
        }
      }

      // 创建资源 - 使用业务枚举验证类型，并自动设置resCode
      const createData = {
        name,
        type,
        path,
        resCode, // resCode字段必需
        sortOrder,
        ...(parentId && parentId.trim() !== '' && { parentId }),
        ...(description && description.trim() !== '' && { description }),
        ...(suffix && suffix.trim() !== '' && { suffix }),
        // 自动填充父资源名称
        ...(parentId && parentId.trim() !== '' ? { parentName: parent?.name || '' } : { parentName: null })
      }

      const resource = await this.prisma.resource.create({
        data: createData
      })

      return resource
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('资源名称或资源码已存在')
        }
      }
      throw new BadRequestException('创建资源失败')
    }
  }

  /**
   * 查询所有资源
   */
  async findAll(type?: number | null, name?: string | null, path?: string | null, isActive?: number | null, pagination?: PaginationRequest | null): Promise<{ data: ResourcePrisma[]; total: number }> {
    try {
      const where = {
        ...(isNotEmpty(type) && { type }),
        ...(isNotEmpty(name) && { name: { contains: name, mode: Prisma.QueryMode.insensitive } }),
        ...(isNotEmpty(path) && { path: { equals: path } }),
        ...(isNotEmpty(isActive) && { isActive: isActive === 1 })
      }
      console.log(where)

      let data: ResourcePrisma[]
      let total: number

      if (pagination) {
        const { page, pageSize } = pagination
        const skip = (page - 1) * pageSize
        const take = pageSize

        ;[total, data] = await this.prisma.$transaction([
          this.prisma.resource.count({ where }),
          this.prisma.resource.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'asc' }
          })
        ])
      } else {
        data = await this.prisma.resource.findMany({
          where,
          orderBy: { createdAt: 'asc' }
        })
        total = data.length
      }

      return { data, total }
    } catch (error) {
      throw new InternalServerErrorException(error, '查询资源列表失败')
    }
  }

  /**
   * 获取资源树
   */
  async findTree(): Promise<ResourcePrisma[]> {
    const { data: resources } = await this.findAll()
    return this.buildTree(resources)
  }

  /**
   * 根据ID查询资源
   */
  async findOne(id: string) {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: { id }
      })
      if (!resource) {
        throw new NotFoundException(`资源不存在，ID: ${id}`)
      }
      return resource
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException('查询资源失败')
    }
  }

  /**
   * 根据ID获取资源
   */
  async getResourceById(id: string): Promise<ResourcePrisma | null> {
    const resource = await this.prisma.resource.findUnique({ where: { id } })
    return resource
  }

  /**
   * 获取资源的完整路径
   */
  async getResourcePath(id: string): Promise<ResourcePrisma[]> {
    const resource = await this.prisma.resource.findUnique({ where: { id } })
    if (!resource) {
      return []
    }

    const pathNodes: ResourcePrisma[] = []
    let currentResource = resource

    // 从当前资源向上遍历到根节点
    while (currentResource) {
      pathNodes.unshift(currentResource)

      if (currentResource.parentId) {
        const parent = await this.prisma.resource.findUnique({ where: { id: currentResource.parentId } })
        if (parent) {
          currentResource = parent
        } else {
          break
        }
      } else {
        break
      }
    }

    return pathNodes
  }

  /**
   * 获取资源的祖先路径
   */
  async getResourceAncestors(id: string): Promise<ResourcePrisma[]> {
    const path = await this.getResourcePath(id)
    // 移除最后一个元素（当前资源自身）
    path.pop()
    return path
  }

  /**
   * 更新资源
   * 支持resCode的自动生成和更新逻辑
   * 注意：更新时resCode不会自动重新生成，保持原有值
   */
  async update(id: string, updateResourceRequest: UpdateResourceRequest): Promise<ResourcePrisma> {
    try {
      // 验证资源是否存在
      const existingResource = await this.prisma.resource.findUnique({ where: { id } })
      if (!existingResource) {
        throw new NotFoundException(`资源不存在，ID: ${id}`)
      }

      // 提取并转换字段 - 移除metadata相关字段
      const { type, parentId, ...restUpdateData } = updateResourceRequest

      // 验证资源类型有效性
      if (!isValidResourceType(type)) {
        throw new BadRequestException('无效的资源类型')
      }

      // 如果有父级ID，验证父级是否存在
      let parent: ResourcePrisma | null = null
      if (parentId) {
        parent = await this.prisma.resource.findUnique({
          where: { id: parentId }
        })
        if (!parent) {
          throw new NotFoundException(`父级资源不存在，ID: ${parentId}`)
        }
      }

      // 校验sortOrder唯一性 - 如果更新了sortOrder值
      if (restUpdateData.sortOrder !== undefined && restUpdateData.sortOrder !== null && restUpdateData.sortOrder !== existingResource.sortOrder) {
        // 构建查询条件，排除当前资源自身
        const existingResourceWithSameOrder = await this.prisma.resource.findFirst({
          where: {
            id: { not: id }, // 排除当前正在更新的资源
            parentId: (parentId !== undefined && parentId !== null) ? (parentId.trim() !== '' ? parentId : null) : existingResource.parentId || null,
            sortOrder: restUpdateData.sortOrder
          }
        })
        if (existingResourceWithSameOrder) {
          throw new BadRequestException(`在相同父级资源下已存在排序值为 ${restUpdateData.sortOrder} 的资源`)
        }
      }

      // 构建更新数据
      const updateData: any = {
        ...restUpdateData,
        type,
        ...(parentId !== undefined && parentId !== null && parentId.trim() !== '' && { parentId }),
        // 自动填充父资源名称
        ...(parentId !== undefined && parentId !== null && parentId.trim() !== '' && { parentName: parent?.name || '' }),
        ...(parentId === null && { parentName: null }),
        updatedAt: new Date()
      }

      const resource = await this.prisma.resource.update({
        where: { id },
        data: updateData
      })

      return resource
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('资源名称或资源码已存在')
        }
      }
      throw new BadRequestException('更新资源失败')
    }
  }

  /**
   * 删除单个资源
   */
  async remove(id: string): Promise<void> {
    try {
      // 验证资源是否存在
      const existingResource = await this.prisma.resource.findUnique({
        where: { id }
      })
      if (!existingResource) {
        throw new NotFoundException(`资源不存在，ID: ${id}`)
      }

      // 检查是否有子资源
      const children = await this.prisma.resource.count({
        where: { parentId: id }
      })
      if (children > 0) {
        throw new BadRequestException('该资源下还有子资源，请先删除子资源')
      }

      // 删除资源
      await this.prisma.resource.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('删除资源失败')
    }
  }

  /**
   * 根据类型查询资源
   */
  async findByType(type: number) {
    try {
      if (type === undefined || type === null) {
        throw new BadRequestException('资源类型不能为空')
      }
      const resources = await this.prisma.resource.findMany({
        where: { type },
        orderBy: { createdAt: 'asc' }
      })
      return resources
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('根据类型查询资源失败')
    }
  }

      }


  /**
   * 获取子资源
   */
  async getChildResources(parentId: string): Promise<ResourcePrisma[]> {
    const resources = await this.prisma.client.resource.findMany({
      where: { parentId },
      orderBy: { sortOrder: 'asc' }
    })
    return resources
  }

  /**
   * 构建树形结构
   */
  private buildTree(resources: ResourcePrisma[]): ResourcePrisma[] {
    const resourceMap = new Map<string, ResourcePrisma & { children: (ResourcePrisma & { children: any[] })[] }>()
    const rootResources: (ResourcePrisma & { children: any[] })[] = []

    // 先将所有资源放入Map中，添加children数组
    resources.forEach((resource) => {
      resourceMap.set(resource.id, { ...resource, children: [] })
    })

    // 构建树形结构
    resources.forEach((resource) => {
      const resourceWithChildren = resourceMap.get(resource.id)

      if (resourceWithChildren) {
        if (resource.parentId) {
          const parent = resourceMap.get(resource.parentId)
          if (parent) {
            parent.children.push(resourceWithChildren)
          }
        } else {
          rootResources.push(resourceWithChildren)
        }
      }
    })

    return rootResources
  }
}
