import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { 
  LoginRequest, 
  AuthResponse, 
  GetUserRequest, 
  RegisterRequest,
  GetUsersRequest,
  GetUsersResponse,
  CreateUserRequest,
  UpdateUserRequest,
  CreateSuperAdminRequest,
  User as UserProto
} from '../../shared/users';
import { ResponseStatus } from '../../shared/common';
import { BaseGrpcService } from '../../common/grpc/base-grpc.service';
import { UserTransformer } from '../../common/transformers/user.transformer';
import { UserService } from './user.service';

/**
 * 用户服务 gRPC Controller
 * 实现用户认证、管理等功能的 gRPC 接口
 */
@Controller()
export class UserGrpcController extends BaseGrpcService {
  constructor(private readonly userService: UserService) {
    super('UserGrpcController');
  }

  /**
   * 用户登录
   */
  @GrpcMethod('UserService', 'Login')
  async login(request: LoginRequest, metadata: Metadata): Promise<AuthResponse> {
    return this.executeGrpcMethod('Login', metadata, async () => {
      // 验证请求参数
      this.validateRequired(request.phone, 'phone');
      this.validateRequired(request.password, 'password');
      this.validatePhone(request.phone);

      // 调用业务服务
      const result = await this.userService.login({
        phone: request.phone,
        password: request.password,
      });

      // 转换响应数据
      return UserTransformer.createAuthResponse(
        result.user,
        result.token
      );
    });
  }

  /**
   * 用户注册
   */
  @GrpcMethod('UserService', 'Register')
  async register(request: RegisterRequest, metadata: Metadata): Promise<AuthResponse> {
    return this.executeGrpcMethod('Register', metadata, async () => {
      // 验证请求参数
      this.validateRequired(request.phone, 'phone');
      this.validateRequired(request.username, 'username');
      this.validateRequired(request.password, 'password');
      this.validatePhone(request.phone);

      // 调用业务服务
      const result = await this.userService.register({
        phone: request.phone,
        username: request.username,
        password: request.password,
        verificationCode: request.verificationCode,
      });

      // 转换响应数据
      return UserTransformer.createAuthResponse(
        result.user,
        result.token
      );
    });
  }

  /**
   * 获取当前用户信息
   */
  @GrpcMethod('UserService', 'GetProfile')
  async getProfile(request: GetUserRequest, metadata: Metadata): Promise<UserProto> {
    return this.executeGrpcMethod('GetProfile', metadata, async () => {
      // 从元数据中提取认证用户信息
      const authUser = this.extractAuthUser(metadata);
      
      // 获取用户信息
      const user = await this.userService.getUserWithRoles(authUser.userPhone);
      
      // 转换响应数据
      return UserTransformer.toProtobuf(user);
    });
  }

  /**
   * 获取指定用户信息
   */
  @GrpcMethod('UserService', 'GetUser')
  async getUser(request: GetUserRequest, metadata: Metadata): Promise<UserProto> {
    return this.executeGrpcMethod('GetUser', metadata, async () => {
      // 验证请求参数
      this.validateRequired(request.phone, 'phone');
      this.validatePhone(request.phone);

      // 验证调用者权限
      const authUser = this.extractAuthUser(metadata);
      await this.userService.getUserWithRoles(authUser.userPhone);

      // 获取目标用户
      const user = await this.userService.getUserWithRoles(request.phone);
      
      // 转换响应数据
      return UserTransformer.toProtobuf(user);
    });
  }

