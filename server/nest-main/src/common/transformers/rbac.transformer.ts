import { Role as RoleEntity, Permission as PermissionEntity, Prisma } from '@prisma/client'
// 导入Prisma客户端类型
import { Role as RoleProto, Permission as PermissionProto, CreateRoleRequest, UpdateRoleRequest, CreatePermissionRequest, UpdatePermissionRequest, GetRoleRequest, GetPermissionRequest } from '../../shared/rbac'
import { TimestampTransformer, ArrayTransformer, StringTransformer } from './common.transformer'

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    rolePermissions: {
      include: {
        permission: true
      }
    }
  }
}>

type RoleBasic = Prisma.RoleGetPayload<{
  select: {
    id: true
    name: true
    description: true
    createdAt: true
    updatedAt: true
  }
}>

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
      updatedAt: TimestampTransformer.toProtobuf(entity.updatedAt)
    }
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
      action: StringTransformer.toNonEmptyString(proto.action)
      // isActive 字段在 Entity 中不存在，省略
    }

    if (proto.createdAt) {
      entity.createdAt = TimestampTransformer.fromProtobuf(proto.createdAt)
    }
    if (proto.updatedAt) {
      entity.updatedAt = TimestampTransformer.fromProtobuf(proto.updatedAt)
    }

    return entity
  },

  /**
   * 验证创建权限请求
   */
  validateCreateRequest(request: CreatePermissionRequest): {
    name: string
    description?: string
    resource?: string
    action?: string
  } {
    if (!request.name) {
      throw new Error('Permission name is required')
    }

    const name = StringTransformer.toNonEmptyString(request.name)
    if (!name) {
      throw new Error('Permission name cannot be empty')
    }

    if (name.length < 2 || name.length > 50) {
      throw new Error('Permission name must be between 2 and 50 characters')
    }

    return {
      name,
      description: StringTransformer.toNonEmptyString(request.description),
      resource: StringTransformer.toNonEmptyString(request.resource),
      action: StringTransformer.toNonEmptyString(request.action)
    }
  },

  /**
   * 验证更新权限请求
   */
  validateUpdateRequest(request: UpdatePermissionRequest): {
    id: string
    name?: string
    description?: string
    resource?: string
    action?: string
    isActive?: boolean
  } {
    if (!request.id) {
      throw new Error('Permission ID is required')
    }

    const result: any = { id: request.id }

    if (request.name !== undefined) {
      const name = StringTransformer.toNonEmptyString(request.name)
      if (name && (name.length < 2 || name.length > 50)) {
        throw new Error('Permission name must be between 2 and 50 characters')
      }
      result.name = name
    }

    if (request.description !== undefined) {
      result.description = StringTransformer.toNonEmptyString(request.description)
    }

    if (request.resource !== undefined) {
      result.resource = StringTransformer.toNonEmptyString(request.resource)
    }

    if (request.action !== undefined) {
      result.action = StringTransformer.toNonEmptyString(request.action)
    }

    if (request.isActive !== undefined) {
      result.isActive = request.isActive
    }

    return result
  },

  /**
   * 批量转换权限列表
   */
  toProtobufList(entities: PermissionEntity[]): PermissionProto[] {
    return ArrayTransformer.toArray(entities).map((entity) => this.toProtobuf(entity))
  }
}

/**
 * 角色数据转换器
 */
