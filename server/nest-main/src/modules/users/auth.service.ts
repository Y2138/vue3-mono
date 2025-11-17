import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { UserService } from './user.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ConflictException, BusinessRuleException, DataNotFoundException } from '../../common/exceptions'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private readonly userService: UserService, private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async register(registerInput: { phone: string; username: string; password: string }) {
    this.logger.log(`注册用户: ${registerInput.username}, ${registerInput.phone}`)

    try {
      // 检查手机号是否已存在
      await this.userService.findOne(registerInput.phone)
      throw new ConflictException('该手机号已被注册')
    } catch (error) {
      // 如果是 DataNotFoundException，说明用户不存在，可以继续注册
      if (!(error instanceof DataNotFoundException)) {
        throw error
      }
    }

    // 创建新用户（不再分配角色，RBAC已删除）
    const savedUser = await this.userService.create({
      phone: registerInput.phone,
      username: registerInput.username,
      password: registerInput.password,
      status: 2 // 激活状态
    })

    // 生成 token
    const token = this.jwtService.sign({
      sub: savedUser.phone,
      phone: savedUser.phone
    })

    return {
      user: savedUser,
      token
    }
  }

  async login(loginInput: { phone: string; password: string }) {
    try {
      // 验证用户密码
      const isPasswordValid = await this.userService.validatePassword(loginInput.phone, loginInput.password)

      if (!isPasswordValid) {
        throw new UnauthorizedException('手机号或密码错误')
      }

      // 获取用户信息
      const user = await this.userService.findOne(loginInput.phone)

      // 生成 token
      const token = this.jwtService.sign({
        sub: user?.phone || '',
        phone: user?.phone || ''
      })

      return {
        user,
        token
      }
    } catch (error) {
      if (error instanceof DataNotFoundException) {
        throw new UnauthorizedException('手机号或密码错误')
      }
      throw error
    }
  }

  async validateUser(userPhone: string) {
    this.logger.log(`验证用户: ${userPhone}`)

    try {
      const user = await this.prisma.user.findUnique({
      where: { phone: userPhone }
    })

      if (!user) {
        this.logger.error(`用户不存在: ${userPhone}`)
        throw new UnauthorizedException('用户不存在')
      }

      // 检查用户状态：只有激活状态(2)的用户才能正常使用
      if (user.status !== 2) {
        const statusMessages = {
          1: '用户账户待激活',
          3: '用户账户已下线',
          4: '用户账户已被锁定'
        }
        this.logger.error(`用户状态异常: ${userPhone}, 状态: ${user.status}`)
        throw new UnauthorizedException(statusMessages[user.status] || '用户状态异常')
      }

      this.logger.log(`用户验证成功: ${userPhone}`)

      return user
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      this.logger.error(`验证用户异常: ${userPhone}, ${error.message}`)
      throw new UnauthorizedException()
    }
  }

  /**
   * 创建超级管理员用户
   * 注意: RBAC模块已删除，此功能暂时不可用
   */
  async createSuperAdmin(input: { username: string; phone: string; password: string }) {
    this.logger.log(`创建超级管理员: ${input.username}, ${input.phone}`)
    throw new BusinessRuleException('RBAC模块已删除，角色管理功能暂时不可用')
  }

  /**
   * 将现有用户提升为超级管理员
   */
  async promoteToSuperAdmin(userPhone: string) {
    this.logger.log(`提升用户为超级管理员: ${userPhone}`)
    throw new BusinessRuleException('RBAC模块已删除，角色管理功能暂时不可用')
  }
}
