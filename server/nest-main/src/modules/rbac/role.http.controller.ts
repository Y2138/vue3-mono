import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoleService } from './services/role.service';
import { RoleTransformer } from '../../common/transformers/rbac.transformer';

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
export class RoleHttpController {
  private readonly logger = new Logger(RoleHttpController.name);

  constructor(
    private readonly roleService: RoleService,
  ) {}

  @Get()
  async getRoles(@Query() query: GetRolesQueryDto) {
    this.logger.log(`Getting roles list with query: ${JSON.stringify(query)}`);
    
    // 暂时返回所有角色，后续可以根据query参数实现筛选和分页
    const roles = await this.roleService.findAll();
    
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    
    return {
      data: roles.map(role => RoleTransformer.toProtobuf(role)),
      pagination: {
        page,
        pageSize,
        total: roles.length,
        totalPages: Math.ceil(roles.length / pageSize),
      },
    };
  }

  @Get(':id')
  async getRole(@Param('id') id: string) {
    this.logger.log(`Getting role with ID: ${id}`);
    
    const role = await this.roleService.findById(id);
    return {
      data: RoleTransformer.toProtobuf(role),
    };
  }

  @Post()
  async createRole(@Body() createDto: CreateRoleDto) {
    this.logger.log(`Creating role: ${JSON.stringify(createDto)}`);
    
    const role = await this.roleService.create(createDto);
    return {
      data: RoleTransformer.toProtobuf(role),
    };
  }

  @Put(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateDto: UpdateRoleDto,
  ) {
    this.logger.log(`Updating role ${id}: ${JSON.stringify(updateDto)}`);
    
    const role = await this.roleService.update(id, updateDto);
    return {
      data: RoleTransformer.toProtobuf(role),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id') id: string) {
    this.logger.log(`Deleting role with ID: ${id}`);
    
    await this.roleService.delete(id);
    return {
      message: `Role with ID ${id} deleted successfully`,
    };
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') roleId: string,
    @Body() assignDto: AssignPermissionsDto,
  ) {
    this.logger.log(`Assigning permissions to role ${roleId}: ${JSON.stringify(assignDto)}`);
    
    try {
      const role = await this.roleService.addPermissions(roleId, assignDto.permissionIds);
      if (!role) {
        return {
          success: false,
          code: 404,
          message: '角色不存在，无法分配权限',
          data: null,
        };
      }
      return {
        data: RoleTransformer.toProtobuf(role),
        message: `权限已成功分配给角色 ${roleId}`,
      };
    } catch (error) {
      // 返回用户友好的错误响应
      return {
        success: false,
        code: 500,
        message: '分配权限时发生错误',
        data: null,
      };
    }
  }

  @Delete(':id/permissions')
  async removePermissions(
    @Param('id') roleId: string,
    @Body() removeDto: RemovePermissionsDto,
  ) {
    this.logger.log(`Removing permissions from role ${roleId}: ${JSON.stringify(removeDto)}`);
    
    const role = await this.roleService.removePermissions(roleId, removeDto.permissionIds);
    return {
      data: RoleTransformer.toProtobuf(role),
      message: `Permissions removed from role ${roleId} successfully`,
    };
  }

  @Put(':id/permissions')
  async setPermissions(
    @Param('id') roleId: string,
    @Body() setDto: AssignPermissionsDto,
  ) {
    this.logger.log(`Setting permissions for role ${roleId}: ${JSON.stringify(setDto)}`);
    
    const role = await this.roleService.setPermissions(roleId, setDto.permissionIds);
    return {
      data: RoleTransformer.toProtobuf(role),
      message: `Permissions set for role ${roleId} successfully`,
    };
  }
} 