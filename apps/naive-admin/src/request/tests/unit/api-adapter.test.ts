/**
 * API 适配器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiCall, updateApiConfig, getApiConfig, checkApiHealth } from '../../api-adapter'

// Mock axios
vi.mock('axios', () => ({
  default: vi.fn(),
  isAxiosError: vi.fn()
}))

describe('API Adapter', () => {
  beforeEach(() => {
    // 重置配置
    updateApiConfig({
      useGrpc: false,
      grpcEndpoint: 'http://localhost:9090',
      httpBaseUrl: 'http://localhost:3000',
      debug: false
    })
    
    // 清理本地存储
    localStorage.clear()
  })

  describe('配置管理', () => {
    it('应该正确更新配置', () => {
      updateApiConfig({ useGrpc: true, debug: true })
      
      const config = getApiConfig()
      expect(config.useGrpc).toBe(true)
      expect(config.debug).toBe(true)
    })

    it('应该正确加载环境变量配置', () => {
      const config = getApiConfig()
      expect(config).toHaveProperty('useGrpc')
      expect(config).toHaveProperty('grpcEndpoint')
      expect(config).toHaveProperty('httpBaseUrl')
      expect(config).toHaveProperty('debug')
    })

    it('应该支持运行时配置覆盖', () => {
      // 模拟运行时配置
      ;(window as any).__API_CONFIG__ = {
        useGrpc: true,
        debug: true
      }

      updateApiConfig({})
      const config = getApiConfig()
      expect(config.useGrpc).toBe(false) // updateApiConfig 覆盖了运行时配置
    })
  })

  describe('API 调用', () => {
    it('应该正确解析端点格式', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      await apiCall('GET /users', { page: 1 })

      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          url: 'http://localhost:3000/users'
        })
      )
    })

    it('应该正确处理不同的 HTTP 方法', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      // GET 请求
      await apiCall('GET /users', { page: 1 })
      expect(axiosDefault).toHaveBeenLastCalledWith(
        expect.objectContaining({ method: 'get' })
      )

      // POST 请求
      await apiCall('POST /users', { name: 'test' })
      expect(axiosDefault).toHaveBeenLastCalledWith(
        expect.objectContaining({ method: 'post' })
      )

      // PUT 请求
      await apiCall('PUT /users/123', { name: 'updated' })
      expect(axiosDefault).toHaveBeenLastCalledWith(
        expect.objectContaining({ method: 'put' })
      )

      // DELETE 请求
      await apiCall('DELETE /users/123', {})
      expect(axiosDefault).toHaveBeenLastCalledWith(
        expect.objectContaining({ method: 'delete' })
      )
    })

    it('应该正确添加认证头', async () => {
      localStorage.setItem('token', 'test-token')
      
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      await apiCall('GET /users', {})

      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })

    it('应该正确处理请求数据', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      // POST 请求应该将数据放在 body 中
      await apiCall('POST /users', { name: 'test' })
      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'test' }
        })
      )

      // GET 请求应该将数据放在 params 中
      await apiCall('GET /users', { page: 1 })
      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { page: 1 }
        })
      )
    })
  })

  describe('错误处理', () => {
    it('应该正确处理 HTTP 错误', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      const isAxiosError = mockAxios.isAxiosError as any
      
      const error = {
        response: {
          status: 404,
          data: { message: '用户不存在' }
        }
      }
      
      axiosDefault.mockRejectedValue(error)
      isAxiosError.mockReturnValue(true)

      const [data, resultError] = await apiCall('GET /users/999', {})

      expect(data).toBeNull()
      expect(resultError).toBeInstanceOf(Error)
      expect(resultError?.name).toBe('HTTP_404')
      expect(resultError?.message).toBe('用户不存在')
    })

    it('应该正确处理网络错误', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      const isAxiosError = mockAxios.isAxiosError as any
      
      const error = new Error('Network Error')
      axiosDefault.mockRejectedValue(error)
      isAxiosError.mockReturnValue(true)

      const [data, resultError] = await apiCall('GET /users', {})

      expect(data).toBeNull()
      expect(resultError).toBeInstanceOf(Error)
      expect(resultError?.message).toBe('Network Error')
    })

    it('应该正确处理未知错误', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      const isAxiosError = mockAxios.isAxiosError as any
      
      const error = 'Unknown error'
      axiosDefault.mockRejectedValue(error)
      isAxiosError.mockReturnValue(false)

      const [data, resultError] = await apiCall('GET /users', {})

      expect(data).toBeNull()
      expect(resultError).toBeInstanceOf(Error)
      expect(resultError?.message).toBe('请求失败')
    })
  })

  describe('协议切换', () => {
    it('gRPC 模式应该降级到 HTTP', async () => {
      updateApiConfig({ useGrpc: true, debug: true })
      
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      // 即使配置为 gRPC，也应该使用 HTTP
      await apiCall('GET /users', {})

      expect(axiosDefault).toHaveBeenCalled()
    })
  })

  describe('健康检查', () => {
    it('应该执行健康检查', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { status: 'ok' } })

      const health = await checkApiHealth()

      expect(health).toHaveProperty('http')
      expect(health).toHaveProperty('grpc')
    })
  })

  describe('端点映射', () => {
    it('应该正确映射已知端点', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      await apiCall('GET /api/column/column/index', {})

      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:3000/api/column/column/index'
        })
      )
    })

    it('应该处理未映射的端点', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      await apiCall('GET /custom/endpoint', {})

      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:3000/custom/endpoint'
        })
      )
    })
  })

  describe('超时和选项', () => {
    it('应该正确设置超时', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      await apiCall('GET /users', {}, { timeout: 5000 })

      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000
        })
      )
    })

    it('应该正确设置自定义头', async () => {
      const mockAxios = await import('axios')
      const axiosDefault = mockAxios.default as any
      axiosDefault.mockResolvedValue({ data: { success: true } })

      await apiCall('POST /upload', {}, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      expect(axiosDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      )
    })
  })
}) 