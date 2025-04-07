import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserInput: CreateUserInput): Promise<User> {
    const { email, password } = createUserInput;

    // 检查用户是否已存在
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      ...createUserInput,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async login(loginInput: LoginInput): Promise<{ token: string; user: User }> {
    const { email, password } = loginInput;

    // 查找用户
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 生成 JWT token
    const token = this.jwtService.sign({ 
      sub: user.id,
      email: user.email 
    });

    return { token, user };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
} 