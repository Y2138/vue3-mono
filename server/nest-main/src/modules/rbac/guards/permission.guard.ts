import { CanActivate, ExecutionContext, Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@prisma/client';

/**
 * 优化的权限守卫
 * 配合认证守卫使用，专注于权限验证逻辑
 * 支持 HTTP 和 gRPC 双协议，提供高性能的权限检查
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  
  // 权限缓存，避免重复计算（可选）
  private readonly permissionCache = new Map<string, Set<string>>();
  private readonly cacheMaxSize = 1000;
  private readonly cacheExpiry = 5 * 60 * 1000; // 5分钟

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否有公开访问标记
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler()) ||
                     this.reflector.get<boolean>('isPublic', context.getClass());
    
    if (isPublic) {
      return true;
    }

    // 获取需要的权限
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler()) ||
                                this.reflector.get<string[]>('permissions', context.getClass());
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.debug('No permissions required for this endpoint');
      return true;
    }

    // 获取用户信息（由认证守卫提供）
    const user = this.extractUser(context);
    
    if (!user) {
      this.logger.warn('No user found in request context - authentication required');
      throw new ForbiddenException('认证信息缺失，请先登录');
    }

    if (!user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
      this.logger.warn(`User ${user.phone} has no roles assigned`);
      throw new ForbiddenException('用户未分配角色，无法访问');
    }

    // 检查权限
    const hasPermission = this.checkUserPermissions(user, requiredPermissions);
    
    if (!hasPermission) {
      this.logger.warn(
        `User ${user.phone} denied access - Required: [${requiredPermissions.join(', ')}]`
      );
      throw new ForbiddenException('权限不足，无法执行此操作');
    }

    this.logger.debug(`User ${user.phone} granted access to ${requiredPermissions.join(', ')}`);
    return true;
  }

  /**
   * 从执行上下文中提取用户信息
   */
  private extractUser(context: ExecutionContext): (User & { roles?: any[] }) | null {
    const contextType = context.getType();
    let request: any;

    if (contextType === 'http') {
      request = context.switchToHttp().getRequest();
    } else if (contextType === 'rpc') {
      request = context.switchToRpc().getContext();
    } else {
      this.logger.error(`Unsupported context type: ${contextType}`);
      return null;
    }

    return request?.user || null;
  }

  /**
   * 检查用户权限
   */
  private checkUserPermissions(user: User & { roles?: any[] }, requiredPermissions: string[]): boolean {
    // 检查超级管理员权限
    if (this.isSuperAdmin(user)) {
      this.logger.debug(`User ${user.phone} is super admin - granting access`);
      return true;
    }

    // 获取用户权限集合
    const userPermissions = this.getUserPermissions(user);
    
    // 检查是否拥有所有需要的权限
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.has(permission)
    );

    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Permission check for ${user.phone}:`);
      this.logger.debug(`  Required: [${requiredPermissions.join(', ')}]`);
      this.logger.debug(`  User has: [${Array.from(userPermissions).join(', ')}]`);
      this.logger.debug(`  Result: ${hasAllPermissions ? 'GRANTED' : 'DENIED'}`);
    }

    return hasAllPermissions;
  }

  /**
   * 检查是否为超级管理员
   */
  private isSuperAdmin(user: User & { roles?: any[] }): boolean {
    return user.roles && user.roles.some(role => 
      role.name === '超级管理员' || role.name === 'super_admin'
    ) || false;
  }

  /**
   * 获取用户所有权限（带缓存）
   */
  private getUserPermissions(user: User & { roles?: any[] }): Set<string> {
    const cacheKey = `user_${user.phone}_permissions`;
    
    // 尝试从缓存获取
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    // 计算用户权限
    const permissions = new Set<string>();
    
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach(role => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach(permission => {
            const permKey = `${permission.resource}:${permission.action}`;
            permissions.add(permKey);
          });
        }
      });
    }

    // 添加到缓存
    this.addToCache(cacheKey, permissions);
    
    return permissions;
  }

  /**
   * 添加到权限缓存
   */
  private addToCache(key: string, permissions: Set<string>): void {
    // 限制缓存大小
    if (this.permissionCache.size >= this.cacheMaxSize) {
      const firstKey = this.permissionCache.keys().next().value;
      this.permissionCache.delete(firstKey);
    }

    this.permissionCache.set(key, permissions);
    
    // 设置过期清理（简单实现）
    setTimeout(() => {
      this.permissionCache.delete(key);
    }, this.cacheExpiry);
  }

  /**
   * 清理权限缓存（可用于用户权限变更时）
   */
  clearUserPermissionCache(userPhone: string): void {
    const cacheKey = `user_${userPhone}_permissions`;
    this.permissionCache.delete(cacheKey);
    this.logger.debug(`Cleared permission cache for user ${userPhone}`);
  }

  /**
   * 清理所有权限缓存
   */
  clearAllPermissionCache(): void {
    this.permissionCache.clear();
    this.logger.debug('Cleared all permission cache');
  }
} 