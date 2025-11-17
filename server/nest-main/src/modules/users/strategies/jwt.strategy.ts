import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name)

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      ignoreExpiration: false
    })
    this.logger.log(`JWT策略初始化，secretOrKey: ${process.env.JWT_SECRET ? '已配置' : '使用默认值'}`)
  }

  async validate(payload: { sub: string; phone: string }) {
    this.logger.log(`验证JWT payload: ${JSON.stringify(payload)}`)
    try {
      const user = await this.authService.validateUser(payload.sub)

      if (!user || user.status !== 2) {
        const statusMessages = {
          1: '用户账户待激活',
          3: '用户账户已下线',
          4: '用户账户已被锁定'
        }
        this.logger.error(`用户不存在或状态异常: ${payload.sub}, 状态: ${user?.status}`)
        throw new UnauthorizedException(user ? statusMessages[user.status] || '用户状态异常' : '用户不存在')
      }

      // RBAC模块已删除，不再检查角色信息
      this.logger.log(`用户验证通过: ${payload.sub}`)

      return user
    } catch (error) {
      this.logger.error(`用户验证失败: ${payload.sub}, 错误: ${error.message}`)
      throw error
    }
  }
}
