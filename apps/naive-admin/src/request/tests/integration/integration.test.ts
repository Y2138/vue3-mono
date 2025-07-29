/**
 * 集成测试 - 测试业务 API 功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userLogin, getCurrentUser, getUserList } from '../../api/users'
import { getPermissions, getRoles, checkPermission } from '../../api/rbac'
import { api_getColumnList, api_createColumn } from '../../api/column'
import { get, post, healthCheck, isApiSuccess, formatApiError } from '../../api/common'

// Mock the API adapter
vi.mock('../../api-adapter', () => ({
  apiCall: vi.fn()
}))

const mockApiCall = vi.mocked((await import('../../api-adapter')).apiCall)

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('用户 API 集成测试', () => {
    it('用户登录应该返回正确格式', async () => {
      const mockLoginResponse = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '123',
          username: 'testuser',
          phone: '13800138000',
          roles: ['user'],
          permissions: ['read'],
          createTime: '2024-01-01',
          updateTime: '2024-01-01'
        },
        expiresIn: 3600
      }

      mockApiCall.mockResolvedValue([mockLoginResponse, null])

      const [result, error] = await userLogin('13800138000', 'password123')

      expect(error).toBeNull()
      expect(result).toEqual(mockLoginResponse)
      expect(mockApiCall).toHaveBeenCalledWith('POST /auth/login', {
        phone: '13800138000',
        password: 'password123',
        deviceInfo: expect.objectContaining({
          platform: 'web',
          userAgent: expect.any(String),
          timestamp: expect.any(Number)
        })
      })

      // 验证 token 已保存到 localStorage
      expect(localStorage.getItem('token')).toBe('mock-token')
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockLoginResponse.user))
    })

    it('获取用户列表应该返回分页数据', async () => {
      const mockUsersResponse = {
        items: [
          {
            id: '1',
            username: 'user1',
            phone: '13800138001',
            roles: ['user'],
            permissions: ['read'],
            createTime: '2024-01-01',
            updateTime: '2024-01-01'
          }
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1
        }
      }

      mockApiCall.mockResolvedValue([mockUsersResponse, null])

      const [result, error] = await getUserList({ page: 1, pageSize: 20 })

      expect(error).toBeNull()
      expect(result).toEqual(mockUsersResponse)
      expect(mockApiCall).toHaveBeenCalledWith('GET /users', { page: 1, pageSize: 20 })
    })

    it('获取当前用户信息', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        phone: '13800138000',
        roles: ['user'],
        permissions: ['read'],
        createTime: '2024-01-01',
        updateTime: '2024-01-01'
      }

      mockApiCall.mockResolvedValue([mockUser, null])

      const [result, error] = await getCurrentUser()

      expect(error).toBeNull()
      expect(result).toEqual(mockUser)
      expect(mockApiCall).toHaveBeenCalledWith('GET /auth/me', {})
    })
  })

  describe('权限 API 集成测试', () => {
    it('获取权限列表', async () => {
      const mockPermissionsResponse = {
        items: [
          {
            id: '1',
            name: '查看用户',
            code: 'user:read',
            resource: 'user',
            action: 'read',
            createTime: '2024-01-01',
            updateTime: '2024-01-01'
          }
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1
        }
      }

      mockApiCall.mockResolvedValue([mockPermissionsResponse, null])

      const [result, error] = await getPermissions({ page: 1 })

      expect(error).toBeNull()
      expect(result).toEqual(mockPermissionsResponse)
      expect(mockApiCall).toHaveBeenCalledWith('GET /permissions', { page: 1 })
    })

    it('获取角色列表', async () => {
      const mockRolesResponse = {
        items: [
          {
            id: '1',
            name: '普通用户',
            code: 'user',
            permissions: ['1'],
            createTime: '2024-01-01',
            updateTime: '2024-01-01'
          }
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1
        }
      }

      mockApiCall.mockResolvedValue([mockRolesResponse, null])

      const [result, error] = await getRoles({ page: 1 })

      expect(error).toBeNull()
      expect(result).toEqual(mockRolesResponse)
      expect(mockApiCall).toHaveBeenCalledWith('GET /roles', { page: 1 })
    })

    it('检查用户权限', async () => {
      const mockPermissionCheck = {
        hasPermission: true,
        reason: '用户具有该权限'
      }

      mockApiCall.mockResolvedValue([mockPermissionCheck, null])

      const [result, error] = await checkPermission('user123', 'user:read')

      expect(error).toBeNull()
      expect(result).toEqual(mockPermissionCheck)
      expect(mockApiCall).toHaveBeenCalledWith('POST /permissions/check', {
        userId: 'user123',
        permission: 'user:read'
      })
    })
  })

  describe('专栏 API 集成测试', () => {
    it('获取专栏列表', async () => {
      const mockColumnsResponse = {
        list: [
          {
            xid: '1',
            columnName: '测试专栏',
            columnIntro: '专栏介绍',
            status: 1
          }
        ],
        total: 1
      }

      mockApiCall.mockResolvedValue([mockColumnsResponse, null])

      const [result, error] = await api_getColumnList({ page: 1, pageSize: 10 })

      expect(error).toBeNull()
      expect(result).toEqual(mockColumnsResponse)
      expect(mockApiCall).toHaveBeenCalledWith('GET /api/column/column/index', {
        page: 1,
        pageSize: 10
      })
    })

    it('创建专栏', async () => {
      const mockCreateResponse = {
        xid: '2',
        columnName: '新专栏',
        columnIntro: '新专栏介绍'
      }

      mockApiCall.mockResolvedValue([mockCreateResponse, null])

      const [result, error] = await api_createColumn({
        columnName: '新专栏',
        columnIntro: '新专栏介绍'
      })

      expect(error).toBeNull()
      expect(result).toEqual(mockCreateResponse)
      expect(mockApiCall).toHaveBeenCalledWith('POST /column/column/create', {
        columnName: '新专栏',
        columnIntro: '新专栏介绍'
      })
    })
  })

  describe('通用工具 API 集成测试', () => {
    it('通用 GET 请求', async () => {
      const mockData = { message: 'success' }
      mockApiCall.mockResolvedValue([mockData, null])

      const [result, error] = await get('/api/test', { params: { id: 1 } })

      expect(error).toBeNull()
      expect(result).toEqual(mockData)
      expect(mockApiCall).toHaveBeenCalledWith('GET /api/test', { id: 1 }, {
        headers: undefined
      })
    })

    it('通用 POST 请求', async () => {
      const mockData = { id: 1, name: 'test' }
      mockApiCall.mockResolvedValue([mockData, null])

      const result = await post('/api/users', { name: 'test' })

      expect(result).toEqual([mockData, null])
      expect(mockApiCall).toHaveBeenCalledWith('POST /api/users', { name: 'test' }, {
        headers: undefined
      })
    })

    it('健康检查', async () => {
      // Mock checkApiHealth 函数
      vi.doMock('../../api-adapter', () => ({
        apiCall: mockApiCall,
        checkApiHealth: vi.fn().mockResolvedValue({ http: true, grpc: false }),
        getApiConfig: vi.fn().mockReturnValue({
          useGrpc: false,
          httpBaseUrl: 'http://localhost:3000'
        })
      }))

      const health = await healthCheck()
      expect(health.status).toBe('healthy')
    })

    it('响应格式检查工具', () => {
      // 测试成功响应
      const successResponse: [any, null] = [{ data: 'test' }, null]
      expect(isApiSuccess(successResponse)).toBe(true)

      // 测试失败响应
      const errorResponse: [null, Error] = [null, new Error('test error')]
      expect(isApiSuccess(errorResponse)).toBe(false)
    })

    it('错误格式化工具', () => {
      // HTTP 401 错误
      const http401Error = new Error('Unauthorized')
      http401Error.name = 'HTTP_401'
      expect(formatApiError(http401Error)).toBe('登录已过期，请重新登录')

      // HTTP 403 错误
      const http403Error = new Error('Forbidden')
      http403Error.name = 'HTTP_403'
      expect(formatApiError(http403Error)).toBe('权限不足，无法访问')

      // HTTP 404 错误
      const http404Error = new Error('Not Found')
      http404Error.name = 'HTTP_404'
      expect(formatApiError(http404Error)).toBe('请求的资源不存在')

      // HTTP 500 错误
      const http500Error = new Error('Internal Server Error')
      http500Error.name = 'HTTP_500'
      expect(formatApiError(http500Error)).toBe('服务器内部错误，请稍后重试')

      // 其他错误
      const otherError = new Error('Custom error message')
      expect(formatApiError(otherError)).toBe('Custom error message')

      // 空错误
      expect(formatApiError(null)).toBe('')
    })
  })

  describe('错误处理集成测试', () => {
    it('应该正确处理 API 错误响应', async () => {
      const mockError = new Error('用户不存在')
      mockError.name = 'HTTP_404'
      
      mockApiCall.mockResolvedValue([null, mockError])

      const [result, error] = await getCurrentUser()

      expect(result).toBeNull()
      expect(error).toEqual(mockError)
    })

    it('登录失败不应该保存 token', async () => {
      const mockError = new Error('密码错误')
      mockError.name = 'HTTP_401'
      
      mockApiCall.mockResolvedValue([null, mockError])

      const [result, error] = await userLogin('13800138000', 'wrongpassword')

      expect(result).toBeNull()
      expect(error).toEqual(mockError)
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('类型安全测试', () => {
    it('用户 API 返回类型应该正确', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        phone: '13800138000',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        createTime: '2024-01-01',
        updateTime: '2024-01-01'
      }

      mockApiCall.mockResolvedValue([mockUser, null])

      const [user, _error] = await getCurrentUser()

      if (user) {
        // TypeScript 类型检查
        expect(typeof user.id).toBe('string')
        expect(typeof user.username).toBe('string')
        expect(typeof user.phone).toBe('string')
        expect(Array.isArray(user.roles)).toBe(true)
        expect(Array.isArray(user.permissions)).toBe(true)
      }
    })

    it('权限 API 返回类型应该正确', async () => {
      const mockPermission = {
        id: '1',
        name: '查看用户',
        code: 'user:read',
        resource: 'user',
        action: 'read',
        createTime: '2024-01-01',
        updateTime: '2024-01-01'
      }

      const mockResponse = {
        items: [mockPermission],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1
        }
      }

      mockApiCall.mockResolvedValue([mockResponse, null])

      const [permissions, _error] = await getPermissions()

      if (permissions) {
        expect(Array.isArray(permissions.items)).toBe(true)
        expect(typeof permissions.pagination.total).toBe('number')
        
        const permission = permissions.items[0]
        expect(typeof permission.code).toBe('string')
        expect(typeof permission.resource).toBe('string')
        expect(typeof permission.action).toBe('string')
      }
    })
  })
}) 