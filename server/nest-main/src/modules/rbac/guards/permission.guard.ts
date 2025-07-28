import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取需要的权限
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    this.logger.log(`Required permissions: ${JSON.stringify(requiredPermissions)}`);
    
    if (!requiredPermissions) {
      this.logger.log('No permissions required for this endpoint');
      return true;
    }

    let request;
    const contextType = context.getType();

    // 根据协议类型获取请求对象
    if (contextType === 'http') {
      // HTTP请求
      request = context.switchToHttp().getRequest();
      this.logger.log(`HTTP Request: ${request.method} ${request.url}`);
    } else if (contextType === 'rpc') {
      // gRPC请求
      const rpcContext = context.switchToRpc();
      request = rpcContext.getContext();
      this.logger.log(`gRPC Request: ${context.getHandler().name}`);
    } else {
      this.logger.error(`Unsupported context type: ${contextType}`);
      return false;
    }
    
    // 记录请求头信息，便于调试
    if (request.headers) {
      this.logger.log(`Request headers: ${JSON.stringify(request.headers)}`);
      this.logger.log(`Authorization header: ${request.headers.authorization}`);
    }
    
    // 尝试从多个可能的位置获取用户信息
    let user: User | undefined;
    
    // 1. 检查request.user
    if (request.user) {
      this.logger.log('User found in request.user');
      user = request.user;
    } 
    // 2. 检查request中的其他可能位置
    else if (request.auth && request.auth.user) {
      this.logger.log('User found in request.auth.user');
      user = request.auth.user;
    }
    
    this.logger.log(`User object found: ${Boolean(user)}`);

    if (!user) {
      this.logger.error('User object is undefined - authentication failed');
      return false;
    }

    if (!user.roles) {
      this.logger.error('User roles are undefined');
      return false;
    }

    // 检查用户是否具有超级管理员角色
    const isSuperAdmin = user.roles.some(role => role.name === '超级管理员');
    if (isSuperAdmin) {
      this.logger.log('User is a super admin - granting access');
      return true; // 超级管理员拥有所有权限，直接返回true
    }

    // 收集用户所有权限
    const userPermissions = new Set<string>();
    user.roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => {
          const permKey = `${permission.resource}:${permission.action}`;
          userPermissions.add(permKey);
          this.logger.log(`Added permission: ${permKey}`);
        });
      } else {
        this.logger.warn(`Role ${role.name} has no permissions`);
      }
    });

    this.logger.log(`User permissions: ${Array.from(userPermissions)}`);
    this.logger.log(`Required permissions: ${requiredPermissions}`);

    // 检查用户是否拥有所有需要的权限
    const hasAllPermissions = requiredPermissions.every(permission => {
      const has = userPermissions.has(permission);
      this.logger.log(`Checking permission ${permission}: ${has ? 'GRANTED' : 'DENIED'}`);
      return has;
    });

    this.logger.log(`Access ${hasAllPermissions ? 'GRANTED' : 'DENIED'}`);
    return hasAllPermissions;
  }
} 