import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface SeedPermission {
  name: string;
  code: string;
  description: string;
  resourceId?: string;
  action?: string;
}

@Injectable()
export class PermissionSeedService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // 检查是否已经初始化过
    const existingPermissions = await this.prisma.client.permission.count();
    if (existingPermissions > 0) {
      console.log('🔐 权限数据已存在，跳过初始化');
      return;
    }

    console.log('🌱 开始初始化权限数据...');
    await this.seedPermissions();
    console.log('✅ 权限数据初始化完成');
  }

  private async seedPermissions() {
    // 获取所有资源ID映射
    const resources = await this.prisma.client.resource.findMany();
    const resourceMap = new Map(resources.map(r => [r.path, r.id]));

    // 基础权限定义
    const permissions: SeedPermission[] = [
      // 系统管理权限
      {
        name: '系统管理',
        code: 'SYSTEM_ADMIN',
        description: '系统管理权限',
        resourceId: resourceMap.get('/system'),
      },
      {
        name: '查看用户管理',
        code: 'USER_VIEW',
        description: '查看用户管理页面',
        resourceId: resourceMap.get('/system/users'),
      },
      {
        name: '创建用户',
        code: 'USER_CREATE',
        description: '创建新用户',
        resourceId: resourceMap.get('/system/users'),
        action: 'create',
      },
      {
        name: '编辑用户',
        code: 'USER_EDIT',
        description: '编辑用户信息',
        resourceId: resourceMap.get('/system/users'),
        action: 'edit',
      },
      {
        name: '删除用户',
        code: 'USER_DELETE',
        description: '删除用户',
        resourceId: resourceMap.get('/system/users'),
        action: 'delete',
      },
      {
        name: '查看角色管理',
        code: 'ROLE_VIEW',
        description: '查看角色管理页面',
        resourceId: resourceMap.get('/system/roles'),
      },
      {
        name: '创建角色',
        code: 'ROLE_CREATE',
        description: '创建新角色',
        resourceId: resourceMap.get('/system/roles'),
        action: 'create',
      },
      {
        name: '编辑角色',
        code: 'ROLE_EDIT',
        description: '编辑角色信息',
        resourceId: resourceMap.get('/system/roles'),
        action: 'edit',
      },
      {
        name: '删除角色',
        code: 'ROLE_DELETE',
        description: '删除角色',
        resourceId: resourceMap.get('/system/roles'),
        action: 'delete',
      },
      {
        name: '查看资源管理',
        code: 'RESOURCE_VIEW',
        description: '查看资源管理页面',
        resourceId: resourceMap.get('/system/resources'),
      },
      {
        name: '创建资源',
        code: 'RESOURCE_CREATE',
        description: '创建新资源',
        resourceId: resourceMap.get('/system/resources'),
        action: 'create',
      },
      {
        name: '编辑资源',
        code: 'RESOURCE_EDIT',
        description: '编辑资源信息',
        resourceId: resourceMap.get('/system/resources'),
        action: 'edit',
      },
      {
        name: '删除资源',
        code: 'RESOURCE_DELETE',
        description: '删除资源',
        resourceId: resourceMap.get('/system/resources'),
        action: 'delete',
      },
      // 仪表盘权限
      {
        name: '查看仪表盘',
        code: 'DASHBOARD_VIEW',
        description: '查看仪表盘页面',
        resourceId: resourceMap.get('/dashboard'),
      },
      // 个人资料权限
      {
        name: '查看个人资料',
        code: 'PROFILE_VIEW',
        description: '查看个人资料页面',
        resourceId: resourceMap.get('/profile'),
      },
      {
        name: '编辑个人资料',
        code: 'PROFILE_EDIT',
        description: '编辑个人资料',
        resourceId: resourceMap.get('/profile'),
        action: 'edit',
      },
      // API权限
      {
        name: '认证API访问',
        code: 'API_AUTH',
        description: '访问认证相关API',
        resourceId: resourceMap.get('/api/auth'),
      },
      {
        name: '用户API访问',
        code: 'API_USERS',
        description: '访问用户管理API',
        resourceId: resourceMap.get('/api/users'),
      },
      {
        name: '资源API访问',
        code: 'API_RESOURCES',
        description: '访问资源管理API',
        resourceId: resourceMap.get('/api/resources'),
      },
      {
        name: '角色API访问',
        code: 'API_ROLES',
        description: '访问角色管理API',
        resourceId: resourceMap.get('/api/resources'), // 角色API可能在资源模块中
      },
    ];

    // 创建权限
    for (const permission of permissions) {
      const createdPermission = await this.prisma.client.permission.create({
        data: {
          name: permission.name,
          code: permission.code,
          description: permission.description,
          resourceId: permission.resourceId,
          action: permission.action,
        },
      });

      console.log(`✅ 创建权限: ${permission.name} (${permission.code})`);
    }
  }

  /**
   * 重置权限数据
   */
  async resetPermissions() {
    console.log('🔄 重置权限数据...');
    await this.prisma.client.permission.deleteMany({});
    await this.seedPermissions();
    console.log('✅ 权限数据重置完成');
  }

  /**
   * 根据资源路径查找权限
   */
  async findPermissionsByResourcePath(path: string) {
    const resource = await this.prisma.client.resource.findUnique({
      where: { path },
      include: { permissions: true },
    });
    return resource?.permissions || [];
  }

  /**
   * 添加新权限
   */
  async addPermission(permission: SeedPermission) {
    return this.prisma.client.permission.create({
      data: {
        name: permission.name,
        code: permission.code,
        description: permission.description,
        resourceId: permission.resourceId,
        action: permission.action,
      },
    });
  }
}