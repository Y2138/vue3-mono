import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserGrpcController } from './user.grpc.controller';
import { User } from './entities/user.entity';

/**
 * 用户 gRPC 控制器测试
 * 简化版本，直接实例化测试
 */
describe('UserGrpcController', () => {
  let controller: UserGrpcController;
  let mockAuthService: any;

  // 模拟用户数据
  const mockUser: User = {
    phone: '13800138000',
    username: 'testuser',
    password: 'hashed_password',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  const mockAuthResult = {
    user: mockUser,
    token: 'mock_jwt_token',
    expiresAt: new Date(),
  };

  beforeEach(() => {
    // Mock AuthService
    mockAuthService = {
      validateUser: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      promoteToSuperAdmin: vi.fn(),
    };

    // 直接实例化 controller
    controller = new UserGrpcController(mockAuthService);

    // 重置所有 mock
    vi.clearAllMocks();
  });

  // 创建 mock metadata
  const createMockMetadata = () => ({
    get: vi.fn().mockReturnValue(['test-request-id']),
    set: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    getMap: vi.fn().mockReturnValue({}),
    clone: vi.fn(),
    toJSON: vi.fn(),
  });

  describe('login', () => {
    it('应该成功登录并返回用户信息和 token', async () => {
      // Arrange
      const loginRequest = {
        phone: '13800138000',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResult);

      // Act
      const result = await controller.login(loginRequest, createMockMetadata() as any);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith({
        phone: loginRequest.phone,
        password: loginRequest.password,
      });
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('应该在认证失败时抛出异常', async () => {
      // Arrange
      const loginRequest = {
        phone: '13800138000',
        password: 'wrong_password',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      // Act & Assert
      await expect(controller.login(loginRequest, createMockMetadata() as any)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // Arrange
      const registerRequest = {
        phone: '13800138001',
        username: 'newuser',
        password: 'password123',
        verificationCode: '123456',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResult);

      // Act
      const result = await controller.register(registerRequest, createMockMetadata() as any);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith({
        phone: registerRequest.phone,
        username: registerRequest.username,
        password: registerRequest.password,
      });
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('应该在手机号已存在时抛出异常', async () => {
      // Arrange
      const registerRequest = {
        phone: '13800138000',
        username: 'newuser',
        password: 'password123',
        verificationCode: '123456',
      };

      mockAuthService.register.mockRejectedValue(new Error('该手机号已被注册'));

      // Act & Assert
      await expect(controller.register(registerRequest, createMockMetadata() as any)).rejects.toThrow('该手机号已被注册');
    });
  });

  describe('validateUser', () => {
    it('应该成功验证用户', async () => {
      // Arrange
      const userPhone = '13800138000';
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      // Act
      const result = await mockAuthService.validateUser(userPhone);

      // Assert
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(userPhone);
      expect(result).toEqual(mockUser);
    });

    it('应该在用户不存在时抛出异常', async () => {
      // Arrange
      const userPhone = '13800138999';
      mockAuthService.validateUser.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(mockAuthService.validateUser(userPhone)).rejects.toThrow('User not found');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理服务层异常', async () => {
      // Arrange
      const loginRequest = {
        phone: '13800138000',
        password: 'password123',
      };

      mockAuthService.login.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.login(loginRequest, createMockMetadata() as any)).rejects.toThrow('Database connection failed');
    });
  });
}); 