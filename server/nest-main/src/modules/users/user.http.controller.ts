import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { BaseController } from '../../common/controllers/base.controller';
import { ApiResponse } from '../../common/response/types';
import { UserService } from './user.service';

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
export class UserHttpController extends BaseController {
  constructor(private readonly userService: UserService) {
    super(UserHttpController.name);
  }

  /**
   * 用户登录
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @SwaggerApiResponse({ status: 200, description: '登录成功' })
  @SwaggerApiResponse({ status: 401, description: '手机号或密码错误' })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<any>> {
    return this.safeExecute(
      async () => {
        try {
          // 调用 UserService 登录方法
          const result = await this.userService.login({
            phone: loginDto.phone,
            password: loginDto.password,
          });
          
          // 返回用户信息和令牌
          return {
            user: {
              phone: result.user.phone,
              username: result.user.username,
              isActive: result.user.isActive,
              roles: result.user.userRoles?.map(ur => ({
                id: ur.role.id,
                name: ur.role.name,
              })) || [],
            },
            token: result.token,
            expiresIn: result.expiresIn,
          };
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            throw error;
          }
          throw new Error('登录失败: ' + error.message);
        }
      },
      '登录成功'
    );
  }

  /**
   * 用户注册
   */
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @SwaggerApiResponse({ status: 201, description: '注册成功' })
  @SwaggerApiResponse({ status: 409, description: '手机号已被注册' })
  async register(@Body() registerDto: RegisterDto): Promise<ApiResponse<any>> {
    return this.safeExecute(
      async () => {
        try {
          // 调用 UserService 注册方法
          const result = await this.userService.register({
            phone: registerDto.phone,
            username: registerDto.username,
            password: registerDto.password,
            verificationCode: registerDto.verificationCode,
          });
          
          // 返回用户信息和令牌
          return {
            user: {
              phone: result.user.phone,
              username: result.user.username,
              isActive: result.user.isActive,
              roles: result.user.userRoles?.map(ur => ({
                id: ur.role.id,
                name: ur.role.name,
              })) || [],
            },
            token: result.token,
            expiresIn: result.expiresIn,
          };
        } catch (error) {
          if (error instanceof ConflictException) {
            throw error;
          }
          throw new Error('注册失败: ' + error.message);
        }
      },
      '注册成功'
    );
  }

