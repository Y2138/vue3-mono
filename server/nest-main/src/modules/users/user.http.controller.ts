import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, ConflictException, UnauthorizedException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger'
import { BaseController } from '../../common/controllers/base.controller'
import { ApiResponse } from '../../common/response/types'
import { UserService } from './user.service'
import { User, AuthResponse, GetUsersResponse, LoginRequest, RegisterRequest, CreateUserRequest, UpdateUserRequest } from '../../shared/users'
import { UserTransformer } from '../../common/transformers/user.transformer'

/**
 * 用户认证和管理 HTTP 控制器
 * 使用 proto 定义的类型确保前后端接口一致性
 */
@ApiTags('Users')
@Controller('api')
export class UserHttpController extends BaseController {
  constructor(private readonly userService: UserService) {
    super('UserHttpController')
  }

  // ========================================
  // 🔐 用户认证相关接口
  // ========================================

  /**
   * 用户登录
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '使用手机号和密码进行用户登录认证'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '登录成功，返回用户信息和访问令牌'
  })
  @SwaggerApiResponse({
    status: 401,
    description: '登录失败，手机号或密码错误'
  })
  async login(@Body() loginRequest: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // 验证登录请求
      const validatedRequest = UserTransformer.validateLoginRequest(loginRequest)

      // 执行登录逻辑
      const result = await this.userService.login({
        phone: validatedRequest.phone,
        password: validatedRequest.password
      })

      if (!result) {
        throw new UnauthorizedException('手机号或密码错误')
      }

      // 转换为 proto 格式的响应
      const authResponse = UserTransformer.createAuthResponse(result.user, result.token)

      return this.success(authResponse, '登录成功')
    } catch (error) {
      return this.handleError(error, '登录失败')
    }
  }

  /**
   * 用户注册
   */
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '用户注册',
    description: '注册新用户账号'
  })
  @SwaggerApiResponse({
    status: 201,
    description: '注册成功，返回用户信息和访问令牌'
  })
  @SwaggerApiResponse({
    status: 409,
    description: '注册失败，手机号已存在'
  })
  async register(@Body() registerRequest: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // 验证注册请求
      const validatedRequest = UserTransformer.validateRegisterRequest(registerRequest)

      // 检查手机号是否已存在
      const existingUser = await this.userService.findOne(validatedRequest.phone)
      if (existingUser) {
        throw new ConflictException('该手机号已被注册')
      }

      // 执行注册逻辑
      const result = await this.userService.register({
        phone: validatedRequest.phone,
        username: validatedRequest.username,
        password: validatedRequest.password
      })

      // 转换为 proto 格式的响应
      const authResponse = UserTransformer.createAuthResponse(result.user, result.token)

      return this.success(authResponse, '注册成功')
    } catch (error) {
      return this.handleError(error, '注册失败')
    }
  }

  /**
   * 获取当前用户信息
   */
  @Get('auth/profile')
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取用户信息'
  })
  async getCurrentUser(@Query('phone') phone: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userService.findOne(phone)
      if (!user) {
        return this.error('用户不存在', 404)
      }

      // 转换为 proto 格式
      const userProto = UserTransformer.toProtobuf(user)

      return this.success(userProto, '获取用户信息成功')
    } catch (error) {
      return this.handleError(error, '获取用户信息失败')
    }
  }

  /**
   * 用户登出
   */
  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登出',
    description: '用户登出，清除认证状态'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '登出成功'
  })
  async logout(): Promise<ApiResponse<void>> {
    try {
      // 这里可以实现 token 黑名单等逻辑
      return this.success(undefined, '登出成功')
    } catch (error) {
      return this.handleError(error, '登出失败')
    }
  }

  // ========================================
  // 👥 用户管理相关接口
  // ========================================

  /**
   * 获取用户列表
   */
  @Get('users')
  @ApiOperation({
    summary: '获取用户列表',
    description: '分页获取用户列表，支持关键词搜索和状态筛选'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取用户列表'
  })
  async getUsers(@Query('page') page: number = 1, @Query('pageSize') pageSize: number = 20, @Query('keyword') keyword?: string, @Query('isActive') isActive?: boolean): Promise<ApiResponse<GetUsersResponse>> {
    try {
      const result = await this.userService.findAll({
        page,
        pageSize,
        search: keyword,
        isActive
      })

      // 转换为 proto 格式的响应
      const usersResponse: GetUsersResponse = {
        users: result.data.map((user) => UserTransformer.toProtobuf(user)),
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }
      }

      return this.success(usersResponse, '获取用户列表成功')
    } catch (error) {
      return this.handleError(error, '获取用户列表失败')
    }
  }

  /**
   * 根据手机号获取用户详情
   */
  @Get('users/:phone')
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据手机号获取用户的详细信息'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取用户详情'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '用户不存在'
  })
  async getUserByPhone(@Param('phone') phone: string): Promise<ApiResponse<User>> {
    try {
      const user = await this.userService.findOne(phone)
      if (!user) {
        return this.error('用户不存在', 404)
      }

      // 转换为 proto 格式
      const userProto = UserTransformer.toProtobuf(user)

      return this.success(userProto, '获取用户详情成功')
    } catch (error) {
      return this.handleError(error, '获取用户详情失败')
    }
  }

  /**
   * 创建用户
   */
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建用户',
    description: '创建新的用户账号'
  })
  @SwaggerApiResponse({
    status: 201,
    description: '用户创建成功'
  })
  @SwaggerApiResponse({
    status: 409,
    description: '手机号已存在'
  })
  async createUser(@Body() createUserRequest: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // 检查手机号是否已存在
      const existingUser = await this.userService.findOne(createUserRequest.phone)
      if (existingUser) {
        throw new ConflictException('该手机号已被注册')
      }

      // 创建用户
      const user = await this.userService.create({
        phone: createUserRequest.phone,
        username: createUserRequest.username,
        password: createUserRequest.password
      })

      // 转换为 proto 格式
      const userProto = UserTransformer.toProtobuf(user)

      return this.success(userProto, '用户创建成功')
    } catch (error) {
      return this.handleError(error, '用户创建失败')
    }
  }

  /**
   * 更新用户信息
   */
  @Post('users/:phone')
  @ApiOperation({
    summary: '更新用户信息',
    description: '更新指定用户的信息'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '用户信息更新成功'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '用户不存在'
  })
  async updateUser(@Param('phone') phone: string, @Body() updateUserRequest: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      // 检查用户是否存在
      const existingUser = await this.userService.findOne(phone)
      if (!existingUser) {
        return this.error('用户不存在', 404)
      }

      // 更新用户信息
      const updatedUser = await this.userService.update(phone, {
        username: updateUserRequest.username,
        isActive: updateUserRequest.isActive
      })

      // 转换为 proto 格式
      const userProto = UserTransformer.toProtobuf(updatedUser)

      return this.success(userProto, '用户信息更新成功')
    } catch (error) {
      return this.handleError(error, '用户信息更新失败')
    }
  }

  /**
   * 删除用户
   */
  @Post('users/:phone/delete')
  @ApiOperation({
    summary: '删除用户',
    description: '删除指定的用户账号'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '用户删除成功'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '用户不存在'
  })
  async deleteUser(@Param('phone') phone: string): Promise<ApiResponse<void>> {
    try {
      // 检查用户是否存在
      const existingUser = await this.userService.findOne(phone)
      if (!existingUser) {
        return this.error('用户不存在', 404)
      }

      // 删除用户
      await this.userService.remove(phone)

      return this.success(undefined, '用户删除成功')
    } catch (error) {
      return this.handleError(error, '用户删除失败')
    }
  }

  // ========================================
  // 📊 用户统计相关接口
  // ========================================

  /**
   * 获取用户统计信息
   */
  @Get('users/stats')
  @ApiOperation({
    summary: '获取用户统计信息',
    description: '获取用户相关的统计数据'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取统计信息'
  })
  async getUserStats(): Promise<
    ApiResponse<{
      totalUsers: number
      activeUsers: number
      inactiveUsers: number
      newUsersToday: number
    }>
  > {
    try {
      const stats = await this.userService.getStats()
      return this.success(stats, '获取统计信息成功')
    } catch (error) {
      return this.handleError(error, '获取统计信息失败')
    }
  }

  /**
   * 检查手机号是否存在
   */
  @Get('users/check-phone/:phone')
  @ApiOperation({
    summary: '检查手机号是否存在',
    description: '检查指定手机号是否已被注册'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '检查完成'
  })
  async checkPhoneExists(@Param('phone') phone: string): Promise<ApiResponse<{ exists: boolean }>> {
    try {
      const user = await this.userService.findOne(phone)
      return this.success({ exists: !!user }, '检查完成')
    } catch (error) {
      return this.handleError(error, '检查失败')
    }
  }

  /**
   * 检查用户名是否存在
   */
  @Get('users/check-username/:username')
  @ApiOperation({
    summary: '检查用户名是否存在',
    description: '检查指定用户名是否已被使用'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '检查完成'
  })
  async checkUsernameExists(@Param('username') username: string): Promise<ApiResponse<{ exists: boolean }>> {
    try {
      const user = await this.userService.findByUsername(username)
      return this.success({ exists: !!user }, '检查完成')
    } catch (error) {
      return this.handleError(error, '检查失败')
    }
  }
}
