import { Controller, Post, Get, Body, Query } from '@nestjs/common'
import { ApiResponse } from '../../common/response/types'
import { BaseController } from '../../common/controllers/base.controller'
import { Role, CreateRoleRequest, UpdateRoleRequest, GetRolesRequest } from '../../shared/role'
import { RoleService } from './services/role.service'

@Controller('api/roles')
export class RoleController extends BaseController {
  constructor(private readonly roleService: RoleService) {
    super(RoleController.name)
  }

  /**
   * 获取角色列表
   */
  @Get('list')
  async getRoles(@Query() request: GetRolesRequest) {
    const search = request.search ?? undefined
    const is_active = request.isActive ?? undefined
    const is_super_admin = request.isSuperAdmin ?? undefined
    const pagination = request.pagination ?? undefined

    const result = await this.roleService.findAll({
      search,
      is_active,
      is_super_admin,
      pagination
    })
    const total = await this.roleService.getCount({
      search,
      is_active,
      is_super_admin
    })

    // 格式化数据
    const formattedRoles = result.data.map((role) => ({
      ...role,
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt)
    }))

    return this.paginated(formattedRoles, {
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 10,
      total
    })
  }

  /**
   * 获取角色详情
   */
  @Get('detail')
  async getRole(@Query('id') id: string): Promise<ApiResponse<Role>> {
    this.assertNotEmpty(id, '角色ID')
    const role = await this.roleService.findOne(id)
    this.assertDataExists(role, '角色', id)

    return this.success({
      ...role,
      resourceIds: role.role_resources.map((resource) => resource.resourceId),
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt)
    })
  }

  /**
   * 创建角色
   */
  @Post('create')
  async createRole(@Body() request: CreateRoleRequest): Promise<ApiResponse<Role>> {
    this.assertNotEmpty(request.name, '角色名称')

    const role = await this.roleService.create({
      name: request.name,
      description: request.description || undefined,
      is_active: request.isActive ?? true,
      is_super_admin: request.isSuperAdmin ?? false,
      resource_ids: request.resourceIds || []
    })

    return this.created({
      ...role,
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt)
    })
  }

  /**
   * 更新角色
   */
  @Post('update')
  async updateRole(@Body() request: UpdateRoleRequest & { id: string }): Promise<ApiResponse<Role>> {
    this.assertNotEmpty(request.id, '角色ID')

    const updateData: any = {}

    if (request.name !== undefined) updateData.name = request.name
    if (request.description !== undefined) updateData.description = request.description
    if (request.isActive !== undefined) updateData.is_active = request.isActive
    if (request.isSuperAdmin !== undefined) updateData.is_super_admin = request.isSuperAdmin
    if (request.resourceIds !== undefined) updateData.resource_ids = request.resourceIds

    const role = await this.roleService.update(request.id, updateData)
    this.assertDataExists(role, '角色', request.id)

    return this.success({
      ...role,
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt)
    })
  }

  /**
   * 删除角色
   */
  @Post('delete')
  async deleteRole(@Body() body: { id: string }): Promise<ApiResponse<{ success: boolean }>> {
    this.assertNotEmpty(body.id, '角色ID')
    await this.roleService.remove(body.id)

    return this.success({ success: true })
  }

  /**
   * 分配权限给角色
   */
  @Post('assign-permissions')
  async assignResourcesToRole(@Body() request: { roleId: string; resourceIds: string[] }): Promise<ApiResponse<{ success: boolean; assignedCount: number }>> {
    this.assertNotEmpty(request.roleId, '角色ID')
    this.assert(request.resourceIds && request.resourceIds.length > 0, '资源ID列表不能为空')

    const result = await this.roleService.assignResourcesToRole(request.roleId, request.resourceIds)

    return this.success(result)
  }

  /**
   * 移除角色权限
   */
  @Post('remove-permissions')
  async removeResourcesFromRole(@Body() request: { roleId: string; resourceIds: string[] }): Promise<ApiResponse<{ success: boolean; removedCount: number }>> {
    this.assertNotEmpty(request.roleId, '角色ID')
    this.assert(request.resourceIds && request.resourceIds.length > 0, '资源ID列表不能为空')

    const result = await this.roleService.removeResourcesFromRole(request.roleId, request.resourceIds)

    return this.success(result)
  }

  /**
   * 根据角色ID列表预览权限
   */
  @Post('preview-permissions')
  async previewPermissions(@Body() request: { roleIds: string[] }): Promise<ApiResponse<{ tree: any[]; list: any[] }>> {
    this.assert(request.roleIds && Array.isArray(request.roleIds), '角色ID列表必须为数组')

    const resources = await this.roleService.getResourcesByRoleIds(request.roleIds)

    return this.success(resources, '获取权限预览成功')
  }

  /**
   * 获取角色统计信息
   */
  @Get('stats-summary')
  async getRoleStatistics(): Promise<ApiResponse<any>> {
    const stats = await this.roleService.getRoleStatistics()

    return this.success(stats)
  }
}
