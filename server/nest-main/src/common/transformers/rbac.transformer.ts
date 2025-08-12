import { Role as RoleEntity, Permission as PermissionEntity } from '@prisma/client';
import { 
  Role as RoleProto, 
  Permission as PermissionProto,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  GetRoleRequest,
  GetPermissionRequest
} from '../../shared/rbac';
import { TimestampTransformer, ArrayTransformer, StringTransformer } from './common.transformer';

/**
 * 权限数据转换器
 */
export const PermissionTransformer = {
  /**
   * 将 Permission Entity 转换为 Protobuf Permission
   */
  toProtobuf(entity: PermissionEntity): PermissionProto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      resource: entity.resource || '',
      action: entity.action || '',
      isActive: true, // Entity 没有此字段，默认为 true
      createdAt: TimestampTransformer.toProtobuf(entity.createdAt),
      updatedAt: TimestampTransformer.toProtobuf(entity.updatedAt),
    };
  },

  /**
   * 将 Protobuf Permission 转换为 Permission Entity
   */
  fromProtobuf(proto: PermissionProto): Partial<PermissionEntity> {
    const entity: Partial<PermissionEntity> = {
      id: proto.id,
      name: proto.name,
      description: StringTransformer.toNonEmptyString(proto.description),
      resource: StringTransformer.toNonEmptyString(proto.resource),
      action: StringTransformer.toNonEmptyString(proto.action),
      // isActive 字段在 Entity 中不存在，省略
    };

    if (proto.createdAt) {
      entity.createdAt = TimestampTransformer.fromProtobuf(proto.createdAt);
    }
    if (proto.updatedAt) {
      entity.updatedAt = TimestampTransformer.fromProtobuf(proto.updatedAt);
    }

    return entity;
  },

  /**
   * 验证创建权限请求
   */
  validateCreateRequest(request: CreatePermissionRequest): {
    name: string;
    description?: string;
    resource?: string;
    action?: string;
  } {
    if (!request.name) {
      throw new Error('Permission name is required');
    }

    const name = StringTransformer.toNonEmptyString(request.name);
    if (!name) {
      throw new Error('Permission name cannot be empty');
    }

    if (name.length < 2 || name.length > 50) {
      throw new Error('Permission name must be between 2 and 50 characters');
    }

    return {
      name,
      description: StringTransformer.toNonEmptyString(request.description),
      resource: StringTransformer.toNonEmptyString(request.resource),
      action: StringTransformer.toNonEmptyString(request.action),
    };
  },

  /**
   * 验证更新权限请求
   */
  validateUpdateRequest(request: UpdatePermissionRequest): {
    id: string;
    name?: string;
    description?: string;
    resource?: string;
    action?: string;
    isActive?: boolean;
  } {
    if (!request.id) {
      throw new Error('Permission ID is required');
    }

    const result: any = { id: request.id };

    if (request.name !== undefined) {
      const name = StringTransformer.toNonEmptyString(request.name);
      if (name && (name.length < 2 || name.length > 50)) {
        throw new Error('Permission name must be between 2 and 50 characters');
      }
      result.name = name;
    }

    if (request.description !== undefined) {
      result.description = StringTransformer.toNonEmptyString(request.description);
    }

    if (request.resource !== undefined) {
      result.resource = StringTransformer.toNonEmptyString(request.resource);
    }

    if (request.action !== undefined) {
      result.action = StringTransformer.toNonEmptyString(request.action);
    }

    if (request.isActive !== undefined) {
      result.isActive = request.isActive;
    }

    return result;
  },

  /**
   * 批量转换权限列表
   */
  toProtobufList(entities: PermissionEntity[]): PermissionProto[] {
    return ArrayTransformer.toArray(entities).map(entity => this.toProtobuf(entity));
  },
};

/**
 * 角色数据转换器
 */
