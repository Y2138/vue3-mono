import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      ignoreExpiration: false,
    });
    this.logger.log(`JWT策略初始化，secretOrKey: ${process.env.JWT_SECRET ? '已配置' : '使用默认值'}`);
  }

  async validate(payload: { sub: string; phone: string }) {
    this.logger.log(`验证JWT payload: ${JSON.stringify(payload)}`);
    try {
      const user = await this.authService.validateUser(payload.sub);
      
      if (!user || !user.isActive) {
        this.logger.error(`用户不存在或未激活: ${payload.sub}`);
        throw new UnauthorizedException('用户不存在或未激活');
      }

      if (!user.roles) {
        this.logger.error(`用户没有加载角色信息: ${payload.sub}`);
      } else {
        this.logger.log(`用户 ${payload.sub} 拥有角色: ${user.roles.map(r => r.name).join(', ')}`);
        
        const hasPermissions = user.roles.every(role => role.permissions && role.permissions.length > 0);
        if (!hasPermissions) {
          this.logger.warn(`用户 ${payload.sub} 的角色没有加载权限信息`);
        }
      }

      return user;
    } catch (error) {
      this.logger.error(`用户验证失败: ${payload.sub}, 错误: ${error.message}`);
      throw error;
    }
  }
} 