import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { ResourceGenerator } from '../utils/resource-generator'
import { ResourceType } from '../enums/resource.enums'

export interface SeedResource {
  name: string
  type: ResourceType
  path: string
  description?: string
  parentPath?: string
  children?: SeedResource[]
  metadata?: Record<string, any>
}

@Injectable()
export class ResourceSeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // 检查是否已经初始化过
    const existingResources = await this.prisma.client.resource.count()
    if (existingResources > 0) {
      console.log('📁 资源数据已存在，跳过初始化')
      return
    }

    console.log('🌱 开始初始化资源数据...')
    await this.seedResources()
    console.log('✅ 资源数据初始化完成')
  }

  private async seedResources() {
    // 基础系统资源
    const systemResources: SeedResource[] = [
      {
        name: 'system',
        type: ResourceType.PAGE,
        path: '/system',
        description: '系统管理',
        children: [
          {
            name: 'users',
            type: ResourceType.PAGE,
            path: '/system/users',
            description: '用户管理',
            parentPath: '/system',
            children: [
              {
                name: 'user-list',
                type: ResourceType.PAGE,
                path: '/system/users/list',
                description: '用户列表',
                parentPath: '/system/users'
              },
              {
                name: 'user-create',
                type: ResourceType.MODULE,
                path: '/system/users/create',
                description: '创建用户',
                parentPath: '/system/users'
              },
              {
                name: 'user-edit',
                type: ResourceType.MODULE,
                path: '/system/users/edit',
                description: '编辑用户',
                parentPath: '/system/users'
              },
              {
                name: 'user-delete',
                type: ResourceType.MODULE,
                path: '/system/users/delete',
                description: '删除用户',
                parentPath: '/system/users'
              }
            ]
          },
          {
            name: 'roles',
            type: ResourceType.PAGE,
            path: '/system/roles',
            description: '角色管理',
            parentPath: '/system',
            children: [
              {
                name: 'role-list',
                type: ResourceType.PAGE,
                path: '/system/roles/list',
                description: '角色列表',
                parentPath: '/system/roles'
              },
              {
                name: 'role-create',
                type: ResourceType.MODULE,
                path: '/system/roles/create',
                description: '创建角色',
                parentPath: '/system/roles'
              },
              {
                name: 'role-edit',
                type: ResourceType.MODULE,
                path: '/system/roles/edit',
                description: '编辑角色',
                parentPath: '/system/roles'
              },
              {
                name: 'role-delete',
                type: ResourceType.MODULE,
                path: '/system/roles/delete',
                description: '删除角色',
                parentPath: '/system/roles'
              }
            ]
          },
          {
            name: 'resources',
            type: ResourceType.PAGE,
            path: '/system/resources',
            description: '资源管理',
            parentPath: '/system',
            children: [
              {
                name: 'resource-list',
                type: ResourceType.PAGE,
                path: '/system/resources/list',
                description: '资源列表',
                parentPath: '/system/resources'
              },
              {
                name: 'resource-create',
                type: ResourceType.MODULE,
                path: '/system/resources/create',
                description: '创建资源',
                parentPath: '/system/resources'
              },
              {
                name: 'resource-edit',
                type: ResourceType.MODULE,
                path: '/system/resources/edit',
                description: '编辑资源',
                parentPath: '/system/resources'
              },
              {
                name: 'resource-delete',
                type: ResourceType.MODULE,
                path: '/system/resources/delete',
                description: '删除资源',
                parentPath: '/system/resources'
              }
            ]
          }
        ]
      },
      {
        name: 'dashboard',
        type: ResourceType.PAGE,
        path: '/dashboard',
        description: '仪表盘'
      },
      {
        name: 'profile',
        type: ResourceType.PAGE,
        path: '/profile',
        description: '个人资料',
        children: [
          {
            name: 'profile-view',
            type: ResourceType.PAGE,
            path: '/profile/view',
            description: '查看资料',
            parentPath: '/profile'
          },
          {
            name: 'profile-edit',
            type: ResourceType.MODULE,
            path: '/profile/edit',
            description: '编辑资料',
            parentPath: '/profile'
          }
        ]
      }
    ]

    // API资源
    const apiResources: SeedResource[] = [
      {
        name: 'api',
        type: ResourceType.API,
        path: '/api',
        description: 'API资源',
        children: [
          {
            name: 'auth',
            type: ResourceType.API,
            path: '/api/auth',
            description: '认证相关API',
            parentPath: '/api',
            children: [
              {
                name: 'login',
                type: ResourceType.API,
                path: '/api/auth/login',
                description: '用户登录',
                parentPath: '/api/auth'
              },
              {
                name: 'logout',
                type: ResourceType.API,
                path: '/api/auth/logout',
                description: '用户登出',
                parentPath: '/api/auth'
              },
              {
                name: 'refresh',
                type: ResourceType.API,
                path: '/api/auth/refresh',
                description: '刷新Token',
                parentPath: '/api/auth'
              }
            ]
          },
          {
            name: 'users',
            type: ResourceType.API,
            path: '/api/users',
            description: '用户管理API',
            parentPath: '/api',
            children: [
              {
                name: 'user-list',
                type: ResourceType.API,
                path: '/api/users',
                description: '获取用户列表',
                parentPath: '/api/users'
              },
              {
                name: 'user-detail',
                type: ResourceType.API,
                path: '/api/users/:id',
                description: '获取用户详情',
                parentPath: '/api/users'
              },
              {
                name: 'user-create',
                type: ResourceType.API,
                path: '/api/users',
                description: '创建用户',
                parentPath: '/api/users'
              },
              {
                name: 'user-update',
                type: ResourceType.API,
                path: '/api/users/:id',
                description: '更新用户',
                parentPath: '/api/users'
              },
              {
                name: 'user-delete',
                type: ResourceType.API,
                path: '/api/users/:id',
                description: '删除用户',
                parentPath: '/api/users'
              }
            ]
          },
          {
            name: 'resources',
            type: ResourceType.API,
            path: '/api/resources',
            description: '资源管理API',
            parentPath: '/api',
            children: [
              {
                name: 'resource-list',
                type: ResourceType.API,
                path: '/api/resources',
                description: '获取资源列表',
                parentPath: '/api/resources'
              },
              {
                name: 'resource-tree',
                type: ResourceType.API,
                path: '/api/resources/tree',
                description: '获取资源树',
                parentPath: '/api/resources'
              },
              {
                name: 'resource-detail',
                type: ResourceType.API,
                path: '/api/resources/:id',
                description: '获取资源详情',
                parentPath: '/api/resources'
              },
              {
                name: 'resource-create',
                type: ResourceType.API,
                path: '/api/resources',
                description: '创建资源',
                parentPath: '/api/resources'
              },
              {
                name: 'resource-update',
                type: ResourceType.API,
                path: '/api/resources/:id',
                description: '更新资源',
                parentPath: '/api/resources'
              },
              {
                name: 'resource-delete',
                type: ResourceType.API,
                path: '/api/resources/:id',
                description: '删除资源',
                parentPath: '/api/resources'
              }
            ]
          }
        ]
      }
    ]

    // 创建所有资源
    await this.createResources([...systemResources, ...apiResources], null)
  }

  private async createResources(resources: SeedResource[], parentId: string | null) {
    for (const resource of resources) {
      // 计算层级
      const level = parentId ? (await this.getResourceLevel(parentId)) + 1 : 0

      // 创建资源
      const createdResource = await this.prisma.client.resource.create({
        data: {
          name: resource.name,
          type: resource.type,
          parentId,
          path: resource.path,
          description: resource.description,
          resCode: ResourceGenerator.generateResCode(resource.type, resource.path),
          level
        }
      })

      console.log(`✅ 创建资源: ${resource.name} (${resource.type}) - ${resource.path}`)

      // 递归创建子级资源
      if (resource.children && resource.children.length > 0) {
        await this.createResources(resource.children, createdResource.id)
      }
    }
  }

  private async getResourceLevel(resourceId: string): Promise<number> {
    const resource = await this.prisma.client.resource.findUnique({
      where: { id: resourceId },
      select: { level: true }
    })
    return resource?.level || 0
  }

  /**
   * 重置资源数据
   */
  async resetResources() {
    console.log('🔄 重置资源数据...')
    await this.prisma.client.resource.deleteMany({})
    await this.seedResources()
    console.log('✅ 资源数据重置完成')
  }

  /**
   * 添加新的资源
   */
  async addResource(resource: SeedResource) {
    const parentId = resource.parentPath ? await this.findResourceIdByPath(resource.parentPath) : null

    return this.createResources([resource], parentId)
  }

  private async findResourceIdByPath(path: string): Promise<string | null> {
    const resource = await this.prisma.client.resource.findUnique({
      where: { path },
      select: { id: true }
    })
    return resource?.id || null
  }
}
