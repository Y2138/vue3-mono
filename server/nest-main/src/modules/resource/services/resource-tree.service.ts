import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { isValidResourceType } from '@/modules/resource/enums/resource.enums'
import { ResourceGenerator } from '../utils/resource-generator'

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

    const resources = await this.prisma.resource.findMany({
      where: { type },
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
}
