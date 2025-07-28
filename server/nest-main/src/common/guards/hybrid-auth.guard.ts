import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../modules/users/auth.service';

/**
 * 混合认证守卫
 * 支持 HTTP 和 gRPC 双协议的统一认证机制
 */
@Injectable()
export class HybridAuthGuard implements CanActivate {
  private readonly logger = new Logger(HybridAuthGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否有公开访问标记
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler()) ||
                     this.reflector.get<boolean>('isPublic', context.getClass());
    
    if (isPublic) {
      this.logger.debug('Public endpoint detected, skipping authentication');
      return true;
    }

    const contextType = context.getType();
    let token: string | null = null;
    let request: any = null;

    try {
      // 根据协议类型获取认证信息
      if (contextType === 'http') {
        request = context.switchToHttp().getRequest();
        token = this.extractTokenFromHttp(request);
        this.logger.debug(`HTTP Request: ${request.method} ${request.url}`);
      } else if (contextType === 'rpc') {
        const rpcContext = context.switchToRpc();
        request = rpcContext.getContext();
        token = this.extractTokenFromGrpc(request);
        this.logger.debug(`gRPC Request: ${context.getHandler().name}`);
      } else {
        this.logger.error(`Unsupported context type: ${contextType}`);
        throw new UnauthorizedException('不支持的请求类型');
      }

      if (!token) {
        this.logger.warn('No authentication token found');
        throw new UnauthorizedException('认证令牌缺失');
      }

      // 验证令牌并获取用户信息
      const user = await this.validateTokenAndGetUser(token);
      
      if (!user) {
        this.logger.warn('Token validation failed or user not found');
        throw new UnauthorizedException('认证失败');
      }

      // 将用户信息附加到请求对象
      request.user = user;
      this.logger.debug(`Authentication successful for user: ${user.phone}`);

      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException(error.message || '认证失败');
    }
  }

  /**
   * 从 HTTP 请求中提取 JWT 令牌
   */
  private extractTokenFromHttp(request: any): string | null {
    // 尝试从 Authorization header 提取
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // 尝试从查询参数提取（用于某些特殊场景）
    if (request.query?.token) {
      return request.query.token;
    }

    // 尝试从 Cookie 提取（如果配置了）
    if (request.cookies?.access_token) {
      return request.cookies.access_token;
    }

    return null;
  }

  /**
   * 从 gRPC 请求中提取 JWT 令牌
   */
  private extractTokenFromGrpc(context: any): string | null {
    // gRPC 请求的认证信息通常在 metadata 中
    const metadata = context.metadata || context.getMap?.() || {};
    
    // 尝试从 authorization metadata 提取
    const authMetadata = metadata.authorization || metadata.Authorization;
    if (authMetadata) {
      const authValue = Array.isArray(authMetadata) ? authMetadata[0] : authMetadata;
      if (typeof authValue === 'string' && authValue.startsWith('Bearer ')) {
        return authValue.slice(7);
      }
    }

    // 尝试从 access_token metadata 提取
    const tokenMetadata = metadata.access_token || metadata['access-token'];
    if (tokenMetadata) {
      return Array.isArray(tokenMetadata) ? tokenMetadata[0] : tokenMetadata;
    }

    return null;
  }

  /**
   * 验证 JWT 令牌并获取用户信息
   */
  private async validateTokenAndGetUser(token: string): Promise<any> {
    try {
      // 使用 passport-jwt 的方法验证令牌
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const jwt = require('jsonwebtoken');
      
      // 验证令牌
      const payload = jwt.verify(token, jwtSecret);
      
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('无效的令牌格式');
      }

      // 获取用户信息（包含角色和权限）
      const user = await this.authService.validateUser(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户不存在或未激活');
      }

      this.logger.debug(`User validated: ${user.phone}, roles: ${user.roles?.map(r => r.name).join(', ')}`);
      
      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('无效的令牌');
      } else if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        this.logger.error(`Token validation error: ${error.message}`, error.stack);
        throw new UnauthorizedException('令牌验证失败');
      }
    }
  }
} 