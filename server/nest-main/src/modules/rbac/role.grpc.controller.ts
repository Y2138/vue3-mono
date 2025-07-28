import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  Role,
  RoleServiceController,
  GetRoleRequest,
  GetRolesRequest,
  GetRolesResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRolePermissionsRequest,
  RemoveRolePermissionsRequest,
} from '../../shared/rbac';
import { ResponseStatus } from '../../shared/common';
import { RoleService } from './services/role.service';
import { RoleTransformer } from '../../common/transformers/rbac.transformer';

@Controller()
export class RoleGrpcController implements RoleServiceController {
  private readonly logger = new Logger(RoleGrpcController.name);

  constructor(
    private readonly roleService: RoleService,
  ) {}

  @GrpcMethod('RoleService', 'GetRole')
  async getRole(request: GetRoleRequest): Promise<Role> {
    this.logger.log(`Getting role with ID: ${request.id}`);
    
    const role = await this.roleService.findById(request.id);
    return RoleTransformer.toProtobuf(role);
  }

  @GrpcMethod('RoleService', 'GetRoles')
  async getRoles(request: GetRolesRequest): Promise<GetRolesResponse> {
    this.logger.log(`Getting roles list with filters: ${JSON.stringify(request)}`);
    
    // 暂时返回所有角色，后续可以根据request参数实现筛选和分页
    const roles = await this.roleService.findAll();
    
    return {
      roles: roles.map(role => RoleTransformer.toProtobuf(role)),
      pagination: {
        page: request.pagination?.page || 1,
        pageSize: request.pagination?.pageSize || 10,
        total: roles.length,
        totalPages: Math.ceil(roles.length / (request.pagination?.pageSize || 10)),
      },
    };
  }

  @GrpcMethod('RoleService', 'CreateRole')
  async createRole(request: CreateRoleRequest): Promise<Role> {
    this.logger.log(`Creating role: ${JSON.stringify(request)}`);
    
    const roleData = {
      name: request.name,
      description: request.description,
      permissionIds: request.permissionIds,
    };
    
    const role = await this.roleService.create(roleData);
    return RoleTransformer.toProtobuf(role);
  }

  @GrpcMethod('RoleService', 'UpdateRole')
  async updateRole(request: UpdateRoleRequest): Promise<Role> {
    this.logger.log(`Updating role: ${JSON.stringify(request)}`);
    
    const updateData: any = {};
    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.isActive !== undefined) updateData.isActive = request.isActive;
    if (request.permissionIds && request.permissionIds.length > 0) {
      updateData.permissionIds = request.permissionIds;
    }
    
    const role = await this.roleService.update(request.id, updateData);
    return RoleTransformer.toProtobuf(role);
  }

  @GrpcMethod('RoleService', 'DeleteRole')
  async deleteRole(request: GetRoleRequest): Promise<ResponseStatus> {
    this.logger.log(`Deleting role with ID: ${request.id}`);
    
    await this.roleService.delete(request.id);
    
    return {
      code: 200,
      success: true,
      message: `Role with ID ${request.id} deleted successfully`,
    };
  }

  @GrpcMethod('RoleService', 'AssignRolePermissions')
  async assignRolePermissions(request: AssignRolePermissionsRequest): Promise<ResponseStatus> {
    this.logger.log(`Assigning permissions to role: ${JSON.stringify(request)}`);
    
    await this.roleService.addPermissions(request.roleId, request.permissionIds);
    
    return {
      code: 200,
      success: true,
      message: `Permissions assigned to role ${request.roleId} successfully`,
    };
  }

  @GrpcMethod('RoleService', 'RemoveRolePermissions')
  async removeRolePermissions(request: RemoveRolePermissionsRequest): Promise<ResponseStatus> {
    this.logger.log(`Removing permissions from role: ${JSON.stringify(request)}`);
    
    await this.roleService.removePermissions(request.roleId, request.permissionIds);
    
    return {
      code: 200,
      success: true,
      message: `Permissions removed from role ${request.roleId} successfully`,
    };
  }
} 