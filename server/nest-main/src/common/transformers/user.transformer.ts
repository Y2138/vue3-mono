import { User as UserEntity } from '../../modules/users/entities/user.entity';
import { User as UserProto, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/users';
import { TimestampTransformer, ArrayTransformer, StringTransformer } from './common.transformer';

/**
 * 用户数据转换器
 */
export const UserTransformer = {
  /**
   * 将 User Entity 转换为 Protobuf User
   */
  toProtobuf(entity: UserEntity): UserProto {
    return {
      phone: entity.phone,
      username: entity.username || '',
      isActive: entity.isActive,
      createdAt: TimestampTransformer.toProtobuf(entity.createdAt),
      updatedAt: TimestampTransformer.toProtobuf(entity.updatedAt),
      roleIds: ArrayTransformer.toArray(entity.roles?.map(role => role.name) || []),
    };
  },

  /**
   * 将 Protobuf User 转换为 User Entity
   * 注意：这通常用于更新操作，不会创建完整的实体
   */
  fromProtobuf(proto: UserProto): Partial<UserEntity> {
    const entity: Partial<UserEntity> = {
      phone: proto.phone,
      username: StringTransformer.toNonEmptyString(proto.username),
      isActive: proto.isActive,
    };

    // 时间戳通常由数据库管理，这里只在有值时才设置
    if (proto.createdAt) {
      entity.createdAt = TimestampTransformer.fromProtobuf(proto.createdAt);
    }
    if (proto.updatedAt) {
      entity.updatedAt = TimestampTransformer.fromProtobuf(proto.updatedAt);
    }

    return entity;
  },

  /**
   * 创建认证响应
   */
  createAuthResponse(user: UserEntity, token: string): AuthResponse {
    const expiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN || '86400', 10); // 默认24小时
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    
    return {
      user: this.toProtobuf(user),
      token,
      expiresAt: TimestampTransformer.toProtobuf(expiresAt),
    };
  },

  /**
   * 验证登录请求
   */
  validateLoginRequest(request: LoginRequest): { phone: string; password: string } {
    if (!request.phone || !request.password) {
      throw new Error('Phone and password are required');
    }

    const phone = StringTransformer.cleanPhone(request.phone);
    if (!phone) {
      throw new Error('Invalid phone number format');
    }

    if (request.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    return {
      phone,
      password: request.password,
    };
  },

  /**
   * 验证注册请求
   */
  validateRegisterRequest(request: RegisterRequest): { 
    phone: string; 
    username: string; 
    password: string; 
  } {
    if (!request.phone || !request.username || !request.password) {
      throw new Error('Phone, username and password are required');
    }

    const phone = StringTransformer.cleanPhone(request.phone);
    if (!phone) {
      throw new Error('Invalid phone number format');
    }

    const username = StringTransformer.toNonEmptyString(request.username);
    if (!username) {
      throw new Error('Username cannot be empty');
    }

    if (username.length < 2 || username.length > 20) {
      throw new Error('Username must be between 2 and 20 characters');
    }

    if (request.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    return {
      phone,
      username,
      password: request.password,
    };
  },

  /**
   * 为列表查询准备用户数据
   */
  toListItem(entity: UserEntity): UserProto {
    // 列表项可能不需要敏感信息
    return {
      phone: entity.phone,
      username: entity.username || '',
      isActive: entity.isActive,
      createdAt: TimestampTransformer.toProtobuf(entity.createdAt),
      updatedAt: TimestampTransformer.toProtobuf(entity.updatedAt),
      roleIds: ArrayTransformer.toArray(entity.roles?.map(role => role.name) || []),
    };
  },

  /**
   * 批量转换用户列表
   */
  toProtobufList(entities: UserEntity[]): UserProto[] {
    return ArrayTransformer.toArray(entities).map(entity => this.toListItem(entity));
  },

  /**
   * 创建用户摘要信息（用于其他模块引用）
   */
  toSummary(entity: UserEntity): { phone: string; username: string; isActive: boolean } {
    return {
      phone: entity.phone,
      username: entity.username || '',
      isActive: entity.isActive,
    };
  },
}; 