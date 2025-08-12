import { Injectable, NotFoundException, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerInput: { phone: string; username: string; password: string }) {
    // 检查手机号是否已存在
    try {
      await this.userService.findOne(registerInput.phone);
      throw new ConflictException('该手机号已被注册');
    } catch (error) {
      // 如果是 NotFoundException，说明用户不存在，可以继续注册
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    // 获取普通用户角色
    const normalRole = await this.prisma.client.role.findFirst({
        where: { name: '普通用户' },
      });

    if (!normalRole) {
      throw new Error('普通用户角色不存在');
    }

    // 创建新用户
    const savedUser = await this.userService.create({
      phone: registerInput.phone,
      username: registerInput.username,
      password: registerInput.password,
      isActive: true,
      userRoles: {
        create: [{
          role: {
            connect: { id: normalRole.id }
          }
        }]
      },
    });

    // 生成 token
    const token = this.jwtService.sign({
      sub: savedUser.phone,
      phone: savedUser.phone,
    });

    return {
      user: savedUser,
      token,
    };
  }

  async login(loginInput: { phone: string; password: string }) {
    try {
      // 验证用户密码
      const isPasswordValid = await this.userService.validatePassword(
        loginInput.phone,
        loginInput.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('手机号或密码错误');
      }

      // 获取用户信息
      const user = await this.userService.findOne(loginInput.phone);

      // 生成 token
      const token = this.jwtService.sign({
        sub: user?.phone || '',
        phone: user?.phone || '',
      });

      return {
        user,
        token,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('手机号或密码错误');
      }
      throw error;
    }
  }

  async validateUser(userPhone: string): Promise<any> {
    this.logger.log(`验证用户: ${userPhone}`);
    
    try {
      const user = await this.prisma.client.user.findUnique({
        where: { phone: userPhone },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        },
      });
      
      if (!user) {
        this.logger.error(`用户不存在: ${userPhone}`);
        throw new UnauthorizedException('用户不存在');
      }
      
      if (!user.isActive) {
        this.logger.error(`用户未激活: ${userPhone}`);
        throw new UnauthorizedException('用户未激活');
      }
      
      // 通过中间件转换后，user应该有roles属性
      const roles = (user as any).roles || [];
      this.logger.log(`用户验证成功: ${userPhone}, 角色数: ${roles.length || 0}`);
      
      roles.forEach((role: any) => {
        this.logger.log(`角色 ${role.name} 拥有 ${role.permissions?.length || 0} 个权限`);
      });
      
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`验证用户异常: ${userPhone}, ${error.message}`);
      throw new UnauthorizedException();
    }
  }

  /**
   * 创建超级管理员用户
   */
  async createSuperAdmin(input: {
    username: string;
    phone: string;
    password: string;
  }): Promise<{ user: any; token: string }> {
    this.logger.log(`创建超级管理员: ${input.username}, ${input.phone}`);
    
    // 检查手机号是否已存在
    try {
      await this.userService.findOne(input.phone);
      throw new ConflictException('该手机号已被注册');
    } catch (error) {
      // 如果是 NotFoundException，说明用户不存在，可以继续注册
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    // 获取超级管理员角色
    const superAdminRole = await this.prisma.client.role.findFirst({
        where: { name: '超级管理员' },
      });

    if (!superAdminRole) {
      this.logger.error('超级管理员角色不存在，请先初始化RBAC数据');
      throw new Error('超级管理员角色不存在，请先初始化RBAC数据');
    }

    // 创建新用户
    const savedUser = await this.userService.create({
      phone: input.phone,
      username: input.username,
      password: input.password,
      isActive: true,
      userRoles: {
        create: [{
          role: {
            connect: { id: superAdminRole.id }
          }
        }]
      },
    });

    this.logger.log(`超级管理员创建成功: ${savedUser.phone}`);

    // 生成 token
    const token = this.jwtService.sign({
      sub: savedUser.phone,
      phone: savedUser.phone,
    });

    return {
      user: savedUser,
      token,
    };
  }

  /**
   * 将现有用户提升为超级管理员
   */
  async promoteToSuperAdmin(userPhone: string): Promise<any> {
    this.logger.log(`提升用户为超级管理员: ${userPhone}`);
    
    try {
      // 检查用户是否存在
      const user = await this.userService.findOne(userPhone);

      // 获取超级管理员角色
      const superAdminRole = await this.prisma.client.role.findFirst({
        where: { name: '超级管理员' },
      });
      if (!superAdminRole) {
        this.logger.error('超级管理员角色不存在，请先初始化RBAC数据');
        throw new Error('超级管理员角色不存在，请先初始化RBAC数据');
      }

      // 检查用户是否已经是超级管理员
      const roles = (user as any).roles || [];
      const isSuperAdmin = roles.some((role: any) => role.name === '超级管理员') || false;
      if (isSuperAdmin) {
        this.logger.log(`用户已经是超级管理员: ${userPhone}`);
        return user; // 用户已经是超级管理员，无需更改
      }

      // 添加超级管理员角色
      const updatedUser = await this.prisma.client.user.update({
        where: { phone: userPhone },
        data: {
          userRoles: {
            create: [{
              role: {
                connect: { id: superAdminRole.id }
              }
            }]
          }
        },
        include: { userRoles: { include: { role: true } } }
      });

      // 中间件会自动处理数据转换

      this.logger.log(`用户已成功提升为超级管理员: ${userPhone}`);
      
      return updatedUser;
    } catch (error) {
      this.logger.error(`提升用户为超级管理员失败: ${userPhone}, ${error.message}`);
      throw error;
    }
  }
}