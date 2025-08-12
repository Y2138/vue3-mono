import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有用户
   */
  async findAll(): Promise<User[]> {
    this.logger.log('获取所有用户');
    return this.prisma.client.user.findMany({
      include: { userRoles: { include: { role: true } } },
    });
  }

  /**
   * 根据手机号获取用户
   */
  async findOne(phone: string): Promise<User | null> {
    this.logger.log(`根据手机号 ${phone} 获取用户`);

    // 验证手机号格式
    this.validatePhone(phone);

    const user = await this.prisma.client.user.findUnique({
      where: { phone },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      this.logger.error(`用户 ${phone} 不存在`);
      throw new NotFoundException(`用户 ${phone} 不存在`);
    }

    return user;
  }

  /**
   * 创建用户
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`创建用户: ${data.phone}`);

    // 验证手机号格式
    if (data.phone) {
      this.validatePhone(data.phone);
    }

    // 验证用户名
    if (!data.username || data.username.trim().length === 0) {
      throw new BadRequestException('用户名不能为空');
    }

    // 验证密码
    if (data.password) {
      this.validatePasswordStrength(data.password as string);
      // 加密密码
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      throw new BadRequestException('密码不能为空');
    }

    // 检查手机号是否已存在
    try {
      await this.findOne(data.phone as string);
      throw new ConflictException(`手机号 ${data.phone} 已被注册`);
    } catch (error) {
      // 如果是 NotFoundException，说明用户不存在，可以继续创建
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    return this.prisma.client.user.create({
      data,
      include: { userRoles: { include: { role: true } } },
    });
  }

  /**
   * 更新用户
   */
  async update(phone: string, data: Prisma.UserUpdateInput): Promise<User> {
    this.logger.log(`更新用户: ${phone}`);

    // 验证手机号格式
    this.validatePhone(phone);

    // 检查用户是否存在
    await this.findOne(phone);

    // 如果更新手机号，验证新手机号格式
    if (data.phone) {
      this.validatePhone(data.phone as string);

      // 检查新手机号是否已存在
      try {
        await this.findOne(data.phone as string);
        throw new ConflictException(`手机号 ${data.phone} 已被注册`);
      } catch (error) {
        // 如果是 NotFoundException，说明新手机号未被注册，可以继续更新
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
    }

    // 如果更新用户名，验证用户名
    if (data.username && data.username !== undefined) {
      if (typeof data.username === 'string' && (data.username.trim().length === 0)) {
        throw new BadRequestException('用户名不能为空');
      }
    }

    // 如果更新密码，验证密码强度并加密
    if (data.password) {
      this.validatePasswordStrength(data.password as string);
      data.password = await bcrypt.hash(data.password as string, 10);
    }

    return this.prisma.client.user.update({
      where: { phone },
      data,
      include: { userRoles: { include: { role: true } } },
    });
  }

  /**
   * 删除用户
   */
  async remove(phone: string): Promise<User> {
    this.logger.log(`删除用户: ${phone}`);

    // 验证手机号格式
    this.validatePhone(phone);

    // 检查用户是否存在
    await this.findOne(phone);

    return this.prisma.client.user.delete({
      where: { phone },
      include: { userRoles: { include: { role: true } } },
    });
  }

  /**
   * 验证用户密码
   */
  async validatePassword(phone: string, password: string): Promise<boolean> {
    this.logger.log(`验证用户 ${phone} 的密码`);

    // 验证手机号格式
    this.validatePhone(phone);

    const user = await this.prisma.client.user.findUnique({ where: { phone } });

    if (!user) {
      this.logger.error(`用户 ${phone} 不存在`);
      return false;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.error(`用户 ${phone} 密码验证失败`);
    }

    return isPasswordValid;
  }

  /**
   * 验证手机号格式
   */
  private validatePhone(phone: string): void {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
  }

  /**
   * 验证密码强度
   */
  private validatePasswordStrength(password: string): void {
    // 密码至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException('密码至少8位，包含大小写字母、数字和特殊字符');
    }
  }
}