import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { DataNotFoundException, ValidationException, ConflictException, BusinessRuleException } from '../../common/exceptions'
import { PaginationRequest } from '../../shared/common'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  /**
   * 获取所有用户
   */
  async findAll(options?: { search?: string; phone?: string; username?: string; statusList?: number[]; roleIds?: string[]; pagination?: PaginationRequest }) {
    this.logger.log(`查询用户列表: ${JSON.stringify(options)}`)

    let skip: number | undefined;
    let take: number | undefined;

    if (options?.pagination) {
      const { page, pageSize } = options.pagination;
      skip = (page - 1) * pageSize;
      take = pageSize;
    }

    // 构建查询条件
    const where: any = {}

    // 基础搜索
    if (options?.search) {
      where.OR = [{ phone: { contains: options.search, mode: 'insensitive' } }, { username: { contains: options.search, mode: 'insensitive' } }]
    }

    // 精确匹配
    if (options?.phone) {
      where.phone = options.phone
    }

    if (options?.username) {
      where.username = { contains: options.username, mode: 'insensitive' }
    }

    // 状态筛选
    if (options?.statusList && options.statusList.length > 0) {
      where.status = {
        in: options.statusList
      }
    }

    let data: any[]
    let total: number

    if (options?.pagination) {
      // 使用事务同时获取总数和数据，提高性能
      ;[total, data] = await this.prisma.$transaction([
        this.prisma.client.user.count({ where }),
        this.prisma.client.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' }
        })
      ])
    } else {
      // 没有分页参数时查询所有数据
      data = await this.prisma.client.user.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
      total = data.length
    }

    return {
      data,
      total
    }
  }

  /**
   * 根据手机号获取用户
   * @param phone 手机号
   * @returns 用户信息或 null
   */
  async findOne(phone: string) {
    this.logger.log(`根据手机号 ${phone} 获取用户`)

    // 验证手机号格式
    this.validatePhone(phone)

    // RBAC模块已删除，不再关联角色信息
    const user = await this.prisma.client.user.findUnique({
      where: { phone }
    })

    return user
  }

  /**
   * 创建用户
   */
  async create(data: Prisma.UserCreateInput) {
    this.logger.log(`创建用户: ${data.phone}`)

    // 验证手机号格式
    if (data.phone) {
      this.validatePhone(data.phone)
    }

    // 验证用户名
    if (!data.username || data.username.trim().length === 0) {
      throw new ValidationException('用户名不能为空')
    }

    // 验证密码
    if (data.password) {
      this.validatePasswordStrength(data.password as string)
      // 加密密码
      data.password = await bcrypt.hash(data.password, 10)
    } else {
      throw new ValidationException('密码不能为空')
    }

    // 检查手机号是否已存在
    const existingUser = await this.findOne(data.phone as string)

    if (existingUser) {
      throw new ConflictException(`手机号 ${data.phone} 已被注册`)
    }

    // RBAC模块已删除，不关联角色信息
    return this.prisma.user.create({
      data
    })
  }

  /**
   * 更新用户
   */
  async update(phone: string, data: Prisma.UserUpdateInput) {
    this.logger.log(`更新用户: ${phone}`)

    // 验证手机号格式
    this.validatePhone(phone)

    // 验证用户存在（由 Controller 层处理异常）
    const existingUser = await this.findOne(phone)
    if (!existingUser) {
      throw new DataNotFoundException('用户', phone)
    }

    // 如果更新手机号，验证新手机号格式
    if (data.phone) {
      this.validatePhone(data.phone as string)

      // 检查新手机号是否已存在
      const existingUserWithNewPhone = await this.findOne(data.phone as string)

      if (existingUserWithNewPhone) {
        throw new ConflictException(`手机号 ${data.phone} 已被注册`)
      }
    }

    // 如果更新用户名，验证用户名
    if (data.username && data.username !== undefined) {
      if (typeof data.username === 'string' && data.username.trim().length === 0) {
        throw new ValidationException('用户名不能为空')
      }
    }

    // 如果更新密码，验证密码强度并加密
    if (data.password) {
      this.validatePasswordStrength(data.password as string)
      data.password = await bcrypt.hash(data.password as string, 10)
    }

    // RBAC模块已删除，不关联角色信息
    return this.prisma.client.user.update({
      where: { phone },
      data
    })
  }

  /**
   * 删除用户
   */
  async remove(phone: string) {
    this.logger.log(`删除用户: ${phone}`)

    // 验证手机号格式
    this.validatePhone(phone)

    // 验证用户存在（由 Controller 层处理异常）
    const existingUser = await this.findOne(phone)
    if (!existingUser) {
      throw new DataNotFoundException('用户', phone)
    }

    // RBAC模块已删除，不关联角色信息
    return this.prisma.client.user.delete({
      where: { phone }
    })
  }

  /**
   * 登录并生成 JWT token
   */
  async login(loginInput: { phone: string; password: string }) {
    this.logger.log(`用户登录: ${loginInput.phone}`)

    try {
      // 验证手机号格式
      this.validatePhone(loginInput.phone)

      // 验证用户密码
      const isPasswordValid = await this.validatePassword(loginInput.phone, loginInput.password)

      if (!isPasswordValid) {
        throw new UnauthorizedException('手机号或密码错误')
      }

      // 获取用户信息
      const user = await this.findOne(loginInput.phone)
      if (!user) {
        throw new UnauthorizedException('手机号或密码错误')
      }

      // 生成 token
      const token = this.jwtService.sign({
        sub: user?.phone || '',
        phone: user?.phone || ''
      })

      return {
        user,
        token,
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10)
      }
    } catch (error) {
      if (error instanceof DataNotFoundException) {
        throw new UnauthorizedException('手机号或密码错误')
      }
      throw error
    }
  }

  /**
   * 注册新用户并生成 JWT token
   */
  async register(registerInput: { phone: string; username: string; password: string; verificationCode?: string }) {
    this.logger.log(`用户注册: ${registerInput.phone}`)

    // 验证手机号格式
    this.validatePhone(registerInput.phone)

    // 检查手机号是否已存在
    const existingUser = await this.findOne(registerInput.phone)

    if (existingUser) {
      throw new ConflictException(`手机号 ${registerInput.phone} 已被注册`)
    }

    // RBAC模块已删除，不再分配角色，直接创建用户
    const savedUser = await this.create({
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
      token,
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10)
    }
  }

  /**
   * 获取用户信息（包含角色和权限）
   */
  async getUserWithRoles(phone: string) {
    this.logger.log(`获取用户及角色信息: ${phone}`)
    // RBAC模块已删除，不再获取角色信息
    return await this.findOne(phone)
  }

  /**
   * 创建超级管理员
   * 注意: RBAC模块已删除，此功能暂时不可用
   */
  async createSuperAdmin(input: { username: string; phone: string; password: string; adminKey?: string }) {
    this.logger.log(`创建超级管理员: ${input.username}, ${input.phone}`)
    throw new BusinessRuleException('RBAC模块已删除，角色管理功能暂时不可用')
  }

  /**
   * 将现有用户提升为超级管理员
   * 注意: RBAC模块已删除，此功能暂时不可用
   */
  async promoteToSuperAdmin(userPhone: string) {
    this.logger.log(`提升用户为超级管理员: ${userPhone}`)
    throw new BusinessRuleException('RBAC模块已删除，角色管理功能暂时不可用')
  }

  /**
   * 验证用户密码
   */
  async validatePassword(phone: string, password: string) {
    this.logger.log(`验证用户 ${phone} 的密码`)

    // 验证手机号格式
    this.validatePhone(phone)

    const user = await this.prisma.client.user.findUnique({ where: { phone } })

    if (!user) {
      this.logger.error(`用户 ${phone} 不存在`)
      return false
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      this.logger.error(`用户 ${phone} 密码验证失败`)
    }

    return isPasswordValid
  }

  /**
   * 验证手机号格式
   */
  private validatePhone(phone: string): void {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      throw new ValidationException('手机号格式不正确')
    }
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string) {
    this.logger.log(`根据用户名查找用户: ${username}`)

    return await this.prisma.client.user.findFirst({
      where: { username }
    })
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(phone: string, status: number) {
    this.logger.log(`更新用户状态: ${phone} -> ${status}`)

    // 验证手机号格式
    this.validatePhone(phone)

    // 验证状态值
    const validStatuses = [1, 2, 3, 4] // 待激活、激活、下线、锁定
    if (!validStatuses.includes(status)) {
      throw new ValidationException('无效的用户状态')
    }

    // 检查用户是否存在
    const existingUser = await this.findOne(phone)
    if (!existingUser) {
      throw new DataNotFoundException('用户', phone)
    }

    // 更新状态
    const updatedUser = await this.prisma.client.user.update({
      where: { phone },
      data: { status }
    })

    const statusNames = { 1: '待激活', 2: '激活', 3: '下线', 4: '锁定' }
    this.logger.log(`用户 ${phone} 状态已更新为: ${statusNames[status]}`)

    return updatedUser
  }

  /**
   * 获取用户统计信息
   */
  async getStats() {
    this.logger.log('获取用户统计信息')

    const totalUsers = await this.prisma.client.user.count()
    const activeUsers = await this.prisma.client.user.count({
      where: { status: 2 } // 激活状态
    })
    const inactiveUsers = await this.prisma.client.user.count({
      where: { status: { in: [1, 3, 4] } } // 待激活、下线、锁定
    })

    // 获取今天新增用户数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = await this.prisma.client.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    })

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersToday
    }
  }

  /**
   * 验证密码强度
   */
  private validatePasswordStrength(password: string): void {
    // 密码至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      throw new ValidationException('密码至少8位，包含大小写字母、数字和特殊字符')
    }
  }
}
