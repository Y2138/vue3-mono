import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { RoleService } from './services/role.service';
import { RoleTransformer } from '../../common/transformers/rbac.transformer';
import { BaseController } from '../../common/controllers/base.controller';
import { ApiResponse, ApiPaginatedResponse } from '../../common/response/types';

// DTO interfaces for HTTP requests
interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

interface GetRolesQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

interface AssignPermissionsDto {
  permissionIds: string[];
}

interface RemovePermissionsDto {
  permissionIds: string[];
}

@Controller('api/roles')
export class RoleHttpController extends BaseController {
  constructor(
    private readonly roleService: RoleService,
  ) {
    super(RoleHttpController.name);
  }

  @Get()
  async getRoles(@Query() query: GetRolesQueryDto): Promise<ApiPaginatedResponse<any>> {
    this.logger.log(`Getting roles list with query: ${JSON.stringify(query)}`);
    
    // 暂时返回所有角色，后续可以根据query参数实现筛选和分页
    const roles = await this.roleService.findAll();
    
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const total = roles.length;
    const totalPages = Math.ceil(total / pageSize);
    
    return this.paginated(
      roles.map(role => RoleTransformer.toProtobuf(role)),
      {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      '获取角色列表成功'
    );
  }

  @Get(':id')
  async getRole(@Param('id') id: string): Promise<ApiResponse<any>> {
    this.logger.log(`Getting role with ID: ${id}`);
    
    const role = await this.roleService.findById(id);
    if (!role) {
      return this.notFound('角色');
    }
    
    return this.success(RoleTransformer.toProtobuf(role), '获取角色信息成功');
  }

  @Post()
  async createRole(@Body() createDto: CreateRoleDto): Promise<ApiResponse<any>> {
    this.logger.log(`Creating role: ${JSON.stringify(createDto)}`);
    
    return this.safeExecute(
      async () => {
        const role = await this.roleService.create(createDto);
        return RoleTransformer.toProtobuf(role);
      },
      '创建角色成功'
    );
  }

  @Post('update/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateDto: UpdateRoleDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Updating role ${id}: ${JSON.stringify(updateDto)}`);
    
    return this.safeExecute(
      async () => {
        const role = await this.roleService.update(id, updateDto);
        if (!role) {
          throw new NotFoundException(`角色 ${id} 不存在`);
        }
        return RoleTransformer.toProtobuf(role);
      },
      '更新角色成功'
    );
  }

  @Post('delete/:id')
  @HttpCode(HttpStatus.OK)
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<null>> {
    this.logger.log(`Deleting role with ID: ${id}`);
    
    return this.safeExecute(
      async () => {
        await this.roleService.delete(id);
        return null;
      },
      `角色删除成功`
    );
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') roleId: string,
    @Body() assignDto: AssignPermissionsDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Assigning permissions to role ${roleId}: ${JSON.stringify(assignDto)}`);
    
    return this.safeExecute(
      async () => {
        const role = await this.roleService.addPermissions(roleId, assignDto.permissionIds);
        if (!role) {
          throw new NotFoundException('角色不存在，无法分配权限');
        }
        return RoleTransformer.toProtobuf(role);
      },
      `权限已成功分配给角色`
    );
  }

  @Post(':id/permissions/remove')
  async removePermissions(
    @Param('id') roleId: string,
    @Body() removeDto: RemovePermissionsDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Removing permissions from role ${roleId}: ${JSON.stringify(removeDto)}`);
    
    return this.safeExecute(
      async () => {
        const role = await this.roleService.removePermissions(roleId, removeDto.permissionIds);
        if (!role) {
          throw new NotFoundException('角色不存在，无法移除权限');
        }
        return RoleTransformer.toProtobuf(role);
      },
      `权限已成功从角色移除`
    );
  }

  @Post(':id/permissions/set')
  async setPermissions(
    @Param('id') roleId: string,
    @Body() setDto: AssignPermissionsDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Setting permissions for role ${roleId}: ${JSON.stringify(setDto)}`);
    
    return this.safeExecute(
      async () => {
        const role = await this.roleService.setPermissions(roleId, setDto.permissionIds);
        if (!role) {
          throw new NotFoundException('角色不存在，无法设置权限');
        }
        return RoleTransformer.toProtobuf(role);
      },
      `角色权限设置成功`
    );
  }
} 