  /**
   * 获取用户列表
   */
  @GrpcMethod('UserService', 'GetUsers')
  async getUsers(request: GetUsersRequest, metadata: Metadata): Promise<GetUsersResponse> {
    return this.executeGrpcMethod('GetUsers', metadata, async () => {
      // 验证调用者权限
      const authUser = this.extractAuthUser(metadata);
      await this.userService.getUserWithRoles(authUser.userPhone);

      // 获取用户列表
      const result = await this.userService.findAll({
        page: request.pagination?.page,
        pageSize: request.pagination?.pageSize,
        search: request.search,
        isActive: request.isActive
      });
      
      // 转换响应数据
      return {
        users: UserTransformer.toProtobufList(result.data),
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        },
      };
    });
  }

  /**
   * 创建用户
   */
  @GrpcMethod('UserService', 'CreateUser')
  async createUser(request: CreateUserRequest, metadata: Metadata): Promise<UserProto> {
    return this.executeGrpcMethod('CreateUser', metadata, async () => {
      // 验证请求参数
      this.validateRequired(request.phone, 'phone');
      this.validateRequired(request.username, 'username');
      this.validateRequired(request.password, 'password');
      this.validatePhone(request.phone);

      // 验证调用者权限
      const authUser = this.extractAuthUser(metadata);
      await this.userService.getUserWithRoles(authUser.userPhone);

      // 创建用户
      const userData = {
        phone: request.phone,
        username: request.username,
        password: request.password,
        isActive: true,
      };
      
      // 如果有角色ID，添加角色关联
      if (request.roleIds && request.roleIds.length > 0) {
        userData['userRoles'] = {
          create: request.roleIds.map(roleId => ({
            role: { connect: { id: roleId } }
          }))
        };
      }
      
      const user = await this.userService.create(userData);
      return UserTransformer.toProtobuf(user);
    });
  }

  /**
   * 更新用户
   */
  @GrpcMethod('UserService', 'UpdateUser')
  async updateUser(request: UpdateUserRequest, metadata: Metadata): Promise<UserProto> {
    return this.executeGrpcMethod('UpdateUser', metadata, async () => {
      // 验证请求参数
      this.validateRequired(request.phone, 'phone');
      this.validatePhone(request.phone);

      // 验证调用者权限
      const authUser = this.extractAuthUser(metadata);
      await this.userService.getUserWithRoles(authUser.userPhone);

      // 准备更新数据
      const updateData: any = {};
      
      if (request.username !== undefined) {
        updateData.username = request.username;
      }
      
      if (request.isActive !== undefined) {
        updateData.isActive = request.isActive;
      }
      
      // 如果有角色ID，更新角色关联
      if (request.roleIds && request.roleIds.length > 0) {
        // 先删除现有角色关联，然后创建新的
        updateData.userRoles = {
          deleteMany: {},
          create: request.roleIds.map(roleId => ({
            role: { connect: { id: roleId } }
          }))
        };
      }
      
      // 更新用户
      const user = await this.userService.update(request.phone, updateData);
      return UserTransformer.toProtobuf(user);
    });
  }

  /**
   * 删除用户
   */
  @GrpcMethod('UserService', 'DeleteUser')
  async deleteUser(request: GetUserRequest, metadata: Metadata): Promise<ResponseStatus> {
    return this.executeGrpcMethod('DeleteUser', metadata, async () => {
      // 验证请求参数
      this.validateRequired(request.phone, 'phone');
      this.validatePhone(request.phone);

      // 验证调用者权限
      const authUser = this.extractAuthUser(metadata);
      await this.userService.getUserWithRoles(authUser.userPhone);

      // 删除用户
      await this.userService.remove(request.phone);
      
      return {
        success: true,
        message: '用户删除成功',
        code: 200,
      };
    });
  }

  /**
   * 创建超级管理员
   */
  @GrpcMethod('UserService', 'CreateSuperAdmin')
  async createSuperAdmin(request: CreateSuperAdminRequest, metadata: Metadata): Promise<AuthResponse> {
    return this.executeGrpcMethod('CreateSuperAdmin', metadata, async () => {
      // 验证请求参数
      this.validateRequired(request.phone, 'phone');
      this.validateRequired(request.username, 'username');
      this.validateRequired(request.password, 'password');
      this.validateRequired(request.adminKey, 'adminKey');
      this.validatePhone(request.phone);

      // 调用业务服务
      const result = await this.userService.createSuperAdmin({
        phone: request.phone,
        username: request.username,
        password: request.password,
        adminKey: request.adminKey
      });

      // 转换响应数据
      return UserTransformer.createAuthResponse(
        result.user,
        result.token
      );
    });
  }
} 