export const RoleTransformer = {
  /**
   * 将 Role Entity 转换为 Protobuf Role
   */
  toProtobuf(entity: RoleWithPermissions): RoleProto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      isActive: true, // Entity 没有此字段，默认为 true
      createdAt: TimestampTransformer.toProtobuf(entity.createdAt),
      updatedAt: TimestampTransformer.toProtobuf(entity.updatedAt),
      // 使用可选链操作符安全访问rolePermissions属性，避免类型错误
      permissions: ArrayTransformer.toArray(entity.rolePermissions || [])
        .filter((rp) => rp.permission) // 确保permission存在
        .map((rp) => PermissionTransformer.toProtobuf(rp.permission))
    }
  },

  /**
   * 将 Protobuf Role 转换为 Role Entity
   */
  fromProtobuf(proto: RoleProto): Partial<RoleEntity> {
    const entity: Partial<RoleEntity> = {
      id: proto.id,
      name: proto.name,
      description: StringTransformer.toNonEmptyString(proto.description)
      // isActive 字段在 Entity 中不存在，省略
    }

    if (proto.createdAt) {
      entity.createdAt = TimestampTransformer.fromProtobuf(proto.createdAt)
    }
    if (proto.updatedAt) {
      entity.updatedAt = TimestampTransformer.fromProtobuf(proto.updatedAt)
    }

    return entity
  },

  /**
   * 验证创建角色请求
   */
  validateCreateRequest(request: CreateRoleRequest): {
    name: string
    description?: string
    permissionIds?: string[]
  } {
    if (!request.name) {
      throw new Error('Role name is required')
    }

    const name = StringTransformer.toNonEmptyString(request.name)
    if (!name) {
      throw new Error('Role name cannot be empty')
    }

    if (name.length < 2 || name.length > 50) {
      throw new Error('Role name must be between 2 and 50 characters')
    }

    return {
      name,
      description: StringTransformer.toNonEmptyString(request.description),
      permissionIds: ArrayTransformer.filterNulls(request.permissionIds || [])
    }
  },

  /**
   * 验证更新角色请求
   */
  validateUpdateRequest(request: UpdateRoleRequest): {
    id: string
    name?: string
    description?: string
    isActive?: boolean
    permissionIds?: string[]
  } {
    if (!request.id) {
      throw new Error('Role ID is required')
    }

    const result: any = { id: request.id }

    if (request.name !== undefined) {
      const name = StringTransformer.toNonEmptyString(request.name)
      if (name && (name.length < 2 || name.length > 50)) {
        throw new Error('Role name must be between 2 and 50 characters')
      }
      result.name = name
    }

    if (request.description !== undefined) {
      result.description = StringTransformer.toNonEmptyString(request.description)
    }

    // isActive 字段在 Entity 中不存在，省略
    // if (request.isActive !== undefined) {
    //   result.isActive = request.isActive;
    // }

    if (request.permissionIds !== undefined) {
      // 处理权限ID列表
      result.permissionIds = ArrayTransformer.filterNulls(request.permissionIds || [])
    }

    return result
  },

  /**
   * 批量转换角色列表（包含权限）
   */
  toProtobufList(entities: RoleWithPermissions[]): RoleProto[] {
    return ArrayTransformer.toArray(entities).map((entity) => this.toProtobuf(entity))
  },

  /**
   * 将 Role Entity 转换为不包含权限的 Protobuf Role
   */
  toBasicProto(entity: RoleBasic | RoleEntity): RoleProto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      isActive: true, // Entity 没有此字段，默认为 true
      createdAt: TimestampTransformer.toProtobuf(entity.createdAt),
      updatedAt: TimestampTransformer.toProtobuf(entity.updatedAt),
      permissions: [] // 不包含权限信息
    }
  },

  /**
   * 批量转换角色列表（不包含权限）
   */
  toBasicProtobufList(entities: (RoleBasic | RoleEntity)[]): RoleProto[] {
    return ArrayTransformer.toArray(entities).map((entity) => this.toBasicProto(entity))
  },

  /**
   * 为列表查询准备角色数据（包含权限信息）
   */
  toDetailedProtobuf(entity: RoleWithPermissions): RoleProto {
    return {
      ...this.toProtobuf(entity),
      // 使用可选链操作符安全访问rolePermissions属性，避免类型错误
      permissions: entity.rolePermissions
        ? entity.rolePermissions
            .filter((rp) => rp.permission) // 确保permission存在
            .map((rp) => PermissionTransformer.toProtobuf(rp.permission))
        : []
    }
  }
}

/**
 * RBAC 通用转换器
 */