export const RoleTransformer = {
  /**
   * 将 Role Entity 转换为 Protobuf Role
   */
  toProtobuf(entity: RoleEntity): RoleProto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      isActive: true, // Entity 没有此字段，默认为 true
      createdAt: TimestampTransformer.toProtobuf(entity.createdAt),
      updatedAt: TimestampTransformer.toProtobuf(entity.updatedAt),
      permissions: ArrayTransformer.toArray(entity.permissions || []).map(p => PermissionTransformer.toProtobuf(p)),
    };
  },

  /**
   * 将 Protobuf Role 转换为 Role Entity
   */
  fromProtobuf(proto: RoleProto): Partial<RoleEntity> {
    const entity: Partial<RoleEntity> = {
      id: proto.id,
      name: proto.name,
      description: StringTransformer.toNonEmptyString(proto.description),
      // isActive 字段在 Entity 中不存在，省略
    };

    if (proto.createdAt) {
      entity.createdAt = TimestampTransformer.fromProtobuf(proto.createdAt);
    }
    if (proto.updatedAt) {
      entity.updatedAt = TimestampTransformer.fromProtobuf(proto.updatedAt);
    }

    return entity;
  },

  /**
   * 验证创建角色请求
   */
  validateCreateRequest(request: CreateRoleRequest): {
    name: string;
    description?: string;
    permissionIds?: string[];
  } {
    if (!request.name) {
      throw new Error('Role name is required');
    }

    const name = StringTransformer.toNonEmptyString(request.name);
    if (!name) {
      throw new Error('Role name cannot be empty');
    }

    if (name.length < 2 || name.length > 50) {
      throw new Error('Role name must be between 2 and 50 characters');
    }

    return {
      name,
      description: StringTransformer.toNonEmptyString(request.description),
      permissionIds: ArrayTransformer.filterNulls(request.permissionIds || []),
    };
  },

  /**
   * 验证更新角色请求
   */
  validateUpdateRequest(request: UpdateRoleRequest): {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    permissionIds?: string[];
  } {
    if (!request.id) {
      throw new Error('Role ID is required');
    }

    const result: any = { id: request.id };

    if (request.name !== undefined) {
      const name = StringTransformer.toNonEmptyString(request.name);
      if (name && (name.length < 2 || name.length > 50)) {
        throw new Error('Role name must be between 2 and 50 characters');
      }
      result.name = name;
    }

    if (request.description !== undefined) {
      result.description = StringTransformer.toNonEmptyString(request.description);
    }

    // isActive 字段在 Entity 中不存在，省略
    // if (request.isActive !== undefined) {
    //   result.isActive = request.isActive;
    // }

    if (request.permissionIds !== undefined) {
      // 注意：这里需要根据实际需求处理权限关联
      // Entity 中是 permissions 字段，不是 permissionIds
      // result.permissionIds = ArrayTransformer.filterNulls(request.permissionIds || []);
    }

    return result;
  },

  /**
   * 批量转换角色列表
   */
  toProtobufList(entities: RoleEntity[]): RoleProto[] {
    return ArrayTransformer.toArray(entities).map(entity => this.toProtobuf(entity));
  },

  /**
   * 为列表查询准备角色数据（包含权限信息）
   */
  toDetailedProtobuf(entity: RoleEntity): RoleProto & { permissions?: PermissionProto[] } {
    return {
      ...this.toProtobuf(entity),
      permissions: entity.permissions 
        ? PermissionTransformer.toProtobufList(entity.permissions)
        : undefined,
    };
  },
};

/**
 * RBAC 通用转换器
 */
export const RbacTransformer = {
  /**
   * 验证请求参数中的 ID
   */
  validateId(id: string | null | undefined, fieldName = 'ID'): string {
    if (!id) {
      throw new Error(`${fieldName} is required`);
    }

    const cleanId = StringTransformer.toNonEmptyString(id);
    if (!cleanId) {
      throw new Error(`${fieldName} cannot be empty`);
    }

    return cleanId;
  },

  /**
   * 验证获取请求
   */
  validateGetRequest(request: GetRoleRequest | GetPermissionRequest): string {
    return this.validateId(request.id, 'Resource ID');
  },

  /**
   * 验证删除请求
   */
  validateDeleteRequest(request: { id: string }): string {
    return this.validateId(request.id, 'Resource ID');
  },

  /**
   * 创建权限摘要信息
   */
  createPermissionSummary(entity: PermissionEntity): {
    id: string;
    name: string;
    resource?: string;
    action?: string;
  } {
    return {
      id: entity.id,
      name: entity.name,
      resource: entity.resource,
      action: entity.action,
    };
  },

  /**
   * 创建角色摘要信息
   */
  createRoleSummary(entity: RoleEntity): {
    id: string;
    name: string;
    permissionCount: number;
  } {
    return {
      id: entity.id,
      name: entity.name,
      permissionCount: entity.permissions?.length || 0,
    };
  },
};

/**
 * RBAC 转换器导出
 */
export const RbacTransformers = {
  permission: PermissionTransformer,
  role: RoleTransformer,
  common: RbacTransformer,
}; 