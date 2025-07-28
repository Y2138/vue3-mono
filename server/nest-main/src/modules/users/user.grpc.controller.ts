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
import { AuthService } from './auth.service';

/**
 * 用户服务 gRPC Controller
 * 实现用户认证、管理等功能的 gRPC 接口
 */
@Controller()
export class UserGrpcController extends BaseGrpcService {
  constructor(private readonly authService: AuthService) {
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
      const result = await this.authService.login({
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
      const result = await this.authService.register({
        phone: request.phone,
        username: request.username,
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
   * 获取当前用户信息
   */
  @GrpcMethod('UserService', 'GetProfile')
  async getProfile(request: GetUserRequest, metadata: Metadata): Promise<UserProto> {
    return this.executeGrpcMethod('GetProfile', metadata, async () => {
      // 从元数据中提取认证用户信息
      const authUser = this.extractAuthUser(metadata);
      
      // 验证用户身份
      const user = await this.authService.validateUser(authUser.userPhone);
      
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
      await this.authService.validateUser(authUser.userPhone);

      // 获取目标用户
      const user = await this.authService.validateUser(request.phone);
      
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
      await this.authService.validateUser(authUser.userPhone);

      // TODO: 需要在 AuthService 中实现 getUserList 方法
      // 这里临时返回空列表
      this.logger.warn('GetUsers method not fully implemented - getUserList method needed in AuthService');
      
      return {
        users: [],
        pagination: {
          page: request.pagination?.page || 1,
          pageSize: request.pagination?.pageSize || 10,
          total: 0,
          totalPages: 0,
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
      await this.authService.validateUser(authUser.userPhone);

      // TODO: 需要在 AuthService 中实现 createUser 方法
      this.logger.warn('CreateUser method not fully implemented - createUser method needed in AuthService');
      
      // 临时使用 register 方法
      const result = await this.authService.register({
        phone: request.phone,
        username: request.username,
        password: request.password,
      });

      return UserTransformer.toProtobuf(result.user);
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
      await this.authService.validateUser(authUser.userPhone);

      // TODO: 需要在 AuthService 中实现 updateUser 方法
      this.logger.warn('UpdateUser method not fully implemented - updateUser method needed in AuthService');
      
      // 临时返回当前用户信息
      const user = await this.authService.validateUser(request.phone);
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
      await this.authService.validateUser(authUser.userPhone);

      // TODO: 需要在 AuthService 中实现 deleteUser 方法
      this.logger.warn('DeleteUser method not fully implemented - deleteUser method needed in AuthService');
      
      return {
        success: true,
        message: 'User deletion not implemented yet',
        code: 0,
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

      // 验证管理员密钥
      const expectedAdminKey = process.env.ADMIN_KEY || 'super-admin-key';
      if (request.adminKey !== expectedAdminKey) {
        throw new Error('Invalid admin key');
      }

      // 调用业务服务
      const result = await this.authService.createSuperAdmin({
        phone: request.phone,
        username: request.username,
        password: request.password,
      });

      // 转换响应数据
      return UserTransformer.createAuthResponse(
        result.user,
        result.token
      );
    });
  }
} 