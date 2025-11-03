import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { RoleService } from './services/role.service'
import { Validator } from '../../common/validators'
import { BaseController } from '../../common/controllers/base.controller'
import { ApiResponse, ApiPaginatedResponse } from '../../common/response/types'

// DTO interfaces for HTTP requests
interface CreateRoleDto {
  name: string
  description?: string
  permissionIds?: string[]
}

interface UpdateRoleDto {
  name?: string
  description?: string
  isActive?: boolean
  permissionIds?: string[]
}

interface GetRolesQueryDto {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}

interface AssignPermissionsDto {
  permissionIds: string[]
}

interface RemovePermissionsDto {
  permissionIds: string[]
}

@Controller('api/roles')
export class RoleHttpController extends BaseController {
  constructor(private readonly roleService: RoleService) {
    super(RoleHttpController.name)
  }

  @Get()
  async getRoles(@Query() query: GetRolesQueryDto): Promise<ApiPaginatedResponse<any>> {
    this.logger.log(`Getting roles list with query: ${JSON.stringify(query)}`)

    // 验证分页参数
    const page = query.page || 1
    const pageSize = query.pageSize || 10
    Validator.numberRange(page, 1, 1000, '页码')
    Validator.numberRange(pageSize, 1, 100, '每页数量')

    // 验证搜索参数
    if (query.search !== undefined && query.search !== '') {
      Validator.stringLength(query.search, 1, 50, '搜索关键词')
    }

    const roles = await this.roleService.findAll()
    const total = roles.length
    const totalPages = Math.ceil(total / pageSize)

    // 直接组装角色数据
    const roleResponses = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt),
      permissions:
        role.rolePermissions?.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          resource: rp.permission.resource,
          action: rp.permission.action,
          createdAt: this.formatDateTime(rp.permission.createdAt),
          updatedAt: this.formatDateTime(rp.permission.updatedAt)
        })) || []
    }))

    return this.paginated(
      roleResponses,
      {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      '获取角色列表成功'
    )
  }

  @Get(':id')
  async getRole(@Param('id') id: string): Promise<ApiResponse<any>> {
    this.logger.log(`Getting role with ID: ${id}`)

    // 验证角色ID
    Validator.uuid(id, '角色ID')

    const role = await this.roleService.findById(id)
    this.assertDataExists(role, '角色', id)

    // 直接组装角色数据
    const roleResponse = {
      id: role.id,
      name: role.name,
      description: role.description || '',
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt),
      permissions:
        role.rolePermissions?.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          resource: rp.permission.resource,
          action: rp.permission.action,
          createdAt: this.formatDateTime(rp.permission.createdAt),
          updatedAt: this.formatDateTime(rp.permission.updatedAt)
        })) || []
    }

    return this.success(roleResponse, '获取角色信息成功')
  }

  @Post()
  async createRole(@Body() createDto: CreateRoleDto): Promise<ApiResponse<any>> {
    this.logger.log(`Creating role: ${JSON.stringify(createDto)}`)

    // 基础格式验证
    Validator.roleName(createDto.name)

    // 验证描述字段（可选）
    if (createDto.description) {
      Validator.description(createDto.description, 500, '角色描述')
    }

    // 验证权限ID数组（可选）
    if (createDto.permissionIds && createDto.permissionIds.length > 0) {
      Validator.arrayNotEmpty(createDto.permissionIds, '权限列表')
      createDto.permissionIds.forEach((permissionId) => {
        Validator.uuid(permissionId, '权限ID')
      })
    }

    const role = await this.roleService.create(createDto)

    // 直接组装角色数据
    const roleResponse = {
      id: role.id,
      name: role.name,
      description: role.description || '',
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt),
      permissions:
        role.rolePermissions?.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          resource: rp.permission.resource,
          action: rp.permission.action,
          createdAt: this.formatDateTime(rp.permission.createdAt),
          updatedAt: this.formatDateTime(rp.permission.updatedAt)
        })) || []
    }

    return this.success(roleResponse, '创建角色成功')
  }

  @Post('update/:id')
  async updateRole(@Param('id') id: string, @Body() updateDto: UpdateRoleDto): Promise<ApiResponse<any>> {
    this.logger.log(`Updating role ${id}: ${JSON.stringify(updateDto)}`)

    const role = await this.roleService.update(id, updateDto)
    this.assertDataExists(role, '角色', id)

    // 直接组装角色数据
    const roleResponse = {
      id: role.id,
      name: role.name,
      description: role.description || '',
      isActive: true, // 数据库中暂无此字段，默认为true
      createdAt: this.formatDateTime(role.createdAt),
      updatedAt: this.formatDateTime(role.updatedAt),
      permissions:
        role.rolePermissions?.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          resource: rp.permission.resource,
          action: rp.permission.action,
          isActive: true, // 数据库中暂无此字段，默认为true
          createdAt: this.formatDateTime(rp.permission.createdAt),
          updatedAt: this.formatDateTime(rp.permission.updatedAt)
        })) || []
    }

    return this.success(roleResponse, '更新角色成功')
  }

  @Post('delete/:id')
  @HttpCode(HttpStatus.OK)
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<null>> {
    this.logger.log(`Deleting role with ID: ${id}`)

    await this.roleService.delete(id)
    return this.success(null, '角色删除成功')
  }

  @Post(':id/permissions')
  async assignPermissions(@Param('id') roleId: string, @Body() assignDto: AssignPermissionsDto): Promise<ApiResponse<any>> {
    this.logger.log(`Assigning permissions to role ${roleId}: ${JSON.stringify(assignDto)}`)

    const role = await this.roleService.addPermissions(roleId, assignDto.permissionIds)
    this.assertDataExists(role, '角色', roleId)

    // 直接组装角色数据
    const roleResponse = {
      id: role!.id,
      name: role!.name,
      description: role!.description || '',
      isActive: true, // 数据库中暂无此字段，默认为true
      createdAt: this.formatDateTime(role!.createdAt),
      updatedAt: this.formatDateTime(role!.updatedAt),
      permissions:
        role!.rolePermissions?.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          resource: rp.permission.resource,
          action: rp.permission.action,
          isActive: true, // 数据库中暂无此字段，默认为true
          createdAt: this.formatDateTime(rp.permission.createdAt),
          updatedAt: this.formatDateTime(rp.permission.updatedAt)
        })) || []
    }

    return this.success(roleResponse, '权限已成功分配给角色')
  }

  @Post(':id/permissions/remove')
  async removePermissions(@Param('id') roleId: string, @Body() removeDto: RemovePermissionsDto): Promise<ApiResponse<any>> {
    this.logger.log(`Removing permissions from role ${roleId}: ${JSON.stringify(removeDto)}`)

    const role = await this.roleService.removePermissions(roleId, removeDto.permissionIds)
    this.assertDataExists(role, '角色', roleId)

    // 直接组装角色数据
    const roleResponse = {
      id: role!.id,
      name: role!.name,
      description: role!.description || '',
      isActive: true, // 数据库中暂无此字段，默认为true
      createdAt: this.formatDateTime(role!.createdAt),
      updatedAt: this.formatDateTime(role!.updatedAt),
      permissions:
        role!.rolePermissions?.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          resource: rp.permission.resource,
          action: rp.permission.action,
          isActive: true, // 数据库中暂无此字段，默认为true
          createdAt: this.formatDateTime(rp.permission.createdAt),
          updatedAt: this.formatDateTime(rp.permission.updatedAt)
        })) || []
    }

    return this.success(roleResponse, '权限已成功从角色移除')
  }

  @Post(':id/permissions/set')
  async setPermissions(@Param('id') roleId: string, @Body() setDto: AssignPermissionsDto): Promise<ApiResponse<any>> {
    this.logger.log(`Setting permissions for role ${roleId}: ${JSON.stringify(setDto)}`)

    const role = await this.roleService.setPermissions(roleId, setDto.permissionIds)
    this.assertDataExists(role, '角色', roleId)

    // 直接组装角色数据
    const roleResponse = {
      id: role!.id,
      name: role!.name,
      description: role!.description || '',
      isActive: true, // 数据库中暂无此字段，默认为true
      createdAt: this.formatDateTime(role!.createdAt),
      updatedAt: this.formatDateTime(role!.updatedAt),
      permissions:
        role!.rolePermissions?.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description || '',
          resource: rp.permission.resource,
          action: rp.permission.action,
          isActive: true, // 数据库中暂无此字段，默认为true
          createdAt: this.formatDateTime(rp.permission.createdAt),
          updatedAt: this.formatDateTime(rp.permission.updatedAt)
        })) || []
    }

    return this.success(roleResponse, '角色权限设置成功')
  }
}
