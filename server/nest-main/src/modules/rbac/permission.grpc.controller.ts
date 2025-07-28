import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  Permission,
  PermissionServiceController,
  GetPermissionRequest,
  GetPermissionsRequest,
  GetPermissionsResponse,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  CheckPermissionRequest,
  CheckPermissionResponse,
} from '../../shared/rbac';
import { ResponseStatus } from '../../shared/common';
import { PermissionService } from './services/permission.service';
import { PermissionTransformer } from '../../common/transformers/rbac.transformer';

@Controller()
export class PermissionGrpcController implements PermissionServiceController {
  private readonly logger = new Logger(PermissionGrpcController.name);

  constructor(
    private readonly permissionService: PermissionService,
  ) {}

  @GrpcMethod('PermissionService', 'GetPermission')
  async getPermission(request: GetPermissionRequest): Promise<Permission> {
    this.logger.log(`Getting permission with ID: ${request.id}`);
    
    const permission = await this.permissionService.findById(request.id);
    return PermissionTransformer.toProtobuf(permission);
  }

  @GrpcMethod('PermissionService', 'GetPermissions')
  async getPermissions(request: GetPermissionsRequest): Promise<GetPermissionsResponse> {
    this.logger.log(`Getting permissions list with filters: ${JSON.stringify(request)}`);
    
    // 暂时返回所有权限，后续可以根据request参数实现筛选和分页
    const permissions = await this.permissionService.findAll();
    
    return {
      permissions: permissions.map(permission => 
        PermissionTransformer.toProtobuf(permission)
      ),
      pagination: {
        page: request.pagination?.page || 1,
        pageSize: request.pagination?.pageSize || 10,
        total: permissions.length,
        totalPages: Math.ceil(permissions.length / (request.pagination?.pageSize || 10)),
      },
    };
  }

  @GrpcMethod('PermissionService', 'CreatePermission')
  async createPermission(request: CreatePermissionRequest): Promise<Permission> {
    this.logger.log(`Creating permission: ${JSON.stringify(request)}`);
    
    const permissionData = {
      name: request.name,
      action: request.action,
      resource: request.resource,
      description: request.description,
    };
    
    const permission = await this.permissionService.create(permissionData);
    return PermissionTransformer.toProtobuf(permission);
  }

  @GrpcMethod('PermissionService', 'UpdatePermission')
  async updatePermission(request: UpdatePermissionRequest): Promise<Permission> {
    this.logger.log(`Updating permission: ${JSON.stringify(request)}`);
    
    const updateData: any = {};
    if (request.name !== undefined) updateData.name = request.name;
    if (request.action !== undefined) updateData.action = request.action;
    if (request.resource !== undefined) updateData.resource = request.resource;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.isActive !== undefined) updateData.isActive = request.isActive;
    
    const permission = await this.permissionService.update(request.id, updateData);
    return PermissionTransformer.toProtobuf(permission);
  }

  @GrpcMethod('PermissionService', 'DeletePermission')
  async deletePermission(request: GetPermissionRequest): Promise<ResponseStatus> {
    this.logger.log(`Deleting permission with ID: ${request.id}`);
    
    await this.permissionService.delete(request.id);
    
    return {
      code: 200,
      success: true,
      message: `Permission with ID ${request.id} deleted successfully`,
    };
  }

  @GrpcMethod('PermissionService', 'CheckPermission')
  async checkPermission(request: CheckPermissionRequest): Promise<CheckPermissionResponse> {
    this.logger.log(`Checking permission: ${request.userPhone} -> ${request.resource}:${request.action}`);
    
    try {
      const permission = await this.permissionService.findByResourceAndAction(
        request.resource,
        request.action
      );
      
      return {
        hasPermission: true,
        matchedPermissions: [PermissionTransformer.toProtobuf(permission)],
      };
    } catch {
      return {
        hasPermission: false,
        matchedPermissions: [],
      };
    }
  }
} 