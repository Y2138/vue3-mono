import { Controller, Get, Post, Body, Param, HttpCode, UseGuards, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger'
import { RolePermissionService } from './services/role-permission.service'
import { BaseController } from '../../common/controllers/base.controller'
import { AssignPermissionsToRoleRequest } from '../../shared/role'
import { AuthGuard } from '../../common/guards/auth.guard'

@ApiTags('角色权限管理')
@Controller('api/role-permission')
@UseGuards(AuthGuard)
export class RolePermissionController extends BaseController {
  constructor(private readonly rolePermissionService: RolePermissionService) {
    super(RolePermissionController.name)
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '为角色分配资源权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({ status: 200, description: '权限分配成功', schema: { type: 'object', properties: { message: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 400, description: '部分资源不存在' })
  @HttpCode(HttpStatus.OK)
  async assignResources(@Param('id') roleId: string, @Body() assignPermissionsDto: AssignPermissionsToRoleRequest) {
    this.assertNotEmpty(roleId, '角色ID')
    this.assertNotEmpty(assignPermissionsDto.resourceIds, '资源ID列表')

    await this.rolePermissionService.assignResourcesToRole({
      role_id: roleId,
      resource_ids: assignPermissionsDto.resourceIds
    })

    return this.success(null, '权限分配成功')
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色权限树' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        roleId: { type: 'string' },
        roleName: { type: 'string' },
        permissionTree: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' },
              level: { type: 'number' },
              parentId: { type: 'string' },
              isAssigned: { type: 'boolean' },
              isIndeterminate: { type: 'boolean' },
              children: {
                type: 'array',
                items: { $ref: '#/components/schemas/RolePermissionTreeNode' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async getPermissionTree(@Param('id') roleId: string) {
    return await this.rolePermissionService.getRolePermissionTree(roleId)
  }

  @Get(':id/permission-stats')
  @ApiOperation({ summary: '获取角色权限统计' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        roleId: { type: 'string' },
        roleName: { type: 'string' },
        totalResources: { type: 'number' },
        assignedResources: { type: 'number' },
        unassignedResources: { type: 'number' },
        permissionCoverage: { type: 'number' },
        typeDistribution: {
          type: 'object',
          additionalProperties: { type: 'number' }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async getPermissionStats(@Param('id') roleId: string) {
    return await this.rolePermissionService.getRolePermissionStats(roleId)
  }

  @Post(':id/batch-permissions')
  @ApiOperation({ summary: '批量分配角色权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        grantResourceIds: {
          type: 'array',
          items: { type: 'string' },
          description: '要授予的资源ID列表'
        },
        revokeResourceIds: {
          type: 'array',
          items: { type: 'string' },
          description: '要撤销的资源ID列表'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '批量权限分配成功',
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
    status: 400,
    description: '部分资源不存在'
  })
  @HttpCode(HttpStatus.OK)
  async batchAssignPermissions(@Param('id') roleId: string, @Body() body: { grantResourceIds: string[]; revokeResourceIds: string[] }) {
    return await this.rolePermissionService.batchAssignPermissions(roleId, body.grantResourceIds || [], body.revokeResourceIds || [])
  }

  @Get(':id/permission-check/:resourceId')
  @ApiOperation({ summary: '检查角色是否具有指定权限' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiParam({ name: 'resourceId', description: '资源ID' })
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
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async checkPermission(@Param('id') roleId: string, @Param('resourceId') resourceId: string) {
    const hasPermission = await this.rolePermissionService.checkRolePermission(roleId, resourceId)
    return { hasPermission }
  }

  @Post(':id/permission-diff')
  @ApiOperation({ summary: '获取角色权限差异' })
  @ApiParam({ name: 'id', description: '角色ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        targetResourceIds: {
          type: 'array',
          items: { type: 'string' },
          description: '目标资源ID列表'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        roleId: { type: 'string' },
        roleName: { type: 'string' },
        toGrant: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceId: { type: 'string' },
              resourceName: { type: 'string' },
              resourceType: { type: 'string' }
            }
          }
        },
        toRevoke: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceId: { type: 'string' },
              resourceName: { type: 'string' },
              resourceType: { type: 'string' }
            }
          }
        },
        unchangedCount: { type: 'number' },
        totalChanges: { type: 'number' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async getPermissionDiff(@Param('id') roleId: string, @Body() body: { targetResourceIds: string[] }) {
    return await this.rolePermissionService.getRolePermissionDiff(roleId, body.targetResourceIds)
  }
}
