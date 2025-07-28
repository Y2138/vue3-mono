import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserGrpcController } from './user.grpc.controller';

/**
 * 登录请求 DTO
 */
export class LoginDto {
  phone: string;
  password: string;
}

/**
 * 注册请求 DTO
 */
export class RegisterDto {
  phone: string;
  username: string;
  password: string;
  verificationCode?: string;
}

/**
 * 创建用户请求 DTO
 */
export class CreateUserDto {
  phone: string;
  username: string;
  password: string;
  roleIds?: string[];
}

/**
 * 更新用户请求 DTO
 */
export class UpdateUserDto {
  username?: string;
  isActive?: boolean;
  roleIds?: string[];
}

/**
 * 创建超级管理员请求 DTO
 */
export class CreateSuperAdminDto {
  phone: string;
  username: string;
  password: string;
  adminKey: string;
}

/**
 * 用户分页查询参数
 */
export class GetUsersQueryDto {
  page?: number = 1;
  pageSize?: number = 10;
  search?: string;
  isActive?: boolean;
}

/**
 * 用户服务 HTTP Controller
 * 提供用户认证、管理等功能的 RESTful 接口
 */
@ApiTags('用户管理')
@Controller('users')
export class UserHttpController {
  constructor(private readonly userGrpcController: UserGrpcController) {}

  /**
   * 用户登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '手机号或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    // 复用 gRPC Controller 的逻辑
    return this.userGrpcController.login(
      {
        phone: loginDto.phone,
        password: loginDto.password,
      },
      {} as any // 创建空的 metadata，实际项目中可能需要从 HTTP headers 转换
    );
  }

  /**
   * 用户注册
   */
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '手机号已被注册' })
  async register(@Body() registerDto: RegisterDto) {
    return this.userGrpcController.register(
      {
        phone: registerDto.phone,
        username: registerDto.username,
        password: registerDto.password,
        verificationCode: registerDto.verificationCode || '',
      },
      {} as any
    );
  }

  /**
   * 获取当前用户信息
   * TODO: 需要添加 JWT 认证守卫和用户装饰器
   */
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Query('phone') phone: string) {
    // 临时实现：通过查询参数获取用户手机号
    // TODO: 从认证用户信息创建 metadata
    const metadata = this.createMetadataFromPhone(phone);
    
    return this.userGrpcController.getProfile(
      { phone },
      metadata
    );
  }

  /**
   * 获取指定用户信息
   * TODO: 需要添加认证守卫
   */
  @Get('user/:phone')
  @ApiOperation({ summary: '获取指定用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUser(@Param('phone') phone: string, @Query('currentUserPhone') currentUserPhone: string) {
    const metadata = this.createMetadataFromPhone(currentUserPhone);
    
    return this.userGrpcController.getUser(
      { phone },
      metadata
    );
  }

  /**
   * 获取用户列表
   * TODO: 需要添加认证守卫
   */
  @Get('list')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUsers(@Query() query: GetUsersQueryDto, @Query('currentUserPhone') currentUserPhone: string) {
    const metadata = this.createMetadataFromPhone(currentUserPhone);
    
    return this.userGrpcController.getUsers(
      {
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 10,
        },
        search: query.search,
        isActive: query.isActive,
      },
      metadata
    );
  }

  /**
   * 创建用户
   * TODO: 需要添加认证守卫
   */
  @Post('create')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '手机号已被注册' })
  async createUser(@Body() createUserDto: CreateUserDto, @Query('currentUserPhone') currentUserPhone: string) {
    const metadata = this.createMetadataFromPhone(currentUserPhone);
    
    return this.userGrpcController.createUser(
      {
        phone: createUserDto.phone,
        username: createUserDto.username,
        password: createUserDto.password,
        roleIds: createUserDto.roleIds || [],
      },
      metadata
    );
  }

  /**
   * 更新用户
   * TODO: 需要添加认证守卫
   */
  @Put('update/:phone')
  @ApiOperation({ summary: '更新用户' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateUser(
    @Param('phone') phone: string,
    @Body() updateUserDto: UpdateUserDto,
    @Query('currentUserPhone') currentUserPhone: string
  ) {
    const metadata = this.createMetadataFromPhone(currentUserPhone);
    
    return this.userGrpcController.updateUser(
      {
        phone,
        username: updateUserDto.username,
        isActive: updateUserDto.isActive,
        roleIds: updateUserDto.roleIds || [],
      },
      metadata
    );
  }

  /**
   * 删除用户
   * TODO: 需要添加认证守卫
   */
  @Delete('delete/:phone')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async deleteUser(@Param('phone') phone: string, @Query('currentUserPhone') currentUserPhone: string) {
    const metadata = this.createMetadataFromPhone(currentUserPhone);
    
    return this.userGrpcController.deleteUser(
      { phone },
      metadata
    );
  }

  /**
   * 创建超级管理员
   */
  @Post('super-admin')
  @ApiOperation({ summary: '创建超级管理员' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '管理员密钥错误' })
  async createSuperAdmin(@Body() createSuperAdminDto: CreateSuperAdminDto) {
    return this.userGrpcController.createSuperAdmin(
      {
        phone: createSuperAdminDto.phone,
        username: createSuperAdminDto.username,
        password: createSuperAdminDto.password,
        adminKey: createSuperAdminDto.adminKey,
      },
      {} as any
    );
  }

  /**
   * 从手机号创建 gRPC metadata
   * TODO: 完善 metadata 创建逻辑
   */
  private createMetadataFromPhone(phone: string): any {
    // 这里需要根据实际的 gRPC metadata 格式来实现
    // 可能包含用户认证信息、请求ID等
    const metadata = {
      user: {
        phone: phone,
        username: 'temp-user',
      },
      headers: {
        'user-phone': phone,
        'authorization': 'Bearer temp-token', // 临时token
      },
    };

    return metadata;
  }
} 