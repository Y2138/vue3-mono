import { Test, TestingModule } from '@nestjs/testing'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import * as request from 'supertest'
import { HttpExceptionFilter } from '../filters/http-exception.filter'
import { BusinessException, DataNotFoundException, ValidationException, ConflictException } from '../exceptions'

// 测试控制器
import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { BaseController } from '../controllers/base.controller'
import { ApiResponse } from '../response/types'

@Controller('test')
class TestController extends BaseController {
  constructor() {
    super('TestController')
  }

  @Get('success')
  testSuccess(): ApiResponse<string> {
    return this.success('测试成功', '操作成功')
  }

  @Get('data-not-found/:id')
  testDataNotFound(@Param('id') id: string): ApiResponse<any> {
    this.throwDataNotFound('用户', id)
  }

  @Get('validation-error')
  testValidationError(): ApiResponse<any> {
    this.throwValidationError('手机号格式不正确', { field: 'phone', value: 'invalid' })
  }

  @Get('conflict-error')
  testConflictError(): ApiResponse<any> {
    this.throwConflictError('该手机号已被注册')
  }

  @Get('business-error')
  testBusinessError(): ApiResponse<any> {
    this.throwBusinessError('用户状态异常')
  }

  @Get('unauthorized')
  testUnauthorized(): ApiResponse<any> {
    throw new Error('Unauthorized access') // 这会被处理为内部错误
  }

  @Post('assert-not-empty')
  testAssertNotEmpty(@Body() body: { value?: string }): ApiResponse<string> {
    this.assertNotEmpty(body.value, '测试字段')
    return this.success('验证通过')
  }

  @Get('assert-data-exists/:id')
  testAssertDataExists(@Param('id') id: string): ApiResponse<any> {
    const data = id === 'exists' ? { id, name: '测试数据' } : null
    const result = this.assertDataExists(data, '测试数据', id)
    return this.success(result)
  }
}

describe('错误处理系统测试', () => {
  let app: INestApplication
  let testController: TestController

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: APP_FILTER,
          useClass: HttpExceptionFilter
        }
      ]
    }).compile()

    app = moduleFixture.createNestApplication()

    // 应用全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter())

    await app.init()
    testController = moduleFixture.get<TestController>(TestController)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('成功响应', () => {
    it('应该返回标准成功响应', async () => {
      const response = await request(app.getHttpServer()).get('/test/success').expect(HttpStatus.OK)

      expect(response.body).toEqual({
        success: true,
        code: 200,
        message: '操作成功',
        data: '测试成功'
      })
    })
  })

  describe('业务异常处理', () => {
    it('数据不存在异常应返回 HTTP 200 和正确的错误格式', async () => {
      const response = await request(app.getHttpServer()).get('/test/data-not-found/123').expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        success: false,
        code: 400,
        message: '用户 123 不存在',
        data: null,
        error: {
          type: 'DATA_ERROR',
          details: {
            entityType: '用户',
            identifier: '123'
          }
        }
      })
    })

    it('参数验证异常应返回 HTTP 200 和正确的错误格式', async () => {
      const response = await request(app.getHttpServer()).get('/test/validation-error').expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        success: false,
        code: 422,
        message: '手机号格式不正确',
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          details: {
            field: 'phone',
            value: 'invalid'
          }
        }
      })
    })

    it('数据冲突异常应返回 HTTP 200 和正确的错误格式', async () => {
      const response = await request(app.getHttpServer()).get('/test/conflict-error').expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        success: false,
        code: 409,
        message: '该手机号已被注册',
        data: null,
        error: {
          type: 'BUSINESS_ERROR'
        }
      })
    })

    it('业务规则异常应返回 HTTP 200 和正确的错误格式', async () => {
      const response = await request(app.getHttpServer()).get('/test/business-error').expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        success: false,
        code: 400,
        message: '用户状态异常',
        data: null,
        error: {
          type: 'BUSINESS_ERROR'
        }
      })
    })
  })

  describe('断言方法测试', () => {
    it('assertNotEmpty 应该在值为空时抛出异常', async () => {
      const response = await request(app.getHttpServer()).post('/test/assert-not-empty').send({ value: '' }).expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        success: false,
        code: 422,
        message: '测试字段不能为空',
        data: null,
        error: {
          type: 'VALIDATION_ERROR'
        }
      })
    })

    it('assertNotEmpty 应该在值不为空时通过', async () => {
      const response = await request(app.getHttpServer()).post('/test/assert-not-empty').send({ value: '测试值' }).expect(HttpStatus.OK)

      expect(response.body).toEqual({
        success: true,
        code: 200,
        message: '操作成功',
        data: '验证通过'
      })
    })

    it('assertDataExists 应该在数据不存在时抛出异常', async () => {
      const response = await request(app.getHttpServer()).get('/test/assert-data-exists/notexists').expect(HttpStatus.OK)

      expect(response.body).toMatchObject({
        success: false,
        code: 400,
        message: '测试数据 notexists 不存在',
        data: null,
        error: {
          type: 'DATA_ERROR',
          details: {
            entityType: '测试数据',
            identifier: 'notexists'
          }
        }
      })
    })

    it('assertDataExists 应该在数据存在时返回数据', async () => {
      const response = await request(app.getHttpServer()).get('/test/assert-data-exists/exists').expect(HttpStatus.OK)

      expect(response.body).toEqual({
        success: true,
        code: 200,
        message: '操作成功',
        data: { id: 'exists', name: '测试数据' }
      })
    })
  })

  describe('响应格式一致性', () => {
    it('所有响应都应该有相同的基础结构', async () => {
      const endpoints = ['/test/success', '/test/data-not-found/123', '/test/validation-error', '/test/conflict-error', '/test/business-error']

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer()).get(endpoint).expect(HttpStatus.OK)

        // 检查基础响应结构
        expect(response.body).toHaveProperty('success')
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')

        // 成功响应不应该有 error 字段
        if (response.body.success) {
          expect(response.body).not.toHaveProperty('error')
        } else {
          // 失败响应应该有 error 字段
          expect(response.body).toHaveProperty('error')
          expect(response.body.error).toHaveProperty('type')
        }
      }
    })
  })
})

describe('异常类单元测试', () => {
  describe('BusinessException', () => {
    it('应该创建正确的业务异常', () => {
      const exception = new BusinessException('测试错误', 400, 'TEST_ERROR', { test: true })

      expect(exception.message).toBe('测试错误')
      expect(exception.code).toBe(400)
      expect(exception.type).toBe('TEST_ERROR')
      expect(exception.details).toEqual({ test: true })
      expect(exception.name).toBe('BusinessException')
    })
  })

  describe('DataNotFoundException', () => {
    it('应该创建正确的数据不存在异常', () => {
      const exception = new DataNotFoundException('用户', '123')

      expect(exception.message).toBe('用户 123 不存在')
      expect(exception.code).toBe(400)
      expect(exception.type).toBe('DATA_ERROR')
      expect(exception.details).toEqual({ entityType: '用户', identifier: '123' })
      expect(exception.name).toBe('DataNotFoundException')
    })
  })

  describe('ValidationException', () => {
    it('应该创建正确的验证异常', () => {
      const exception = new ValidationException('手机号格式不正确', { field: 'phone' })

      expect(exception.message).toBe('手机号格式不正确')
      expect(exception.code).toBe(422)
      expect(exception.type).toBe('VALIDATION_ERROR')
      expect(exception.details).toEqual({ field: 'phone' })
      expect(exception.name).toBe('ValidationException')
    })
  })
})
