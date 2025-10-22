import { Controller, Get, Post, Body, Param, Query, Logger, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger'
import { BaseController } from '../../common/controllers/base.controller'
import { ApiResponse, ApiErrorResponse } from '../../common/response/types'
import { PermissionService } from './services/permission.service'
import { Validator } from '../../common/validators'
import { Permission, CreatePermissionRequest, UpdatePermissionRequest, GetPermissionsResponse, CheckPermissionRequest, CheckPermissionResponse } from '../../shared/rbac'

/**
 * 权限管理 HTTP 控制器
 * 使用 proto 定义的类型确保前后端接口一致性
 */
@ApiTags('RBAC - Permissions')
@Controller('api/permissions')
export class PermissionHttpController extends BaseController {
  protected readonly logger = new Logger(PermissionHttpController.name)

  constructor(private readonly permissionService: PermissionService) {
    super('PermissionHttpController')
  }

  // ========================================
  // 🔒 权限管理相关接口
  // ========================================

  /**
   * 获取权限列表
   */
  @Get()
  @ApiOperation({
    summary: '获取权限列表',
    description: '分页获取权限列表，支持关键词搜索和条件筛选'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取权限列表'
  })
  async getPermissions(@Query('page') page: number = 1, @Query('pageSize') pageSize: number = 20, @Query('search') search?: string, @Query('isActive') isActive?: boolean, @Query('action') action?: string, @Query('resource') resource?: string): Promise<ApiResponse<GetPermissionsResponse> | ApiErrorResponse> {
    // 验证分页参数
    Validator.numberRange(page, 1, 1000, '页码')
    Validator.numberRange(pageSize, 1, 100, '每页数量')

    // 验证可选参数
    if (search !== undefined && search !== '') {
      Validator.stringLength(search, 1, 100, '搜索关键词')
    }

    if (action !== undefined && action !== '') {
      Validator.actionName(action, '操作名称')
    }

    if (resource !== undefined && resource !== '') {
      Validator.resourceName(resource, '资源名称')
    }

    const result = await this.permissionService.findMany({
      page,
      pageSize,
      search,
      isActive,
      action,
      resource
    })

    // 直接组装响应数据
    const permissionsResponse: GetPermissionsResponse = {
      permissions: result.permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        description: permission.description || '',
        resource: permission.resource,
        action: permission.action,
        isActive: true, // 数据库中暂无此字段，默认为true
        createdAt: this.formatDateTime(permission.createdAt),
        updatedAt: this.formatDateTime(permission.updatedAt)
      })),
      pagination: {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: Math.ceil(result.pagination.total / result.pagination.pageSize)
      }
    }

    return this.success(permissionsResponse, '获取权限列表成功')
  }

  /**
   * 获取权限统计信息
   */
  @Get('stats')
  @ApiOperation({
    summary: '获取权限统计信息',
    description: '获取权限相关的统计数据'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取统计信息'
  })
  async getPermissionStats(): Promise<
    ApiResponse<{
      totalPermissions: number
      activePermissions: number
      inactivePermissions: number
      permissionsByResource: Record<string, number>
    }>
  > {
    const stats = await this.permissionService.getStats()
    return this.success(stats, '获取权限统计信息成功')
  }

  /**
   * 根据ID获取权限详情
   */
  @Get(':id')
  @ApiOperation({
    summary: '获取权限详情',
    description: '根据权限ID获取权限的详细信息'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取权限详情'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '权限不存在'
  })
  async getPermissionById(@Param('id') id: string): Promise<ApiResponse<Permission>> {
    // 验证权限ID
    Validator.uuid(id, '权限ID')

    const permission = await this.permissionService.findById(id)
    if (!permission) {
      return this.error('权限不存在', 404)
    }

    // 直接组装权限数据
    const permissionResponse: Permission = {
      id: permission.id,
      name: permission.name,
      description: permission.description || '',
      resource: permission.resource,
      action: permission.action,
      isActive: true, // 数据库中暂无此字段，默认为true
      createdAt: this.formatDateTime(permission.createdAt),
      updatedAt: this.formatDateTime(permission.updatedAt)
    }

    return this.success(permissionResponse, '获取权限详情成功')
  }

  /**
   * 创建权限
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建权限',
    description: '创建新的权限'
  })
  @SwaggerApiResponse({
    status: 201,
    description: '权限创建成功'
  })
  @SwaggerApiResponse({
    status: 409,
    description: '权限已存在'
  })
  async createPermission(@Body() createPermissionRequest: CreatePermissionRequest): Promise<ApiResponse<Permission>> {
    try {
      // 基础格式验证
      Validator.permissionName(createPermissionRequest.name)
      Validator.actionName(createPermissionRequest.action)
      Validator.resourceName(createPermissionRequest.resource)

      // 验证描述字段（可选）
      if (createPermissionRequest.description) {
        Validator.description(createPermissionRequest.description, 500, '权限描述')
      }

      // 检查权限是否已存在
      const existingPermission = await this.permissionService.findByActionAndResource(createPermissionRequest.action, createPermissionRequest.resource)
      if (existingPermission) {
        return this.error('该权限已存在', 409)
      }

      // 创建权限
      const permission = await this.permissionService.create({
        name: createPermissionRequest.name,
        action: createPermissionRequest.action,
        resource: createPermissionRequest.resource,
        description: createPermissionRequest.description
      })

      // 直接组装权限数据
      const permissionResponse: Permission = {
        id: permission.id,
        name: permission.name,
        description: permission.description || '',
        resource: permission.resource,
        action: permission.action,
        isActive: true, // 数据库中暂无此字段，默认为true
        createdAt: this.formatDateTime(permission.createdAt),
        updatedAt: this.formatDateTime(permission.updatedAt)
      }

      return this.success(permissionResponse, '权限创建成功')
    } catch (error) {
      return this.handleError(error, '权限创建失败')
    }
  }

  /**
   * 更新权限
   */
  @Post(':id')
  @ApiOperation({
    summary: '更新权限',
    description: '更新指定权限的信息'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '权限更新成功'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '权限不存在'
  })
  async updatePermission(@Param('id') id: string, @Body() updatePermissionRequest: UpdatePermissionRequest): Promise<ApiResponse<Permission>> {
    try {
      // 验证权限ID
      Validator.uuid(id, '权限ID')

      // 检查权限是否存在
      const existingPermission = await this.permissionService.findById(id)
      if (!existingPermission) {
        return this.error('权限不存在', 404)
      }

      // 验证更新字段（如果提供）
      if (updatePermissionRequest.name !== undefined) {
        Validator.permissionName(updatePermissionRequest.name)
      }

      if (updatePermissionRequest.action !== undefined) {
        Validator.actionName(updatePermissionRequest.action)
      }

      if (updatePermissionRequest.resource !== undefined) {
        Validator.resourceName(updatePermissionRequest.resource)
      }

      if (updatePermissionRequest.description !== undefined) {
        Validator.description(updatePermissionRequest.description, 500, '权限描述')
      }

      // 更新权限
      const updatedPermission = await this.permissionService.update(id, {
        name: updatePermissionRequest.name,
        action: updatePermissionRequest.action,
        resource: updatePermissionRequest.resource,
        description: updatePermissionRequest.description
      })

      // 直接组装权限数据
      const permissionResponse: Permission = {
        id: updatedPermission.id,
        name: updatedPermission.name,
        description: updatedPermission.description || '',
        resource: updatedPermission.resource,
        action: updatedPermission.action,
        isActive: true, // 数据库中暂无此字段，默认为true
        createdAt: this.formatDateTime(updatedPermission.createdAt),
        updatedAt: this.formatDateTime(updatedPermission.updatedAt)
      }

      return this.success(permissionResponse, '权限更新成功')
    } catch (error) {
      return this.handleError(error, '权限更新失败')
    }
  }

  /**
   * 删除权限
   */
  @Post(':id/delete')
  @ApiOperation({
    summary: '删除权限',
    description: '删除指定的权限'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '权限删除成功'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '权限不存在'
  })
  async deletePermission(@Param('id') id: string): Promise<ApiResponse<void>> {
    try {
      // 检查权限是否存在
      const existingPermission = await this.permissionService.findById(id)
      if (!existingPermission) {
        return this.error('权限不存在', 404)
      }

      // 删除权限
      await this.permissionService.delete(id)

      return this.success(undefined, '权限删除成功')
    } catch (error) {
      return this.handleError(error, '权限删除失败')
    }
  }

  /**
   * 批量删除权限
   */
  @Post('batch-delete')
  @ApiOperation({
    summary: '批量删除权限',
    description: '批量删除多个权限'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '批量删除成功'
  })
  async batchDeletePermissions(@Body() body: { ids: string[] }): Promise<ApiResponse<void>> {
    try {
      const { ids } = body
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return this.error('请提供要删除的权限ID列表', 400)
      }

      // 批量删除权限
      await this.permissionService.batchDelete(ids)

      return this.success(undefined, `成功删除 ${ids.length} 个权限`)
    } catch (error) {
      return this.handleError(error, '批量删除权限失败')
    }
  }

  // ========================================
  // 🔐 权限检查相关接口
  // ========================================

  /**
   * 检查用户权限
   */
  @Post('check')
  @ApiOperation({
    summary: '检查用户权限',
    description: '检查指定用户是否具有某项权限'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '权限检查完成'
  })
  async checkPermission(@Body() checkPermissionRequest: CheckPermissionRequest): Promise<ApiResponse<CheckPermissionResponse>> {
    try {
      // 基础格式验证
      Validator.phone(checkPermissionRequest.userPhone, '用户手机号')
      Validator.actionName(checkPermissionRequest.action, '操作名称')
      Validator.resourceName(checkPermissionRequest.resource, '资源名称')

      // 执行权限检查
      const hasPermission = await this.permissionService.checkUserPermission(checkPermissionRequest.userPhone, checkPermissionRequest.action, checkPermissionRequest.resource)

      const response: CheckPermissionResponse = {
        hasPermission,
        matchedPermissions: [] // 简化实现，不返回匹配的权限详情
      }

      return this.success(response, '权限检查完成')
    } catch (error) {
      return this.handleError(error, '权限检查失败')
    }
  }

  /**
   * 批量检查权限
   */
  @Post('batch-check')
  @ApiOperation({
    summary: '批量检查权限',
    description: '批量检查用户的多项权限'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '批量权限检查完成'
  })
  async batchCheckPermissions(@Body() body: { userPhone: string; permissions: Array<{ action: string; resource: string }> }): Promise<ApiResponse<CheckPermissionResponse[]>> {
    try {
      const { userPhone, permissions } = body
      if (!userPhone || !permissions || !Array.isArray(permissions)) {
        return this.error('请提供用户手机号和权限列表', 400)
      }

      // 批量检查权限
      const results = await Promise.all(
        permissions.map(async (perm) => {
          const hasPermission = await this.permissionService.checkUserPermission(userPhone, perm.action, perm.resource)
          return {
            hasPermission,
            matchedPermissions: [] // 简化实现，不返回匹配的权限详情
          }
        })
      )

      return this.success(results, '批量权限检查完成')
    } catch (error) {
      return this.handleError(error, '批量权限检查失败')
    }
  }

  // ========================================
  // 📊 权限统计相关接口
  // ========================================
}
