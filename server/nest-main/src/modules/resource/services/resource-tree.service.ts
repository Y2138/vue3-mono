import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { ResourceType as PrismaResourceType } from '@prisma/client'
import { isValidResourceType } from '@/modules/resource/enums/resource.enums'

@Injectable()
export class ResourceTreeService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取完整的资源树
   */
  async getResourceTree(): Promise<any[]> {
    const resources = await this.prisma.client?.resource.findMany({
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    })

    // 构建树形结构
    const treeData = this.buildTreeFromList(resources || [])
    return treeData
  }

  /**
   * 根据类型获取资源树
   */
  async getResourceTreeByType(type: number): Promise<any[]> {
    // 验证资源类型有效性
    if (!isValidResourceType(type)) {
      throw new BadRequestException('无效的资源类型')
    }

    // 将业务枚举值转换为Prisma枚举值
    const typeMap = {
      0: PrismaResourceType.PAGE,
      1: PrismaResourceType.API,
      2: PrismaResourceType.BUTTON
    }
    const prismaType = typeMap[type as keyof typeof typeMap]

    const resources = await this.prisma.resource.findMany({
      where: { type: prismaType },
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    })

    // 构建树形结构
    const treeData = this.buildTreeFromList(resources || [])
    return treeData
  }

  /**
   * 获取子级资源
   */
  async getSubtree(resourceId: string): Promise<any | null> {
    const parentResource = await this.prisma.client?.resource.findUnique({
      where: { id: resourceId }
    })

    if (!parentResource) {
      return null
    }

    // 直接使用 Prisma 查询结果并添加 children 属性
    const result = {
      ...parentResource,
      children: await this.getChildrenRecursive(resourceId)
    }

    return result
  }

  /**
   * 获取资源的完整路径
   */
  async getResourcePath(id: string): Promise<any[]> {
    const resource = await this.prisma.client?.resource.findUnique({
      where: { id }
    })

    if (!resource) {
      return []
    }

    const pathNodes: any[] = []
    let currentResource = resource

    // 从当前资源向上遍历到根节点
    while (currentResource) {
      pathNodes.unshift(currentResource)

      if (currentResource.parentId) {
        const parent = await this.prisma.client?.resource.findUnique({
          where: { id: currentResource.parentId }
        })
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
   * 移动资源到新的父级
   */
  async moveResource(resourceId: string, newParentId: string | null): Promise<any> {
    const resource = await this.prisma.client?.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource) {
      throw new NotFoundException('资源不存在')
    }

    // 检查新父级是否存在
    if (newParentId) {
      const newParent = await this.prisma.client?.resource.findUnique({
        where: { id: newParentId }
      })

      if (!newParent) {
        throw new NotFoundException('新父级资源不存在')
      }

      // 检查是否会形成循环引用
      if (await this.willCreateCircularReference(resourceId, newParentId)) {
        throw new BadRequestException('不能将资源设置为其子级资源的子级')
      }
    }

    // 更新父级和层级
    let newLevel = 0
    let newPath = '/' + resource.name

    if (newParentId) {
      const newParent = await this.prisma.client?.resource.findUnique({ where: { id: newParentId } })
      if (newParent) {
        newLevel = newParent.level + 1
        newPath = newParent.path + '/' + resource.name
      }
    }

    // 如果有子级资源，需要更新所有子级的路径和层级
    await this.updateChildrenPaths(resourceId, newLevel + 1, newPath)

    const updatedResource = await this.prisma.client?.resource.update({
      where: { id: resourceId },
      data: {
        parentId: newParentId,
        level: newLevel,
        path: newPath
      }
    })

    return updatedResource
  }

  /**
   * 复制资源
   */
  async duplicateResource(resourceId: string, newParentId?: string, newName?: string): Promise<any> {
    const originalResource = await this.prisma.client?.resource.findUnique({
      where: { id: resourceId },
      include: { children: true }
    })

    if (!originalResource) {
      throw new NotFoundException('资源不存在')
    }

    // 确定新资源的层级和路径
    let newLevel = 0
    let newPath = '/' + (newName || `${originalResource.name}_copy`)

    if (newParentId) {
      const newParent = await this.prisma.client?.resource.findUnique({ where: { id: newParentId } })
      if (newParent) {
        newLevel = newParent.level + 1
        newPath = newParent.path + '/' + (newName || `${originalResource.name}_copy`)
      }
    }

    // 创建新资源
    const newResource = await this.prisma.client?.resource.create({
      data: {
        name: newName || `${originalResource.name}_copy`,
        type: originalResource.type,
        parentId: newParentId || originalResource.parentId,
        description: originalResource.description,
        level: newLevel,
        path: newPath
      }
    })

    // 递归复制子级资源
    if (originalResource.children && originalResource.children.length > 0) {
      for (const child of originalResource.children) {
        await this.duplicateResourceRecursive(child.id, newResource.id)
      }
    }

    return newResource
  }

  /**
   * 验证树形结构的完整性
   */
  async validateTree(): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const resources = await this.prisma.client?.resource.findMany()
    const errors: string[] = []

    // 检查每个资源的父级是否存在
    for (const resource of resources) {
      if (resource.parentId) {
        const parent = await this.prisma.client?.resource.findUnique({
          where: { id: resource.parentId }
        })

        if (!parent) {
          errors.push(`资源 ${resource.name} (${resource.id}) 的父级不存在`)
        }
      }
    }

    // 检查是否有循环引用
    for (const resource of resources) {
      if (await this.hasCircularReference(resource.id)) {
        errors.push(`资源 ${resource.name} (${resource.id}) 存在循环引用`)
      }
    }

    // 检查层级是否正确
    for (const resource of resources) {
      if (resource.parentId) {
        const parent = await this.prisma.client?.resource.findUnique({
          where: { id: resource.parentId }
        })

        if (parent && resource.level !== parent.level + 1) {
          errors.push(`资源 ${resource.name} (${resource.id}) 的层级不正确，期望: ${parent.level + 1}, 实际: ${resource.level}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 从列表构建树形结构
   */
  private buildTreeFromList(resources: any[]): any[] {
    const resourceMap = new Map<string, any>()
    const rootResources: any[] = []

    // 先将所有资源放入Map中，为每个资源添加children数组
    resources.forEach((resource) => {
      const treeNode = { ...resource, children: [] }
      resourceMap.set(resource.id, treeNode)
    })

    // 构建树形结构
    resources.forEach((resource) => {
      const resourceNode = resourceMap.get(resource.id)

      if (resourceNode) {
        if (resource.parentId) {
          const parent = resourceMap.get(resource.parentId)
          if (parent) {
            parent.children.push(resourceNode)
          }
        } else {
          rootResources.push(resourceNode)
        }
      }
    })

    return rootResources
  }

  /**
   * 递归获取子级资源
   */
  private async getChildrenRecursive(parentId: string): Promise<any[]> {
    const children =
      (await this.prisma.client?.resource.findMany({
        where: { parentId },
        orderBy: { name: 'asc' }
      })) || []

    const childrenTree: any[] = []

    for (const child of children) {
      const childNode: any = { ...child, children: [] }
      childNode.children = await this.getChildrenRecursive(child.id)
      childrenTree.push(childNode)
    }

    return childrenTree
  }

  /**
   * 更新子级资源的路径和层级
   */
  private async updateChildrenPaths(parentId: string, newLevel: number, newPath: string): Promise<void> {
    const children =
      (await this.prisma.client?.resource.findMany({
        where: { parentId }
      })) || []

    for (const child of children) {
      const childPath = newPath + '/' + child.name

      // 更新当前子级
      await this.prisma.client?.resource.update({
        where: { id: child.id },
        data: {
          level: newLevel,
          path: childPath
        }
      })

      // 递归更新子级的子级
      await this.updateChildrenPaths(child.id, newLevel + 1, childPath)
    }
  }

  /**
   * 递归复制资源
   */
  private async duplicateResourceRecursive(sourceId: string, newParentId: string): Promise<void> {
    const sourceResource = await this.prisma.client?.resource.findUnique({
      where: { id: sourceId },
      include: { children: true }
    })

    if (!sourceResource) {
      return
    }

    // 获取新父级信息
    const newParent = await this.prisma.client?.resource.findUnique({
      where: { id: newParentId }
    })

    if (!newParent) {
      return
    }

    // 创建新资源
    const newResource = await this.prisma.client?.resource.create({
      data: {
        name: sourceResource.name,
        type: sourceResource.type,
        description: sourceResource.description,
        parentId: newParentId,
        level: newParent.level + 1,
        path: newParent.path + '/' + sourceResource.name
      }
    })

    // 递归复制子资源
    if (sourceResource.children && sourceResource.children.length > 0) {
      for (const child of sourceResource.children) {
        await this.duplicateResourceRecursive(child.id, newResource.id)
      }
    }
  }

  /**
   * 检查是否会创建循环引用
   */
  private async willCreateCircularReference(resourceId: string, targetParentId: string | null): Promise<boolean> {
    if (!targetParentId) {
      return false
    }
    if (resourceId === targetParentId) {
      return true
    }

    const targetParent = await this.prisma.client?.resource.findUnique({
      where: { id: targetParentId }
    })

    if (!targetParent) {
      return false
    }

    // 递归检查目标父级的父级
    return this.willCreateCircularReference(resourceId, targetParent.parentId)
  }

  /**
   * 检查是否有循环引用
   */
  private async hasCircularReference(resourceId: string): Promise<boolean> {
    const visited = new Set<string>()
    return this.detectCircularReference(resourceId, visited)
  }

  /**
   * 检测循环引用
   */
  private async detectCircularReference(resourceId: string, visited: Set<string>): Promise<boolean> {
    if (visited.has(resourceId)) {
      return true
    }

    visited.add(resourceId)

    const resource = await this.prisma.client?.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource || !resource.parentId) {
      return false
    }

    return this.detectCircularReference(resource.parentId, visited)
  }


}
