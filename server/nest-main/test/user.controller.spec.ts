import { Test, TestingModule } from '@nestjs/testing'
import { UserHttpController } from '../src/modules/users/user.controller'
import { UserService } from '../src/modules/users/user.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('UserHttpController', () => {
  let controller: UserHttpController
  let service: UserService

  beforeEach(() => {
    // 创建模拟的 PrismaService
    const mockPrismaService = {
      client: {
        user: {
          findUnique: vi.fn(),
          findMany: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          count: vi.fn()
        },
        role: {
          findMany: vi.fn()
        }
      },
      $transaction: vi.fn()
    }

    // 创建模拟的 UserService
    service = new UserService(mockPrismaService as any)

    // 模拟所有需要的方法
    service.getCurrentUser = vi.fn().mockResolvedValue({})
    service.findAll = vi.fn().mockResolvedValue({ data: [], total: 0 })
    service.findOne = vi.fn().mockResolvedValue({})
    service.create = vi.fn().mockResolvedValue({})
    service.update = vi.fn().mockResolvedValue({})
    service.remove = vi.fn().mockResolvedValue({})
    service.updatePassword = vi.fn().mockResolvedValue({})
    service.getUserRoles = vi.fn().mockResolvedValue([])
    service.assignRolesToUser = vi.fn().mockResolvedValue({})
    service.removeRolesFromUser = vi.fn().mockResolvedValue({})

    // 创建控制器实例
    controller = new UserController(service)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return current user with menuTree', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        username: 'admin',
        phone: '15316120580',
        email: 'admin@example.com',
        is_active: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }

      const mockMenuTree = [
        {
          id: '1',
          name: '系统管理',
          type: 1,
          children: [
            {
              id: '2',
              name: '用户管理',
              type: 1,
              children: []
            }
          ]
        }
      ]

      const mockResources = [
        { id: '1', name: '系统管理', type: 1 },
        { id: '2', name: '用户管理', type: 1 }
      ]

      service.getCurrentUser.mockResolvedValue({
        user: mockUser,
        menuTree: mockMenuTree,
        resources: mockResources
      })

      // Act
      const result = await controller.getCurrentUser('1')

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.message).toBe('操作成功')
      expect(result.data.user).toEqual(mockUser)
      expect(result.data.menuTree).toEqual(mockMenuTree)
      expect(result.data.resources).toEqual(mockResources)
      expect(service.getCurrentUser).toHaveBeenCalledWith('1')
    })

    it('should return only MENU type resources in menuTree', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        username: 'admin',
        phone: '15316120580',
        email: 'admin@example.com',
        is_active: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }

      const mockMenuTree = [
        {
          id: '1',
          name: '系统管理',
          type: 1, // MENU type
          children: [
            {
              id: '2',
              name: '用户管理',
              type: 1, // MENU type
              children: []
            }
          ]
        }
      ]

      const mockResources = [
        { id: '1', name: '系统管理', type: 1 },
        { id: '2', name: '用户管理', type: 1 },
        { id: '3', name: '用户API', type: 2 }, // API type should not be in menuTree
        { id: '4', name: '用户页面', type: 3 }, // PAGE type should not be in menuTree
        { id: '5', name: '用户模块', type: 4 } // MODULE type should not be in menuTree
      ]

      service.getCurrentUser.mockResolvedValue({
        user: mockUser,
        menuTree: mockMenuTree,
        resources: mockResources
      })

      // Act
      const result = await controller.getCurrentUser('1')

      // Assert
      expect(result.data.menuTree).toBeDefined()
      expect(result.data.menuTree.length).toBeGreaterThan(0)

      // Verify all items in menuTree are MENU type (type === 1)
      const checkMenuType = (items: any[]): boolean => {
        return items.every((item) => {
          if (item.type !== 1) return false
          if (item.children && item.children.length > 0) {
            return checkMenuType(item.children)
          }
          return true
        })
      }

      expect(checkMenuType(result.data.menuTree)).toBe(true)
    })

    it('should handle user not found', async () => {
      // Arrange
      service.getCurrentUser.mockResolvedValue({
        user: null,
        menuTree: [],
        resources: []
      })

      // Act
      const result = await controller.getCurrentUser('999')

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.user).toBeNull()
      expect(result.data.menuTree).toEqual([])
      expect(result.data.resources).toEqual([])
    })
  })

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
      // Arrange
      const mockData = {
        data: [
          {
            id: '1',
            username: 'admin',
            phone: '15316120580',
            email: 'admin@example.com',
            is_active: true,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
          }
        ],
        total: 1
      }

      service.findAll.mockResolvedValue(mockData)

      // Act
      const result = await controller.getUsers({
        search: undefined,
        isActive: undefined,
        pagination: undefined
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.data.users).toEqual(mockData.data)
      expect(result.data.pagination.total).toBe('1')
      expect(service.findAll).toHaveBeenCalledWith({
        search: undefined,
        is_active: undefined,
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

      // Act
      await controller.getUsers({
        search: 'admin',
        isActive: true,
        pagination: { page: 1, pageSize: 20 }
      })

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({
        search: 'admin',
        is_active: true,
        pagination: { page: 1, pageSize: 20 }
      })
    })
  })

  describe('createUser', () => {
    it('should create new user successfully', async () => {
      // Arrange
      const request = {
        username: 'newuser',
        phone: '13800138000',
        email: 'newuser@example.com',
        password: 'password123',
        isActive: true
      }

      const mockUser = {
        id: '2',
        ...request,
        is_active: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
      service.create.mockResolvedValue(mockUser)

      // Act
      const result = await controller.createUser(request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(result.data.id).toBe(mockUser.id)
      expect(result.data.username).toBe(mockUser.username)
      expect(service.create).toHaveBeenCalledWith(request)
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const request = {
        username: 'updateduser',
        email: 'updated@example.com'
      }

      const mockUser = {
        id: '1',
        ...request,
        phone: '15316120580',
        is_active: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
      service.update.mockResolvedValue(mockUser)

      // Act
      const result = await controller.updateUser('1', request)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('1')
      expect(result.data.username).toBe('updateduser')
      expect(service.update).toHaveBeenCalledWith('1', request)
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      service.remove.mockResolvedValue({ id: '1' })

      // Act
      const result = await controller.deleteUser('1')

      // Assert
      expect(result.success).toBe(true)
      expect(result.code).toBe(200)
      expect(service.remove).toHaveBeenCalledWith('1')
    })
  })
})
