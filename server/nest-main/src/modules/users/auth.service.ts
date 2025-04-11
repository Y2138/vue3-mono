import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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
    const user = await this.userRepository.findOne({ 
      where: { phone: userPhone },
      relations: ['roles']
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
} 