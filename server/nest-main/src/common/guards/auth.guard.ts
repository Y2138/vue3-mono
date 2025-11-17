import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthService } from '../../modules/users/auth.service'

/**
 * HTTP 认证守卫
 * 专门用于 HTTP 请求的认证机制
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(private readonly authService: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否有公开访问标记
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler()) || this.reflector.get<boolean>('isPublic', context.getClass())

    if (isPublic) {
      this.logger.debug('Public endpoint detected, skipping authentication')
      return true
    }

    const request = context.switchToHttp().getRequest()

    try {
      // 从 HTTP 请求中提取认证令牌
      const token = this.extractTokenFromHttp(request)
      this.logger.debug(`HTTP Request: ${request.method} ${request.url}`)

      if (!token) {
        this.logger.warn('No authentication token found')
        throw new UnauthorizedException('认证令牌缺失')
      }

      // 验证令牌并获取用户信息
      const user = await this.validateTokenAndGetUser(token)

      if (!user) {
        this.logger.warn('Token validation failed or user not found')
        throw new UnauthorizedException('认证失败')
      }

      // 将用户信息附加到请求对象
      request.user = user
      this.logger.debug(`Authentication successful for user: ${user.phone}`)

      return true
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`)
      throw new UnauthorizedException(error.message || '认证失败')
    }
  }

  /**
   * 从 HTTP 请求中提取 JWT 令牌
   */
  private extractTokenFromHttp(request: any): string | null {
    // 尝试从 Authorization header 提取
    const authHeader = request.headers?.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }

    // 尝试从查询参数提取（用于某些特殊场景）
    if (request.query?.token) {
      return request.query.token
    }

    // 尝试从 Cookie 提取（如果配置了）
    if (request.cookies?.access_token) {
      return request.cookies.access_token
    }

    return null
  }

  /**
   * 验证 JWT 令牌并获取用户信息
   */
  private async validateTokenAndGetUser(token: string): Promise<any> {
    try {
      // 使用 passport-jwt 的方法验证令牌
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
      const jwt = require('jsonwebtoken')

      // 验证令牌
      const payload = jwt.verify(token, jwtSecret)

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('无效的令牌格式')
      }

      // 获取用户信息（包含角色和权限
      const user = await this.authService.validateUser(payload.sub)

      if (!user || user.status !== 2) {
        const statusMessages = {
          1: '用户账户待激活',
          3: '用户账户已下线',
          4: '用户账户已被锁定'
        }
        throw new UnauthorizedException(user ? statusMessages[user.status] || '用户状态异常' : '用户不存在')
      }

      // this.logger.debug(`User validated: ${user.phone}, roles: ${user.userRoles?.map((r) => r.role.name).join(', ')}`)

      return user
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('令牌已过期')
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('无效的令牌')
      } else if (error instanceof UnauthorizedException) {
        throw error
      } else {
        this.logger.error(`Token validation error: ${error.message}`, error.stack)
        throw new UnauthorizedException('令牌验证失败')
      }
    }
  }
}
