import { Controller, Post, Get, Put, Delete, Body, Query, Param } from '@nestjs/common'
import { ApiResponse } from '../../common/response/types'
import { Role, CreateRoleRequest, UpdateRoleRequest, GetRolesRequest, GetRolesResponse, GetRoleUsersRequest, GetRoleUsersResponse, AssignPermissionsToRoleRequest, RemoveRolePermissionsRequest, GetRolePermissionsResponse } from '../../shared/role'
import { RoleService } from './services/role.service'

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 获取角色列表
   */
  @Get()
  async getRoles(@Query() request: GetRolesRequest): Promise<ApiResponse<GetRolesResponse>> {
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

    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        roles: result.data,
        pagination: {
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10,
          total: result.total.toString(),
          totalPages: Math.ceil(result.total / (pagination?.pageSize || 10))
        }
      }
    }
  }

  /**
   * 获取角色详情
   */
  @Get(':id')
  async getRole(@Param('id') id: string): Promise<ApiResponse<Role>> {
    const role = await this.roleService.findOne(id)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        ...role,
        createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : role.createdAt,
        updatedAt: role.updatedAt instanceof Date ? role.updatedAt.toISOString() : role.updatedAt
      }
    }
  }

  /**
   * 创建角色
   */
  @Post()
  async createRole(@Body() request: CreateRoleRequest): Promise<ApiResponse<Role>> {
    const role = await this.roleService.create({
      name: request.name,
      description: request.description || undefined,
      is_active: request.isActive ?? true,
      is_super_admin: request.isSuperAdmin ?? false
    })

    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        ...role,
        createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : role.createdAt,
        updatedAt: role.updatedAt instanceof Date ? role.updatedAt.toISOString() : role.updatedAt
      }
    }
  }

  /**
   * 更新角色
   */
  @Put(':id')
  async updateRole(@Param('id') id: string, @Body() request: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    const updateData: any = {}

    if (request.name !== undefined) updateData.name = request.name
    if (request.description !== undefined) updateData.description = request.description
    if (request.isActive !== undefined) updateData.is_active = request.isActive
    if (request.isSuperAdmin !== undefined) updateData.is_super_admin = request.isSuperAdmin

    const role = await this.roleService.update(id, updateData)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        ...role,
        createdAt: role.createdAt instanceof Date ? role.createdAt.toISOString() : role.createdAt,
        updatedAt: role.updatedAt instanceof Date ? role.updatedAt.toISOString() : role.updatedAt
      }
    }
  }

  /**
   * 删除角色
   */
  @Delete(':id')
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<{ success: boolean }>> {
    await this.roleService.remove(id)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: { success: true }
    }
  }

  /**
   * 获取角色用户列表
   */
  @Get(':id/users')
  async getRoleUsers(@Param('id') roleId: string, @Query() request: GetRoleUsersRequest): Promise<ApiResponse<GetRoleUsersResponse>> {
    const pagination = request.pagination || undefined
    const result = await this.roleService.getRoleUsers(roleId, pagination)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        role: result.role,
        userIds: result.users.map((user) => user.phone),
        pagination: {
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10,
          total: result.total.toString(),
          totalPages: Math.ceil(result.total / (pagination?.pageSize || 10))
        }
      }
    }
  }

  /**
   * 分配用户到角色
   */
  @Post(':id/users')
  async assignUsersToRole(@Param('id') roleId: string, @Body() request: { userIds: string[] }): Promise<ApiResponse<{ success: boolean; assignedCount: number }>> {
    const result = await this.roleService.assignUsersToRole(roleId, request.userIds)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: result
    }
  }

  /**
   * 从角色移除用户
   */
  @Delete(':id/users')
  async removeUsersFromRole(@Param('id') roleId: string, @Body() request: { userIds: string[] }): Promise<ApiResponse<{ success: boolean; removedCount: number }>> {
    const result = await this.roleService.removeUsersFromRole(roleId, request.userIds)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: result
    }
  }

  /**
   * 获取角色权限树
   */
  @Get(':id/permissions')
  async getRolePermissions(@Param('id') roleId: string): Promise<ApiResponse<GetRolePermissionsResponse>> {
    const result = await this.roleService.getRoleResources(roleId)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        role: result.role,
        permissionTree: result.permissionTree,
        permissions: result.permissions
      }
    }
  }

  /**
   * 分配权限给角色
   */
  @Post(':id/permissions')
  async assignResourcesToRole(@Param('id') roleId: string, @Body() request: AssignPermissionsToRoleRequest): Promise<ApiResponse<{ success: boolean; assignedCount: number }>> {
    const result = await this.roleService.assignResourcesToRole(roleId, request.resourceIds)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: result
    }
  }

  /**
   * 移除角色权限
   */
  @Delete(':id/permissions')
  async removeResourcesFromRole(@Param('id') roleId: string, @Body() request: RemoveRolePermissionsRequest): Promise<ApiResponse<{ success: boolean; removedCount: number }>> {
    const result = await this.roleService.removeResourcesFromRole(roleId, request.resourceIds)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: result
    }
  }

  /**
   * 获取角色统计信息
   */
  @Get('stats/summary')
  async getRoleStatistics(): Promise<ApiResponse<any>> {
    const stats = await this.roleService.getRoleStatistics()

    return {
      success: true,
      code: 200,
      message: 'success',
      data: stats
    }
  }
}
