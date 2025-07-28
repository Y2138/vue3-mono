import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionGrpcController } from './permission.grpc.controller';
import { Permission } from './entities/permission.entity';

/**
 * 权限 gRPC 控制器测试
 * 简化版本，测试核心功能
 */
describe('PermissionGrpcController', () => {
  let controller: PermissionGrpcController;
  let mockPermissionService: any;

  // 模拟权限数据
  const mockPermission: Permission = {
    id: 'permission-uuid-1',
    name: 'user:read',
    description: '查看用户信息',
    resource: 'user',
    action: 'read',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  beforeEach(() => {
    // Mock PermissionService
    mockPermissionService = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    // 直接实例化 controller
    controller = new PermissionGrpcController(mockPermissionService);

    // 重置所有 mock
    vi.clearAllMocks();
  });

  describe('getPermissions', () => {
    it('应该成功获取权限列表', async () => {
      // Arrange
      const request = {
        pagination: { page: 1, pageSize: 10 }
      };

      mockPermissionService.findAll.mockResolvedValue([mockPermission]);

      // Act
      const result = await controller.getPermissions(request);

      // Assert
      expect(mockPermissionService.findAll).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.permissions).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getPermission', () => {
    it('应该成功获取单个权限', async () => {
      // Arrange
      const request = {
        id: 'permission-uuid-1'
      };

      mockPermissionService.findById.mockResolvedValue(mockPermission);

      // Act
      const result = await controller.getPermission(request);

      // Assert
      expect(mockPermissionService.findById).toHaveBeenCalledWith('permission-uuid-1');
      expect(result).toBeDefined();
    });

    it('应该在权限不存在时抛出异常', async () => {
      // Arrange
      const request = {
        id: 'non-existent-id'
      };

      mockPermissionService.findById.mockRejectedValue(new Error('权限不存在'));

      // Act & Assert
      await expect(controller.getPermission(request)).rejects.toThrow('权限不存在');
    });
  });

  describe('createPermission', () => {
    it('应该成功创建权限', async () => {
      // Arrange
      const request = {
        name: 'user:create',
        description: '创建用户',
        resource: 'user',
        action: 'create',
      };

      const newPermission = { ...mockPermission, ...request };
      mockPermissionService.create.mockResolvedValue(newPermission);

      // Act
      const result = await controller.createPermission(request);

      // Assert
      expect(mockPermissionService.create).toHaveBeenCalledWith(request);
      expect(result).toBeDefined();
    });
  });

  describe('updatePermission', () => {
    it('应该成功更新权限', async () => {
      // Arrange
      const request = {
        id: 'permission-uuid-1',
        description: '更新后的描述',
      };

      const updatedPermission = { ...mockPermission, description: '更新后的描述' };
      mockPermissionService.update.mockResolvedValue(updatedPermission);

      // Act
      const result = await controller.updatePermission(request);

      // Assert
      expect(mockPermissionService.update).toHaveBeenCalledWith(request.id, {
        description: request.description,
      });
      expect(result).toBeDefined();
    });
  });

  describe('deletePermission', () => {
    it('应该成功删除权限', async () => {
      // Arrange
      const request = {
        id: 'permission-uuid-1'
      };

      mockPermissionService.delete.mockResolvedValue(undefined);

      // Act
      const result = await controller.deletePermission(request);

      // Assert
      expect(mockPermissionService.delete).toHaveBeenCalledWith(request.id);
      expect(result).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该正确处理服务层异常', async () => {
      // Arrange
      const request = {
        pagination: { page: 1, pageSize: 10 }
      };

      mockPermissionService.findAll.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.getPermissions(request)).rejects.toThrow('Database connection failed');
    });
  });
}); 