import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UnauthorizedException, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger'
import { BaseController } from '../../common/controllers/base.controller'
import { Public } from '../../common/decorators/public.decorator'
import { ApiResponse } from '../../common/response/types'
import { UserService as UserServiceImpl } from './user.service'
import { User, AuthResponse, GetUsersRequest, GetUsersResponse, LoginRequest, CreateUserFormRequest, UpdateUserRequest, ProfileResponse } from '../../shared/users'
import { Validator } from '../../common/validators'
import { USER_ENUMS, getUserStatusDesc } from './enums/user.enums'
import { isNotEmpty } from '../../utils'

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
  constructor(private readonly userService: UserServiceImpl) {
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

    // 获取用户基本信息
    const user = await this.userService.findOne(loginRequest.phone)

    // 直接组装响应数据
    const authResponse: AuthResponse = {
      user: {
        phone: user!.phone,
        username: user!.username || ''
      },
      token: result.token,
      expiresAt: this.formatDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    }

    return this.success(authResponse, '登录成功')
  }

  /**
   * 获取当前用户信息
   */
  @Get('auth/profile')
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取当前登录用户的详细信息及权限树'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取用户信息及权限树'
  })
  async getCurrentUser(@Request() request): Promise<ApiResponse<ProfileResponse>> {
    // 从请求中获取当前用户信息
    const currentUser = request.user
    this.assertDataExists(currentUser, '用户', currentUser.phone)

    // 获取用户权限树（使用 menuTree，仅包含 MENU 类型资源）
    const { menuTree, list } = await this.userService.getUserResources(currentUser.phone)

    // 组装响应数据
    const profileResponse: ProfileResponse = {
      user: {
        phone: currentUser.phone,
        username: currentUser.username || ''
      },
      permissions: {
        menuTree: menuTree,
        resources: list
      }
    }

    return this.success(profileResponse, '获取用户信息成功')
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
  async getUsers(@Query() getUsersRequest: GetUsersRequest): Promise<ApiResponse<GetUsersResponse>> {
    // 验证分页参数
    const { page = 1, pageSize = 20 } = getUsersRequest.pagination || {}
    Validator.numberRange(page, 1, 1000, '页码')
    Validator.numberRange(pageSize, 1, 100, '每页数量')

    // 构建查询参数
    const queryParams: any = {
      pagination: getUsersRequest.pagination
    }

    if (getUsersRequest.phone) queryParams.phone = getUsersRequest.phone
    if (getUsersRequest.username) queryParams.username = getUsersRequest.username
    if (getUsersRequest.roleIds) queryParams.roleIds = getUsersRequest.roleIds
    if (getUsersRequest.statusList) queryParams.statusList = getUsersRequest.statusList

    const result = await this.userService.findAll(queryParams)

    // 直接组装响应数据
    // 计算总页数
    const totalPages = Math.ceil(result.total / pageSize)

    const usersResponse: GetUsersResponse = {
      list: result.data.map((user) => ({
        phone: user.phone,
        username: user.username || '',
        status: user.status,
        statusDesc: getUserStatusDesc(user.status),
        createdAt: this.formatDateTime(user.createdAt),
        updatedAt: this.formatDateTime(user.updatedAt),
        roleIds: user.user_roles?.map((ur: any) => ur.roleId) || [],
        roleNames: user.user_roles?.map((ur: any) => ur.role?.name).filter((n: string | undefined) => !!n) || []
      })),
      pagination: {
        page,
        pageSize,
        total: result.total.toString(),
        totalPages
      }
    }

    return this.success(usersResponse, '获取用户列表成功')
  }

  /**
   * 检查手机号是否存在
   */
  @Get('users/check-phone')
  @ApiOperation({
    summary: '检查手机号是否存在',
    description: '检查指定手机号是否已被注册'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '检查完成'
  })
  async checkPhoneExists(@Query('phone') phone: string): Promise<ApiResponse<{ exists: boolean }>> {
    Validator.phone(phone)
    const user = await this.userService.findOne(phone)
    return this.success({ exists: !!user }, '检查完成')
  }

  /**
   * 检查用户名是否存在
   */
  @Get('users/check-username')
  @ApiOperation({
    summary: '检查用户名是否存在',
    description: '检查指定用户名是否已被使用'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '检查完成'
  })
  async checkUsernameExists(@Query('username') username: string): Promise<ApiResponse<{ exists: boolean }>> {
    Validator.username(username)
    const user = await this.userService.findByUsername(username)
    return this.success({ exists: !!user }, '检查完成')
  }

  /**
   * 根据手机号获取用户详情
   */
  @Get('users/detail')
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
  async getUserByPhone(@Query('phone') phone: string): Promise<ApiResponse<User>> {
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
      roleIds: user.user_roles?.map((ur: any) => ur.roleId) || [],
      roleNames: user.user_roles?.map((ur: any) => ur.role?.name).filter((n: string | undefined) => !!n) || []
    }

    return this.success(userResponse, '获取用户详情成功')
  }

  /**
   * 新增人员（表单方式）
   */
  @Post('users/create')
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

    // 直接组装用户数据（新增人员时不分配角色）
    const userResponse: User = {
      phone: user.phone,
      username: user.username || '',
      status: user.status,
      statusDesc: getUserStatusDesc(user.status),
      createdAt: this.formatDateTime(user.createdAt),
      updatedAt: this.formatDateTime(user.updatedAt),
      roleIds: [],
      roleNames: []
    }

    return this.success(userResponse, '人员新增成功')
  }

  /**
   * 更新用户信息
   */
  @Post('users/update')
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
  async updateUser(@Body() updateUserRequest: UpdateUserRequest & { phone: string }): Promise<ApiResponse<User>> {
    // 验证手机号
    Validator.phone(updateUserRequest.phone)
    const phone = updateUserRequest.phone

    // 验证更新字段（如果提供）
    if (isNotEmpty(updateUserRequest.username)) {
      Validator.username(updateUserRequest.username)
    }

    if (updateUserRequest.roleIds && updateUserRequest.roleIds.length > 0) {
      Validator.arrayNotEmpty(updateUserRequest.roleIds, '角色列表')
    }

    // 检查用户是否存在
    const existingUser = await this.userService.findOne(phone)
    this.assertDataExists(existingUser, '用户', phone)

    // 更新用户信息（不允许更新状态字段）
    await this.userService.update(phone, {
      username: updateUserRequest.username || ''
    })

    // 如果提供了角色ID列表，更新用户角色
    if (updateUserRequest.roleIds !== undefined) {
      await this.userService.assignUserRoles(phone, updateUserRequest.roleIds)
    }

    // 重新查询用户以获取最新信息（包括角色）
    const userWithRoles = await this.userService.findOne(phone)

    // 直接组装用户数据
    const userResponse: User = {
      phone: userWithRoles!.phone,
      username: userWithRoles!.username || '',
      status: userWithRoles!.status,
      statusDesc: getUserStatusDesc(userWithRoles!.status),
      createdAt: this.formatDateTime(userWithRoles!.createdAt),
      updatedAt: this.formatDateTime(userWithRoles!.updatedAt),
      roleIds: userWithRoles!.user_roles?.map((ur: any) => ur.roleId) || [],
      roleNames: userWithRoles!.user_roles?.map((ur: any) => ur.role?.name).filter((n: string | undefined) => !!n) || []
    }

    return this.success(userResponse, '用户信息更新成功')
  }

  /**
   * 删除用户
   */
  @Post('users/delete')
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
  async deleteUser(@Body() body: { phone: string }): Promise<ApiResponse<void>> {
    // 验证手机号格式
    Validator.phone(body.phone)

    // 检查用户是否存在
    const existingUser = await this.userService.findOne(body.phone)
    this.assertDataExists(existingUser, '用户', body.phone)

    // 删除用户
    await this.userService.remove(body.phone)

    return this.success(undefined, '用户删除成功')
  }

  // ========================================
  // 📊 用户状态操作相关接口
  // ========================================

  /**
   * 用户状态操作统一接口
   */
  @Post('users/update-status')
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
  async updateUserStatus(@Body() request: UserStatusActionRequest & { phone: string }): Promise<ApiResponse<User>> {
    // 验证手机号格式
    Validator.phone(request.phone)
    const phone = request.phone

    // 验证操作类型
    const validActions = ['activate', 'deactivate', 'lock', 'unlock'] as const
    if (!validActions.includes(request.action)) {
      this.throwValidationError(`无效的操作类型: ${request.action}，支持的操作: ${validActions.join(', ')}`)
    }

    // 检查用户是否存在
    const existingUser = await this.userService.findOne(phone)
    this.assertDataExists(existingUser, '用户', phone)

    // 根据操作类型调用相应的服务方法
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
    await this.userService.updateUserStatus(phone, targetStatus)

    // 重新查询用户以获取角色信息
    const userWithRoles = await this.userService.findOne(phone)

    // 直接组装用户数据
    const userResponse: User = {
      phone: userWithRoles!.phone,
      username: userWithRoles!.username || '',
      status: userWithRoles!.status,
      statusDesc: getUserStatusDesc(userWithRoles!.status),
      createdAt: this.formatDateTime(userWithRoles!.createdAt),
      updatedAt: this.formatDateTime(userWithRoles!.updatedAt),
      roleIds: userWithRoles!.user_roles?.map((ur: any) => ur.roleId) || [],
      roleNames: userWithRoles!.user_roles?.map((ur: any) => ur.role?.name).filter((n: string | undefined) => !!n) || []
    }

    return this.success(userResponse, successMessage)
  }

  // ========================================
  // 👤 用户角色管理相关接口
  // ========================================

  /**
   * 分配用户角色
   */
  @Post('users/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '分配用户角色',
    description: '覆盖式分配用户角色，使用事务保证一致性'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '角色分配成功'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '用户不存在'
  })
  async assignUserRoles(@Body() body: { phone: string; roleIds: string[] }): Promise<ApiResponse<{ success: boolean; assignedCount: number }>> {
    // 验证手机号格式
    Validator.phone(body.phone)

    // 验证角色ID列表
    if (!Array.isArray(body.roleIds)) {
      this.throwValidationError('角色ID列表必须为数组')
    }

    const result = await this.userService.assignUserRoles(body.phone, body.roleIds)

    return this.success(result, '角色分配成功')
  }

  /**
   * 获取用户资源树
   */
  @Get('users/resources')
  @ApiOperation({
    summary: '获取用户资源树',
    description: '聚合用户所有角色的资源，返回资源树和平铺列表'
  })
  @SwaggerApiResponse({
    status: 200,
    description: '成功获取用户资源树'
  })
  @SwaggerApiResponse({
    status: 404,
    description: '用户不存在'
  })
  async getUserResources(@Query('phone') phone: string): Promise<ApiResponse<{ tree: any[]; list: any[] }>> {
    // 验证手机号格式
    Validator.phone(phone)

    const resources = await this.userService.getUserResources(phone)

    return this.success(resources, '获取用户资源树成功')
  }

  // ========================================
  // 📊 用户统计相关接口
  // ========================================
}
