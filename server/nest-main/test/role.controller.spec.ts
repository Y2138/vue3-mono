import { Test, TestingModule } from '@nestjs/testing'
import { RoleController } from '../src/modules/role/role.controller'
import { RoleService } from '../src/modules/role/services/role.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { CreateRoleRequest, UpdateRoleRequest, GetRolesRequest, GetRoleUsersRequest } from '../src/shared/role'
import { ApiResponse } from '../src/common/response/types'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('RoleController', () => {
  let controller: RoleController
  let service: RoleService

  beforeEach(() => {
    // 创建模拟的 PrismaService
    const mockPrismaService = {
      client: {
        role: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          count: vi.fn()
        }
      },
      $transaction: vi.fn()
    }

    // 创建模拟的 RoleService
    service = new RoleService(mockPrismaService as any)

    // 模拟所有需要的方法
    service.findAll = vi.fn().mockResolvedValue({ data: [], total: 0 })
    service.findOne = vi.fn().mockResolvedValue({})
    service.create = vi.fn().mockResolvedValue({})
    service.update = vi.fn().mockResolvedValue({})
    service.remove = vi.fn().mockResolvedValue({})
    service.getRoleUsers = vi.fn().mockResolvedValue({})
    service.assignUsersToRole = vi.fn().mockResolvedValue({})
    service.removeUsersFromRole = vi.fn().mockResolvedValue({})
    service.getRoleResources = vi.fn().mockResolvedValue({})

    // 创建控制器实例
    controller = new RoleController(service)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getRoles', () => {
    it('should return paginated roles list', async () => {
      // Arrange
      const mockData = {
        data: [
          {
            id: '1',
            name: 'Admin',
            description: 'Administrator',
            is_active: true,
            is_super_admin: false,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
          }
        ],
        total: 1
      }

      service.findAll.mockResolvedValue(mockData)
      const request: GetRolesRequest = {
        search: undefined,
        isActive: undefined,
        isSuperAdmin: undefined,
        pagination: undefined
      }

      // Act
      const result = await controller.getRoles(request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.message).toBe('success')
      expect(result.data.roles).toEqual(mockData.data)
      expect(result.data.pagination.page).toBe(1)
      expect(result.data.pagination.pageSize).toBe(10)
      expect(result.data.pagination.total).toBe('1')
      expect(result.data.pagination.totalPages).toBe(1)
      expect(service.findAll).toHaveBeenCalledWith({
        search: undefined,
        is_active: undefined,
        is_super_admin: undefined,
        pagination: undefined
      })
    })

    it('should handle search and filtering parameters', async () => {
      // Arrange
      const mockData = {
        data: [],
        total: 0
      }
      service.findAll.mockResolvedValue(mockData)

      const request: GetRolesRequest = {
        search: 'admin',
        isActive: true,
        isSuperAdmin: false,
        pagination: { page: 1, pageSize: 20 }
      }

      // Act
      await controller.getRoles(request)

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({
        search: 'admin',
        is_active: true,
        is_super_admin: false,
        pagination: { page: 1, pageSize: 20 }
      })
    })
  })

  describe('getRole', () => {
    it('should return role by id', async () => {
      // Arrange
      const mockRole = {
        id: '1',
        name: 'Admin',
        description: 'Administrator',
        is_active: true,
        is_super_admin: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
      service.findOne.mockResolvedValue(mockRole)

      // Act
      const result = await controller.getRole('1')

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.message).toBe('success')
      expect(result.data.id).toBe(mockRole.id)
      expect(result.data.name).toBe(mockRole.name)
      expect(result.data.createdAt).toBe('2023-01-01T00:00:00.000Z')
      expect(result.data.updatedAt).toBe('2023-01-01T00:00:00.000Z')
      expect(service.findOne).toHaveBeenCalledWith('1')
    })

    it('should handle Date conversion for createdAt and updatedAt', async () => {
      // Arrange
      const mockRole = {
        id: '1',
        name: 'Admin',
        description: 'Administrator',
        is_active: true,
        is_super_admin: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-12-31')
      }
      service.findOne.mockResolvedValue(mockRole)

      // Act
      const result = await controller.getRole('1')

      // Assert
      expect(result.data.createdAt).toBe('2023-01-01T00:00:00.000Z')
      expect(result.data.updatedAt).toBe('2023-12-31T00:00:00.000Z')
    })
  })

  describe('createRole', () => {
    it('should create new role successfully', async () => {
      // Arrange
      const request: CreateRoleRequest = {
        name: 'New Role',
        description: 'New Role Description',
        isActive: true,
        isSuperAdmin: false
      }

      const mockRole = {
        id: '2',
        ...request,
        is_active: true,
        is_super_admin: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
      service.create.mockResolvedValue(mockRole)

      // Act
      const result = await controller.createRole(request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.message).toBe('success')
      expect(result.data.id).toBe(mockRole.id)
      expect(result.data.name).toBe(mockRole.name)
      expect(result.data.isActive).toBe(true)
      expect(result.data.isSuperAdmin).toBe(false)
      expect(service.create).toHaveBeenCalledWith({
        name: 'New Role',
        description: 'New Role Description',
        is_active: true,
        is_super_admin: false
      })
    })

    it('should use default values when isActive and isSuperAdmin are not provided', async () => {
      // Arrange
      const request: CreateRoleRequest = {
        name: 'New Role',
        description: 'New Role Description'
      }

      const mockRole = {
        id: '3',
        name: 'New Role',
        description: 'New Role Description',
        is_active: true,
        is_super_admin: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
      service.create.mockResolvedValue(mockRole)

      // Act
      const result = await controller.createRole(request)

      // Assert
      expect(service.create).toHaveBeenCalledWith({
        name: 'New Role',
        description: 'New Role Description',
        is_active: true,
        is_super_admin: false
      })
    })
  })

  describe('updateRole', () => {
    it('should update role successfully with partial data', async () => {
      // Arrange
      const id = '1'
      const request: UpdateRoleRequest = {
        id,
        name: 'Updated Role'
      }

      const mockRole = {
        id,
        name: 'Updated Role',
        description: 'Old Description',
        is_active: true,
        is_super_admin: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
      service.update.mockResolvedValue(mockRole)

      // Act
      const result = await controller.updateRole(id, request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Role')
      expect(service.update).toHaveBeenCalledWith(id, {
        name: 'Updated Role'
      })
    })

    it('should handle all optional fields in update request', async () => {
      // Arrange
      const id = '1'
      const request: UpdateRoleRequest = {
        id,
        name: 'Updated Role',
        description: 'Updated Description',
        isActive: false,
        isSuperAdmin: true
      }

      service.update.mockResolvedValue({})

      // Act
      await controller.updateRole(id, request)

      // Assert
      expect(service.update).toHaveBeenCalledWith(id, {
        name: 'Updated Role',
        description: 'Updated Description',
        is_active: false,
        is_super_admin: true
      })
    })
  })

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      // Arrange
      const id = '1'
      service.remove.mockResolvedValue({})

      // Act
      const result = await controller.deleteRole(id)

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.data.success).toBe(true)
      expect(service.remove).toHaveBeenCalledWith(id)
    })
  })

  describe('getRoleUsers', () => {
    it('should return role users with pagination', async () => {
      // Arrange
      const roleId = '1'
      const pagination = { page: 1, pageSize: 10 }
      const request: GetRoleUsersRequest = { roleId, pagination }

      const mockResult = {
        role: {
          id: '1',
          name: 'Admin',
          is_active: true,
          is_super_admin: false
        },
        users: [{ phone: 'user1@example.com' }, { phone: 'user2@example.com' }],
        total: 2
      }
      service.getRoleUsers.mockResolvedValue(mockResult)

      // Act
      const result = await controller.getRoleUsers(roleId, request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.data.role).toEqual(mockResult.role)
      expect(result.data.userIds).toEqual(['user1@example.com', 'user2@example.com'])
      expect(result.data.pagination.page).toBe(1)
      expect(result.data.pagination.pageSize).toBe(10)
      expect(result.data.pagination.total).toBe('2')
      expect(result.data.pagination.totalPages).toBe(1)
      expect(service.getRoleUsers).toHaveBeenCalledWith(roleId, pagination)
    })
  })

  describe('assignUsersToRole', () => {
    it('should assign users to role successfully', async () => {
      // Arrange
      const roleId = '1'
      const userIds = ['user1@example.com', 'user2@example.com']
      const request = { userIds }

      const mockResult = { success: true, assignedCount: 2 }
      service.assignUsersToRole.mockResolvedValue(mockResult)

      // Act
      const result = await controller.assignUsersToRole(roleId, request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.data.success).toBe(true)
      expect(result.data.assignedCount).toBe(2)
      expect(service.assignUsersToRole).toHaveBeenCalledWith(roleId, userIds)
    })
  })

  describe('removeUsersFromRole', () => {
    it('should remove users from role successfully', async () => {
      // Arrange
      const roleId = '1'
      const userIds = ['user1@example.com', 'user2@example.com']
      const request = { userIds }

      const mockResult = { success: true, removedCount: 2 }
      service.removeUsersFromRole.mockResolvedValue(mockResult)

      // Act
      const result = await controller.removeUsersFromRole(roleId, request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.data.success).toBe(true)
      expect(result.data.removedCount).toBe(2)
      expect(service.removeUsersFromRole).toHaveBeenCalledWith(roleId, userIds)
    })
  })

  describe('getRolePermissions', () => {
    it('should return role permissions tree', async () => {
      // Arrange
      const roleId = '1'

      const mockResult = {
        role: {
          id: '1',
          name: 'Admin',
          is_active: true,
          is_super_admin: false
        },
        permissionTree: [
          {
            resource: { id: '1', name: 'User Management' },
            isAssigned: true,
            isIndeterminate: false,
            children: []
          }
        ],
        permissions: [{ id: '1', name: 'User Management', description: 'User management permission' }]
      }
      service.getRoleResources.mockResolvedValue(mockResult)

      // Act
      const result = await controller.getRolePermissions(roleId)

      // Assert
      expect(result).toEqual({
        success: true,
        code: 200,
        message: 'success',
        data: mockResult
      })
      expect(service.getRoleResources).toHaveBeenCalledWith(roleId)
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed')
      service.findOne.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.getRole('1')).rejects.toThrow('Database connection failed')
    })

    it('should handle empty results', async () => {
      // Arrange
      service.findAll.mockResolvedValue({ data: [], total: 0 })

      // Act
      const result = await controller.getRoles({
        search: undefined,
        isActive: undefined,
        isSuperAdmin: undefined,
        pagination: undefined
      })

      // Assert
      expect(result.data.roles).toEqual([])
      expect(result.data.pagination.total).toBe('0')
    })
  })
})
