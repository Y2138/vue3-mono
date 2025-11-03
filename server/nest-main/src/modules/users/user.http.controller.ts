import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger'
import { BaseController } from '../../common/controllers/base.controller'
import { Public } from '../../common/decorators/public.decorator'
import { ApiResponse } from '../../common/response/types'
import { UserService } from './user.service'
import { User, AuthResponse, GetUsersResponse, LoginRequest, RegisterRequest, CreateUserRequest, CreateUserFormRequest, UpdateUserRequest } from '../../shared/users'
import { Validator } from '../../common/validators'
import { USER_ENUMS, getUserStatusDesc } from './enums/user.enums'

/**
 * 用户状态操作请求
 */
interface UserStatusActionRequest {
  /** 操作类型：activate-激活，deactivate-下线，lock-锁定，unlock-解锁 */
  action: 'activate' | 'deactivate' | 'lock' | 'unlock'
}

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
  // 📋 枚举配置接口
  // ========================================

  /**
   * 获取用户模块枚举
   */
  @Get('users/enums')
  @ApiOperation({
    summary: '获取用户模块枚举',
    description: '获取用户模块所有枚举配置，包括用户状态、用户类型等'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取用户模块枚举配置'
  })
  async getUserEnums() {
    const enumResponse = {
      enums: {
        userStatus: Object.values(USER_ENUMS.USER_STATUS),
        userType: Object.values(USER_ENUMS.USER_TYPE)
      },
      version: '1.0.0'
    }

    return this.success(enumResponse, '获取用户模块枚举成功')
  }

  // ========================================
  // 🔐 用户认证相关接口
  // ========================================

  /**
   * 用户登录
   */
  @Public()
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
    // 基础格式验证
    Validator.phone(loginRequest.phone)
    Validator.password(loginRequest.password)

    // 执行登录逻辑
    const result = await this.userService.login({
      phone: loginRequest.phone,
      password: loginRequest.password
    })

    if (!result) {
      throw new UnauthorizedException('手机号或密码错误')
    }

    // 直接组装响应数据
    const authResponse: AuthResponse = {
      user: {
        phone: result.user.phone,
        username: result.user.username || '',
        status: result.user.status,
        statusDesc: getUserStatusDesc(result.user.status),
        createdAt: this.formatDateTime(result.user.createdAt),
        updatedAt: this.formatDateTime(result.user.updatedAt),
        roleIds: result.user.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
      },
      token: result.token,
      expiresAt: this.formatDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    }

    return this.success(authResponse, '登录成功')
  }

  /**
   * 用户注册
   */
  @Public()
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
    // 基础格式验证
    Validator.phone(registerRequest.phone)
    Validator.username(registerRequest.username)
    Validator.password(registerRequest.password)

    // 业务验证 - 检查手机号是否已存在
    const existingUser = await this.userService.findOne(registerRequest.phone)
    if (existingUser) {
      this.throwConflictError('该手机号已被注册')
    }

    // 执行注册逻辑
    const result = await this.userService.register({
      phone: registerRequest.phone,
      username: registerRequest.username,
      password: registerRequest.password
    })

    // 直接组装响应数据
    const authResponse: AuthResponse = {
      user: {
        phone: result.user.phone,
        username: result.user.username || '',
        status: result.user.status,
        statusDesc: getUserStatusDesc(result.user.status),
        createdAt: this.formatDateTime(result.user.createdAt),
        updatedAt: this.formatDateTime(result.user.updatedAt),
        roleIds: result.user.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
      },
      token: result.token,
      expiresAt: this.formatDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    }

    return this.success(authResponse, '注册成功')
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
    // 验证手机号格式
    Validator.phone(phone)

    const user = await this.userService.findOne(phone)
    this.assertDataExists(user, '用户', phone)

    // 直接组装用户数据
    const userResponse: User = {
      phone: user.phone,
      username: user.username || '',
      status: user.status,
      statusDesc: getUserStatusDesc(user.status),
      createdAt: this.formatDateTime(user.createdAt),
      updatedAt: this.formatDateTime(user.updatedAt),
      roleIds: user.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
    }

    return this.success(userResponse, '获取用户信息成功')
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
    // 这里可以实现 token 黑名单等逻辑
    return this.success(undefined, '登出成功')
  }

  // ========================================
  // 👥 用户管理相关接口
  // ========================================

  /**
   * 获取用户列表
   */
  @Get('users/list')
  @ApiOperation({
    summary: '获取用户列表',
    description: '分页获取用户列表，支持手机号、用户名、角色ID和激活状态筛选'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取用户列表'
  })
  async getUsers(@Query('page') page: number = 1, @Query('pageSize') pageSize: number = 20, @Query('phone') phone?: string, @Query('username') username?: string, @Query('roleIds') roleIds?: string | string[], @Query('isActive') isActive?: boolean): Promise<ApiResponse<GetUsersResponse>> {
    // 验证分页参数
    Validator.numberRange(page, 1, 1000, '页码')
    Validator.numberRange(pageSize, 1, 100, '每页数量')

    // 可选参数验证
    if (phone !== undefined && phone !== '') {
      Validator.phone(phone)
    }

    if (username !== undefined && username !== '') {
      Validator.stringLength(username, 1, 50, '用户名')
    }

    // 处理角色ID数组参数
    let roleIdArray: string[] = []
    if (roleIds) {
      if (Array.isArray(roleIds)) {
        roleIdArray = roleIds.filter((id) => id && id.trim() !== '')
      } else if (typeof roleIds === 'string' && roleIds.trim() !== '') {
        // 支持逗号分隔的字符串
        roleIdArray = roleIds
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id !== '')
      }

      // 验证角色ID格式
      if (roleIdArray.length > 0) {
        roleIdArray.forEach((roleId) => {
          Validator.stringLength(roleId, 1, 50, '角色ID')
        })
      }
    }

    // 构建查询参数
    const queryParams = {
      page,
      pageSize,
      phone: phone && phone.trim() !== '' ? phone : undefined,
      username: username && username.trim() !== '' ? username : undefined,
      roleIds: roleIdArray.length > 0 ? roleIdArray : undefined,
      isActive
    }

    const result = await this.userService.findAll(queryParams)

    // 直接组装响应数据
    const usersResponse: GetUsersResponse = {
      list: result.data.map((user) => ({
        phone: user.phone,
        username: user.username || '',
        status: user.status,
        statusDesc: getUserStatusDesc(user.status),
        createdAt: this.formatDateTime(user.createdAt),
        updatedAt: this.formatDateTime(user.updatedAt),
        roleIds: user.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
      })),
      pagination: {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }
    }

    return this.success(usersResponse, '获取用户列表成功')
  }

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
    const stats = await this.userService.getStats()
    return this.success(stats, '获取统计信息成功')
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
    const user = await this.userService.findOne(phone)
    return this.success({ exists: !!user }, '检查完成')
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
    const user = await this.userService.findByUsername(username)
    return this.success({ exists: !!user }, '检查完成')
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
    // 验证手机号格式 - 让异常直接抛出，由 HttpExceptionFilter 处理
    Validator.phone(phone)

    const user = await this.userService.findOne(phone)
    this.assertDataExists(user, '用户', phone)

    // 直接组装用户数据
    const userResponse: User = {
      phone: user.phone,
      username: user.username || '',
      status: user.status,
      statusDesc: getUserStatusDesc(user.status),
      createdAt: this.formatDateTime(user.createdAt),
      updatedAt: this.formatDateTime(user.updatedAt),
      roleIds: user.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
    }

    return this.success(userResponse, '获取用户详情成功')
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
    console.log('createUserRequest ==>', createUserRequest)
    // 基础格式验证
    Validator.phone(createUserRequest.phone)
    Validator.username(createUserRequest.username)
    Validator.password(createUserRequest.password)

    // 验证角色ID数组（如果提供）
    if (createUserRequest.roleIds && createUserRequest.roleIds.length > 0) {
      Validator.arrayNotEmpty(createUserRequest.roleIds, '角色列表')
    }

    // 检查手机号是否已存在
    const existingUser = await this.userService.findOne(createUserRequest.phone)
    if (existingUser) {
      this.throwConflictError('该手机号已被注册')
    }

    // 创建用户
    const user = await this.userService.create({
      phone: createUserRequest.phone,
      username: createUserRequest.username,
      password: createUserRequest.password
    })

    // 直接组装用户数据
    const userResponse: User = {
      phone: user.phone,
      username: user.username || '',
      status: user.status,
      statusDesc: getUserStatusDesc(user.status),
      createdAt: this.formatDateTime(user.createdAt),
      updatedAt: this.formatDateTime(user.updatedAt),
      roleIds: user.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
    }

    return this.success(userResponse, '用户创建成功')
  }

  /**
   * 新增人员（表单方式）
   */
  @Post('users/add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '新增人员',
    description: '通过表单方式新增人员，系统自动生成默认密码'
  })
  @SwaggerApiResponse({
    status: 201,
    description: '人员新增成功'
  })
  @SwaggerApiResponse({
    status: 409,
    description: '手机号已存在'
  })
  async addUser(@Body() createUserFormRequest: CreateUserFormRequest): Promise<ApiResponse<User>> {
    // 基础格式验证
    Validator.phone(createUserFormRequest.phone)
    Validator.username(createUserFormRequest.username)

    // 检查手机号是否已存在
    const existingUser = await this.userService.findOne(createUserFormRequest.phone)
    if (existingUser) {
      this.throwConflictError('该手机号已被注册')
    }

    // 生成默认密码：Aa + 手机号后6位
    const defaultPassword = `Aa${createUserFormRequest.phone.slice(-6)}!`

    // 创建用户
    const user = await this.userService.create({
      phone: createUserFormRequest.phone,
      username: createUserFormRequest.username,
      password: defaultPassword
    })

    // 直接组装用户数据
    const userResponse: User = {
      phone: user.phone,
      username: user.username || '',
      status: user.status,
      statusDesc: getUserStatusDesc(user.status),
      createdAt: this.formatDateTime(user.createdAt),
      updatedAt: this.formatDateTime(user.updatedAt),
      roleIds: user.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
    }

    return this.success(userResponse, '人员新增成功')
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
    // 验证路径参数
    Validator.phone(phone)

    // 验证更新字段（如果提供）
    if (updateUserRequest.username !== undefined) {
      Validator.username(updateUserRequest.username)
    }

    if (updateUserRequest.roleIds && updateUserRequest.roleIds.length > 0) {
      Validator.arrayNotEmpty(updateUserRequest.roleIds, '角色列表')
    }

    // 检查用户是否存在
    const existingUser = await this.userService.findOne(phone)
    this.assertDataExists(existingUser, '用户', phone)

    // 更新用户信息
    const updatedUser = await this.userService.update(phone, {
      username: updateUserRequest.username,
      status: updateUserRequest.status
    })

    // 直接组装用户数据
    const userResponse: User = {
      phone: updatedUser.phone,
      username: updatedUser.username || '',
      status: updatedUser.status,
      statusDesc: getUserStatusDesc(updatedUser.status),
      createdAt: this.formatDateTime(updatedUser.createdAt),
      updatedAt: this.formatDateTime(updatedUser.updatedAt),
      roleIds: updatedUser.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
    }

    return this.success(userResponse, '用户信息更新成功')
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
    // 检查用户是否存在
    const existingUser = await this.userService.findOne(phone)
    this.assertDataExists(existingUser, '用户', phone)

    // 删除用户
    await this.userService.remove(phone)

    return this.success(undefined, '用户删除成功')
  }

  // ========================================
  // 📊 用户状态操作相关接口
  // ========================================

  /**
   * 用户状态操作统一接口
   */
  @Post('users/:phone/status')
  @ApiOperation({
    summary: '用户状态操作',
    description: '统一的用户状态操作接口，支持激活、下线、锁定、解锁操作'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '状态操作成功'
  })
  @SwaggerApiResponse({
    status: 400,
    description: '无效的操作类型'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '用户不存在'
  })
  async updateUserStatus(@Param('phone') phone: string, @Body() request: UserStatusActionRequest): Promise<ApiResponse<User>> {
    // 验证手机号格式
    Validator.phone(phone)

    // 验证操作类型
    const validActions = ['activate', 'deactivate', 'lock', 'unlock'] as const
    if (!validActions.includes(request.action)) {
      this.throwValidationError(`无效的操作类型: ${request.action}，支持的操作: ${validActions.join(', ')}`)
    }

    // 检查用户是否存在
    const existingUser = await this.userService.findOne(phone)
    this.assertDataExists(existingUser, '用户', phone)

    // 根据操作类型调用相应的服务方法
    let updatedUser
    let successMessage = ''
    let targetStatus: number

    switch (request.action) {
      case 'activate':
        targetStatus = 2 // 激活状态
        successMessage = '用户激活成功'
        break
      case 'deactivate':
        targetStatus = 3 // 下线状态
        successMessage = '用户下线成功'
        break
      case 'lock':
        targetStatus = 4 // 锁定状态
        successMessage = '用户锁定成功'
        break
      case 'unlock':
        targetStatus = 2 // 解锁实际是激活状态
        successMessage = '用户解锁成功'
        break
      default:
        // TypeScript 会确保这里不会被执行
        this.throwValidationError(`不支持的操作类型: ${request.action}`)
    }

    // 统一调用更新状态方法
    updatedUser = await this.userService.updateUserStatus(phone, targetStatus)

    // 直接组装用户数据
    const userResponse: User = {
      phone: updatedUser.phone,
      username: updatedUser.username || '',
      status: updatedUser.status,
      statusDesc: getUserStatusDesc(updatedUser.status),
      createdAt: this.formatDateTime(updatedUser.createdAt),
      updatedAt: this.formatDateTime(updatedUser.updatedAt),
      roleIds: updatedUser.userRoles?.map((ur) => ur.role?.id).filter(Boolean) || []
    }

    return this.success(userResponse, successMessage)
  }

  // ========================================
  // 📊 用户统计相关接口
  // ========================================
}