  /**
   * 获取当前用户信息
   * TODO: 需要添加 JWT 认证守卫和用户装饰器
   */
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @SwaggerApiResponse({ status: 200, description: '获取成功' })
  @SwaggerApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Query('phone') phone: string): Promise<ApiResponse<any>> {
    try {
      // 临时实现：通过查询参数获取用户手机号
      // TODO: 从 JWT 中获取用户信息
      
      // 获取用户信息
      const user = await this.userService.getUserWithRoles(phone);
      
      // 转换为 HTTP 响应格式
      const userData = {
        phone: user.phone,
        username: user.username,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.userRoles?.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
                      permissions: ur.role.rolePermissions?.map(rp => ({
              id: rp.permission.id,
              name: rp.permission.name,
              resource: rp.permission.resource,
              action: rp.permission.action,
          })) || [],
        })) || [],
      };
      
      return this.success(userData, '获取用户信息成功');
    } catch (error) {
      this.logger.error('获取用户信息失败', error);
      if (error.entityType === '用户') {
        return this.dataNotFound('用户', phone);
      }
      return this.serverError('获取用户信息失败', error);
    }
  }

  /**
   * 获取指定用户信息
   * TODO: 需要添加认证守卫
   */
  @Get('user/:phone')
  @ApiOperation({ summary: '获取指定用户信息' })
  @SwaggerApiResponse({ status: 200, description: '获取成功' })
  @SwaggerApiResponse({ status: 404, description: '用户不存在' })
  async getUser(@Param('phone') phone: string, @Query('currentUserPhone') currentUserPhone: string): Promise<ApiResponse<any>> {
    try {
      // 验证当前用户权限
      await this.userService.getUserWithRoles(currentUserPhone);
      
      // 获取目标用户信息
      const user = await this.userService.getUserWithRoles(phone);
      
      // 转换为 HTTP 响应格式
      const userData = {
        phone: user.phone,
        username: user.username,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.userRoles?.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
        })) || [],
      };
      
      return this.success(userData, '获取用户信息成功');
    } catch (error) {
      this.logger.error('获取用户信息失败', error);
      if (error.entityType === '用户') {
        return this.dataNotFound('用户', phone);
      }
      return this.serverError('获取用户信息失败', error);
    }
  }

  /**
   * 获取用户列表
   * TODO: 需要添加认证守卫
   */
  @Get('list')
  @ApiOperation({ summary: '获取用户列表' })
  @SwaggerApiResponse({ status: 200, description: '获取成功' })
  async getUsers(@Query() query: GetUsersQueryDto, @Query('currentUserPhone') currentUserPhone: string): Promise<ApiResponse<any>> {
    try {
      // 验证当前用户权限
      await this.userService.getUserWithRoles(currentUserPhone);
      
      // 获取用户列表
      const result = await this.userService.findAll({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        isActive: query.isActive
      });
      
      // 转换用户列表为 HTTP 响应格式
      const users = result.data.map(user => ({
        phone: user.phone,
        username: user.username,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.userRoles?.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
        })) || [],
      }));
      
      // 返回成功响应
      return this.success({
        users,
        pagination: result.pagination
      }, '获取用户列表成功');
    } catch (error) {
      // 处理错误
      this.logger.error('获取用户列表失败', error);
      return this.serverError('获取用户列表失败', error);
    }
  }

  /**
   * 创建用户
   * TODO: 需要添加认证守卫
   */
  @Post('create')
  @ApiOperation({ summary: '创建用户' })
  @SwaggerApiResponse({ status: 201, description: '创建成功' })
  @SwaggerApiResponse({ status: 409, description: '手机号已被注册' })
  async createUser(@Body() createUserDto: CreateUserDto, @Query('currentUserPhone') currentUserPhone: string): Promise<ApiResponse<any>> {
    return this.safeExecute(
      async () => {
        // 验证当前用户权限
        await this.userService.getUserWithRoles(currentUserPhone);
        
        // 准备用户数据
        const userData = {
          phone: createUserDto.phone,
          username: createUserDto.username,
          password: createUserDto.password,
          isActive: true,
        };
        
        // 如果有角色ID，添加角色关联
        if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
          userData['userRoles'] = {
            create: createUserDto.roleIds.map(roleId => ({
              role: { connect: { id: roleId } }
            }))
          };
        }
        
        // 创建用户
        const user = await this.userService.create(userData);
        
        // 转换为 HTTP 响应格式
        return {
          phone: user.phone,
          username: user.username,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roles: user.userRoles?.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
          })) || [],
        };
      },
      '创建用户成功'
    );
  }

  /**
   * 更新用户
   * TODO: 需要添加认证守卫
   */
  @Put('update/:phone')
  @ApiOperation({ summary: '更新用户' })
  @SwaggerApiResponse({ status: 200, description: '更新成功' })
  @SwaggerApiResponse({ status: 404, description: '用户不存在' })
  async updateUser(
    @Param('phone') phone: string,
    @Body() updateUserDto: UpdateUserDto,
    @Query('currentUserPhone') currentUserPhone: string
  ): Promise<ApiResponse<any>> {
    return this.safeExecute(
      async () => {
        // 验证当前用户权限
        await this.userService.getUserWithRoles(currentUserPhone);
        
        // 准备更新数据
        const updateData: any = {};
        
        if (updateUserDto.username !== undefined) {
          updateData.username = updateUserDto.username;
        }
        
        if (updateUserDto.isActive !== undefined) {
          updateData.isActive = updateUserDto.isActive;
        }
        
        // 如果有角色ID，更新角色关联
        if (updateUserDto.roleIds && updateUserDto.roleIds.length > 0) {
          // 先删除现有角色关联，然后创建新的
          updateData.userRoles = {
            deleteMany: {},
            create: updateUserDto.roleIds.map(roleId => ({
              role: { connect: { id: roleId } }
            }))
          };
        }
        
        // 更新用户
        const user = await this.userService.update(phone, updateData);
        
        // 转换为 HTTP 响应格式
        return {
          phone: user.phone,
          username: user.username,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roles: user.userRoles?.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
          })) || [],
        };
      },
      '更新用户成功'
    );
  }

  /**
   * 删除用户
   * TODO: 需要添加认证守卫
   */
  @Delete('delete/:phone')
  @ApiOperation({ summary: '删除用户' })
  @SwaggerApiResponse({ status: 200, description: '删除成功' })
  @SwaggerApiResponse({ status: 404, description: '用户不存在' })
  async deleteUser(@Param('phone') phone: string, @Query('currentUserPhone') currentUserPhone: string): Promise<ApiResponse<null>> {
    return this.safeExecute(
      async () => {
        // 验证当前用户权限
        await this.userService.getUserWithRoles(currentUserPhone);
        
        // 删除用户
        await this.userService.remove(phone);
        
        return null;
      },
      '删除用户成功'
    );
  }

  /**
   * 创建超级管理员
   */
  @Post('super-admin')
  @ApiOperation({ summary: '创建超级管理员' })
  @SwaggerApiResponse({ status: 201, description: '创建成功' })
  @SwaggerApiResponse({ status: 400, description: '管理员密钥错误' })
  async createSuperAdmin(@Body() createSuperAdminDto: CreateSuperAdminDto): Promise<ApiResponse<any>> {
    return this.safeExecute(
      async () => {
        // 创建超级管理员
        const result = await this.userService.createSuperAdmin({
          phone: createSuperAdminDto.phone,
          username: createSuperAdminDto.username,
          password: createSuperAdminDto.password,
          adminKey: createSuperAdminDto.adminKey,
        });
        
        // 转换为 HTTP 响应格式
        return {
          user: {
            phone: result.user.phone,
            username: result.user.username,
            isActive: result.user.isActive,
            roles: result.user.userRoles?.map(ur => ({
              id: ur.role.id,
              name: ur.role.name,
            })) || [],
          },
          token: result.token,
          expiresIn: result.expiresIn,
        };
      },
      '创建超级管理员成功'
    );
  }

  // 删除 createMetadataFromPhone 方法，因为不再需要调用 gRPC 控制器
} 