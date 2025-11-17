import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { Prisma, Resource as ResourcePrisma, ResourceType as PrismaResourceType } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateResourceRequest, UpdateResourceRequest } from '@/shared/resource'
import { isValidResourceType } from '@/modules/resource/enums/resource.enums'

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建资源
   */
  async create(createResourceRequest: CreateResourceRequest): Promise<ResourcePrisma> {
    const { name, type, path, parentId, description } = createResourceRequest

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

      // 如果有父级ID，验证父级是否存在
      if (parentId) {
        const parent = await this.prisma.resource.findUnique({
          where: { id: parentId }
        })
        if (!parent) {
          throw new NotFoundException(`父级资源不存在，ID: ${parentId}`)
        }
      }

      // 创建资源 - 使用业务枚举验证类型
      const resource = await this.prisma.resource.create({
        data: {
          name,
          type: type as unknown as PrismaResourceType,
          path,
          parentId,
          description,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return resource
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('资源名称已存在')
        }
      }
      throw new BadRequestException('创建资源失败')
    }
  }

  /**
   * 查询所有资源
   */
  async findAll(): Promise<ResourcePrisma[]> {
    try {
      const resources = await this.prisma.resource.findMany({
        orderBy: { createdAt: 'asc' }
      })
      return resources
    } catch (error) {
      throw new InternalServerErrorException(error, '查询资源列表失败')
    }
  }

  /**
   * 获取资源树
   */
  async findTree(): Promise<ResourcePrisma[]> {
    const resources = await this.findAll()
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
    const resource = await this.prisma.client.resource.findUnique({ where: { id } })
    return resource
  }

  /**
   * 更新资源
   */
  async update(id: string, updateResourceRequest: UpdateResourceRequest) {
    try {
      // 验证资源是否存在
      const existingResource = await this.prisma.resource.findUnique({
        where: { id }
      })
      if (!existingResource) {
        throw new NotFoundException(`资源不存在，ID: ${id}`)
      }

      // 更新资源
      const { type, ...updateData } = updateResourceRequest
      const resource = await this.prisma.resource.update({
        where: { id },
        data: {
          ...updateData,
          ...(type !== undefined && { type: type as unknown as PrismaResourceType }),
          updatedAt: new Date()
        }
      })

      return resource
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('资源名称已存在')
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
      const existingResource = await this.prisma.client.resource.findUnique({
        where: { id }
      })
      if (!existingResource) {
        throw new NotFoundException(`资源不存在，ID: ${id}`)
      }

      // 检查是否有子资源
      const children = await this.prisma.client.resource.count({
        where: { parentId: id }
      })
      if (children > 0) {
        throw new BadRequestException('该资源下还有子资源，请先删除子资源')
      }

      // 删除资源
      await this.prisma.client.resource.delete({
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
      // 将业务枚举值转换为Prisma枚举值
      const typeMap = {
        0: PrismaResourceType.PAGE,
        1: PrismaResourceType.API,
        2: PrismaResourceType.BUTTON
      }
      const prismaType = typeMap[type as keyof typeof typeMap]
      const resources = await this.prisma.client.resource.findMany({
        where: { type: prismaType },
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

  /**
   * 根据路径查询资源
   */
  async findByPath(path: string) {
    try {
      if (!path) {
        throw new BadRequestException('资源路径不能为空')
      }
      const resource = await this.prisma.client.resource.findFirst({
        where: { path }
      })
      if (!resource) {
        throw new NotFoundException(`资源不存在，路径: ${path}`)
      }
      return resource
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('根据路径查询资源失败')
    }
  }

  /**
   * 批量删除资源
   */
  async removeMany(ids: string[]): Promise<void> {
    try {
      if (!ids || ids.length === 0) {
        throw new BadRequestException('资源ID列表不能为空')
      }

      // 检查所有资源是否存在
      const existingResources = await this.prisma.client.resource.findMany({
        where: { id: { in: ids } }
      })

      if (existingResources.length !== ids.length) {
        const existingIds = existingResources.map((r) => r.id)
        const missingIds = ids.filter((id) => !existingIds.includes(id))
        throw new NotFoundException(`以下资源不存在: ${missingIds.join(', ')}`)
      }

      // 检查是否有子资源
      const children = await this.prisma.client.resource.count({
        where: { parentId: { in: ids } }
      })
      if (children > 0) {
        throw new BadRequestException('部分资源下还有子资源，请先删除子资源')
      }

      // 批量删除
      await this.prisma.client.resource.deleteMany({
        where: { id: { in: ids } }
      })
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('批量删除资源失败')
    }
  }

  /**
   * 检查是否会创建循环引用
   */
  private async willCreateCircularReference(resourceId: string, targetParentId: string | null): Promise<boolean> {
    if (targetParentId === null) {
      return false
    }
    if (resourceId === targetParentId) {
      return true
    }

    const targetParent = await this.prisma.client.resource.findUnique({
      where: { id: targetParentId }
    })

    if (!targetParent) {
      return false
    }

    // 递归检查目标父级的父级
    return this.willCreateCircularReference(resourceId, targetParent.parentId)
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