export const RbacTransformer = {
  /**
   * 验证请求参数中的 ID
   */
  validateId(id: string | null | undefined, fieldName = 'ID'): string {
    if (!id) {
      throw new Error(`${fieldName} is required`)
    }

    const cleanId = StringTransformer.toNonEmptyString(id)
    if (!cleanId) {
      throw new Error(`${fieldName} cannot be empty`)
    }

    return cleanId
  },

  /**
   * 验证获取请求
   */
  validateGetRequest(request: GetRoleRequest | GetPermissionRequest): string {
    return this.validateId(request.id, 'Resource ID')
  },

  /**
   * 验证删除请求
   */
  validateDeleteRequest(request: { id: string }): string {
    return this.validateId(request.id, 'Resource ID')
  },

  /**
   * 验证创建权限请求
   */
  validateCreatePermissionRequest(request: CreatePermissionRequest): {
    name: string
    action: string
    resource: string
    description?: string
  } {
    if (!request.name || !request.action || !request.resource) {
      throw new Error('Name, action and resource are required')
    }

    const name = StringTransformer.toNonEmptyString(request.name)
    if (!name) {
      throw new Error('Permission name cannot be empty')
    }

    const action = StringTransformer.toNonEmptyString(request.action)
    if (!action) {
      throw new Error('Permission action cannot be empty')
    }

    const resource = StringTransformer.toNonEmptyString(request.resource)
    if (!resource) {
      throw new Error('Permission resource cannot be empty')
    }

    return {
      name,
      action,
      resource,
      description: request.description ? StringTransformer.toNonEmptyString(request.description) : undefined
    }
  },

  /**
   * 验证更新权限请求
   */
  validateUpdatePermissionRequest(request: UpdatePermissionRequest & { id: string }): {
    id: string
    name?: string
    action?: string
    resource?: string
    description?: string
    isActive?: boolean
  } {
    const id = this.validateId(request.id, 'Permission ID')

    const result: any = { id }

    if (request.name !== undefined) {
      result.name = StringTransformer.toNonEmptyString(request.name)
      if (!result.name) {
        throw new Error('Permission name cannot be empty')
      }
    }

    if (request.action !== undefined) {
      result.action = StringTransformer.toNonEmptyString(request.action)
      if (!result.action) {
        throw new Error('Permission action cannot be empty')
      }
    }

    if (request.resource !== undefined) {
      result.resource = StringTransformer.toNonEmptyString(request.resource)
      if (!result.resource) {
        throw new Error('Permission resource cannot be empty')
      }
    }

    if (request.description !== undefined) {
      result.description = StringTransformer.toNonEmptyString(request.description)
    }

    if (request.isActive !== undefined) {
      result.isActive = Boolean(request.isActive)
    }

    return result
  },

  /**
   * 验证权限检查请求
   */
  validateCheckPermissionRequest(request: any): {
    userPhone: string
    action: string
    resource: string
  } {
    if (!request.userPhone || !request.action || !request.resource) {
      throw new Error('User phone, action and resource are required')
    }

    const userPhone = StringTransformer.cleanPhone(request.userPhone)
    if (!userPhone) {
      throw new Error('Invalid phone number format')
    }

    const action = StringTransformer.toNonEmptyString(request.action)
    if (!action) {
      throw new Error('Action cannot be empty')
    }

    const resource = StringTransformer.toNonEmptyString(request.resource)
    if (!resource) {
      throw new Error('Resource cannot be empty')
    }

    return {
      userPhone,
      action,
      resource
    }
  },

  /**
   * 权限转换为 Protobuf 格式
   */
  permissionToProtobuf(entity: PermissionEntity): PermissionProto {
    return PermissionTransformer.toProtobuf(entity)
  },

  /**
   * 角色转换为 Protobuf 格式
   */
  roleToProtobuf(entity: RoleWithPermissions): RoleProto {
    return RoleTransformer.toProtobuf(entity)
  },

  /**
   * 创建权限摘要信息
   */
  createPermissionSummary(entity: PermissionEntity): {
    id: string
    name: string
    resource?: string
    action?: string
  } {
    return {
      id: entity.id,
      name: entity.name,
      resource: entity.resource,
      action: entity.action
    }
  },

  /**
   * 创建角色摘要信息
   */
  createRoleSummary(entity: RoleEntity): {
    id: string
    name: string
    permissionCount: number
  } {
    return {
      id: entity.id,
      name: entity.name,
      // 由于基础 RoleEntity 类型没有 rolePermissions 属性，默认为 0
      permissionCount: 0
    }
  }
}

/**
 * RBAC 转换器导出
 */
export const RbacTransformers = {
  permission: PermissionTransformer,
  role: RoleTransformer,
  common: RbacTransformer
}
