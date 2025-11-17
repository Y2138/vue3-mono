import { Controller, Post, Body, HttpStatus, HttpCode, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { RoleService } from './services/role.service'
import { CreateRoleRequest, UpdateRoleRequest, GetRolesRequest } from '@/shared/role'
import { RoleEntity } from './entities/role.entity'
import { AuthGuard } from '../../common/guards/auth.guard'
import { BaseController } from '../../common/controllers/base.controller'

@ApiTags('角色管理')
@Controller('api/roles')
@UseGuards(AuthGuard)
export class RoleController extends BaseController {
  constructor(private readonly roleService: RoleService) {
    super(RoleController.name)
  }

  @Post()
  @ApiOperation({ summary: '创建角色' })
  @ApiResponse({
    status: 201,
    description: '角色创建成功',
    type: RoleEntity
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误'
  })
  @ApiResponse({
    status: 409,
    description: '角色名称已存在'
  })
  async create(@Body() createRoleDto: CreateRoleRequest) {
    // 参数验证
    this.assertNotEmpty(createRoleDto.name, '角色名称')
    const result = await this.roleService.createRole(createRoleDto)
    return this.created(result)
  }

  @Post('list')
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RoleEntity' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
        totalPages: { type: 'number' },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' }
      }
    }
  })
  async findAll(@Body() queryRoleDto: GetRolesRequest) {
    const result = await this.roleService.getRoles(queryRoleDto)
    const { data, ...pagination } = result
    const paginationWithFlags = {
      ...pagination,
      hasNext: pagination.page < pagination.totalPages,
      hasPrev: pagination.page > 1
    }
    return this.paginated(data, paginationWithFlags)
  }

  @Post('statistics')
  @ApiOperation({ summary: '获取角色统计信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        totalRoles: { type: 'number', description: '总角色数' },
        activeRoles: { type: 'number', description: '激活角色数' },
        inactiveRoles: { type: 'number', description: '未激活角色数' }
      }
    }
  })
  async getStatistics(@Body() _body: any = {}) {
    const result = await this.roleService.getRoleStatistics()
    return this.success(result)
  }

  @Post('user')
  @ApiOperation({ summary: '获取用户角色列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          roleId: { type: 'string' },
          roleName: { type: 'string' },
          roleDescription: { type: 'string' },
          assignedAt: { type: 'string', format: 'date-time' },
          permissions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                resourceId: { type: 'string' },
                resourceName: { type: 'string' },
                resourceType: { type: 'string' },
                resourceUrl: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  async getUserRoles(@Body() body: { userId: string }) {
    const result = await this.roleService.getUserRoles(body.userId)
    return this.success(result)
  }

  @Post('detail')
  @ApiOperation({ summary: '根据ID获取角色详情' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: RoleEntity
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async findOne(@Body() body: { id: string }) {
    const result = await this.roleService.getRoleById(body.id)
    return this.success(result)
  }

  @Post('update')
  @ApiOperation({ summary: '更新角色' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: RoleEntity
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  @ApiResponse({
    status: 409,
    description: '角色名称已存在'
  })
  async update(@Body() body: { id: string } & Omit<UpdateRoleRequest, 'id'>) {
    const { id, ...updateRoleDto } = body
    const result = await this.roleService.updateRole(id, updateRoleDto)
    return this.success(result)
  }

  @Post('delete')
  @ApiOperation({ summary: '删除角色' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  @ApiResponse({
    status: 409,
    description: '角色已被使用，无法删除'
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Body() body: { id: string }) {
    await this.roleService.deleteRole(body.id)
    return this.success(null, '角色删除成功')
  }

  @Post('permission-check')
  @ApiOperation({ summary: '检查用户是否具有指定权限' })
  @ApiResponse({
    status: 200,
    description: '检查完成',
    schema: {
      type: 'object',
      properties: {
        hasPermission: { type: 'boolean', description: '是否具有权限' }
      }
    }
  })
  async checkUserPermission(@Body() body: { userId: string; resourceIds: string[] }) {
    const { userId, resourceIds } = body
    const hasPermission = await this.roleService.checkUserPermission(userId, resourceIds)
    return this.success({ hasPermission })
  }
}
