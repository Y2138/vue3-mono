import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import { User } from './entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { RegisterInput } from './dto/register.input';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerInput: RegisterInput) {
    // 检查手机号是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { phone: registerInput.phone },
    });

    if (existingUser) {
      throw new ConflictException('该手机号已被注册');
    }

    // 创建新用户
    const user = new User();
    user.phone = registerInput.phone;
    user.username = registerInput.username;
    user.password = await bcrypt.hash(registerInput.password, 10);

    // 获取普通用户角色
    const normalRole = await this.roleRepository.findOne({ where: { name: '普通用户' } });
    if (!normalRole) {
      throw new Error('Normal user role not found');
    }

    // 设置用户角色
    user.roles = [normalRole];
    user.isActive = true;

    // 保存用户
    const savedUser = await this.userRepository.save(user);

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

  async login(loginInput: LoginInput) {
    const user = await this.userRepository.findOne({
      where: { phone: loginInput.phone },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(
      loginInput.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const token = this.jwtService.sign({
      sub: user.phone,
      phone: user.phone,
    });

    return {
      user,
      token,
    };
  }

  async validateUser(userPhone: string): Promise<User> {
    this.logger.log(`验证用户: ${userPhone}`);
    
    try {
      const user = await this.userRepository.findOne({ 
        where: { phone: userPhone },
        relations: ['roles', 'roles.permissions']
      });
      
      if (!user) {
        this.logger.error(`用户不存在: ${userPhone}`);
        throw new UnauthorizedException('用户不存在');
      }
      
      if (!user.isActive) {
        this.logger.error(`用户未激活: ${userPhone}`);
        throw new UnauthorizedException('用户未激活');
      }
      
      this.logger.log(`用户验证成功: ${userPhone}, 角色数: ${user.roles?.length || 0}`);
      
      if (user.roles) {
        user.roles.forEach(role => {
          this.logger.log(`角色 ${role.name} 拥有 ${role.permissions?.length || 0} 个权限`);
        });
      }
      
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
  }): Promise<{ user: User; token: string }> {
    this.logger.log(`创建超级管理员: ${input.username}, ${input.phone}`);
    
    // 检查手机号是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { phone: input.phone },
    });

    if (existingUser) {
      throw new ConflictException('该手机号已被注册');
    }

    // 创建新用户
    const user = new User();
    user.phone = input.phone;
    user.username = input.username;
    user.password = await bcrypt.hash(input.password, 10);

    // 获取超级管理员角色
    const superAdminRole = await this.roleRepository.findOne({ where: { name: '超级管理员' } });
    if (!superAdminRole) {
      this.logger.error('超级管理员角色不存在，请先初始化RBAC数据');
      throw new Error('超级管理员角色不存在，请先初始化RBAC数据');
    }

    // 设置用户角色
    user.roles = [superAdminRole];
    user.isActive = true;

    // 保存用户
    const savedUser = await this.userRepository.save(user);
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
  async promoteToSuperAdmin(userPhone: string): Promise<User> {
    this.logger.log(`提升用户为超级管理员: ${userPhone}`);
    
    const user = await this.userRepository.findOne({
      where: { phone: userPhone },
      relations: ['roles'],
    });

    if (!user) {
      this.logger.error(`用户不存在: ${userPhone}`);
      throw new UnauthorizedException('用户不存在');
    }

    // 获取超级管理员角色
    const superAdminRole = await this.roleRepository.findOne({ where: { name: '超级管理员' } });
    if (!superAdminRole) {
      this.logger.error('超级管理员角色不存在，请先初始化RBAC数据');
      throw new Error('超级管理员角色不存在，请先初始化RBAC数据');
    }

    // 检查用户是否已经是超级管理员
    const isSuperAdmin = user.roles.some(role => role.name === '超级管理员');
    if (isSuperAdmin) {
      this.logger.log(`用户已经是超级管理员: ${userPhone}`);
      return user; // 用户已经是超级管理员，无需更改
    }

    // 添加超级管理员角色
    user.roles.push(superAdminRole);
    const updatedUser = await this.userRepository.save(user);
    this.logger.log(`用户已成功提升为超级管理员: ${userPhone}`);
    
    return updatedUser;
  }
} 