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
import { PermissionService } from './services/permission.service';
import { PermissionTransformer } from '../../common/transformers/rbac.transformer';

// DTO interfaces for HTTP requests
interface CreatePermissionDto {
  name: string;
  action: string;
  resource: string;
  description?: string;
}

interface UpdatePermissionDto {
  name?: string;
  action?: string;
  resource?: string;
  description?: string;
  isActive?: boolean;
}

interface GetPermissionsQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  action?: string;
  resource?: string;
}

interface CheckPermissionDto {
  userPhone: string;
  action: string;
  resource: string;
}

@Controller('api/permissions')
export class PermissionHttpController {
  private readonly logger = new Logger(PermissionHttpController.name);

  constructor(
    private readonly permissionService: PermissionService,
  ) {}

  @Get()
  async getPermissions(@Query() query: GetPermissionsQueryDto) {
    this.logger.log(`Getting permissions list with query: ${JSON.stringify(query)}`);
    
    // 暂时返回所有权限，后续可以根据query参数实现筛选和分页
    const permissions = await this.permissionService.findAll();
    
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    
    return {
      data: permissions.map(permission => PermissionTransformer.toProtobuf(permission)),
      pagination: {
        page,
        pageSize,
        total: permissions.length,
        totalPages: Math.ceil(permissions.length / pageSize),
      },
    };
  }

  @Get(':id')
  async getPermission(@Param('id') id: string) {
    this.logger.log(`Getting permission with ID: ${id}`);
    
    const permission = await this.permissionService.findById(id);
    return {
      data: PermissionTransformer.toProtobuf(permission),
    };
  }

  @Post()
  async createPermission(@Body() createDto: CreatePermissionDto) {
    this.logger.log(`Creating permission: ${JSON.stringify(createDto)}`);
    
    const permission = await this.permissionService.create(createDto);
    return {
      data: PermissionTransformer.toProtobuf(permission),
    };
  }

  @Put(':id')
  async updatePermission(
    @Param('id') id: string,
    @Body() updateDto: UpdatePermissionDto,
  ) {
    this.logger.log(`Updating permission ${id}: ${JSON.stringify(updateDto)}`);
    
    const permission = await this.permissionService.update(id, updateDto);
    return {
      data: PermissionTransformer.toProtobuf(permission),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(@Param('id') id: string) {
    this.logger.log(`Deleting permission with ID: ${id}`);
    
    await this.permissionService.delete(id);
    return {
      message: `Permission with ID ${id} deleted successfully`,
    };
  }

  @Post('check')
  async checkPermission(@Body() checkDto: CheckPermissionDto) {
    this.logger.log(`Checking permission: ${checkDto.userPhone} -> ${checkDto.resource}:${checkDto.action}`);
    
    try {
      const permission = await this.permissionService.findByResourceAndAction(
        checkDto.resource,
        checkDto.action
      );
      
      return {
        data: {
          hasPermission: true,
          matchedPermissions: [PermissionTransformer.toProtobuf(permission)],
        },
      };
    } catch {
      return {
        data: {
          hasPermission: false,
          matchedPermissions: [],
        },
      };
    }
  }
} 