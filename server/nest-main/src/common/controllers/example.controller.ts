import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { BaseController } from './base.controller'
import { ApiResponse, ApiPaginatedResponse } from '../response/types'
import { Validator } from '../validators'

/**
 * 示例控制器
 * 展示如何使用 BaseController
 */
@Controller('api/examples')
export class ExampleController extends BaseController {
  // 示例数据
  private examples = [
    { id: '1', name: '示例1', description: '这是示例1的描述' },
    { id: '2', name: '示例2', description: '这是示例2的描述' },
    { id: '3', name: '示例3', description: '这是示例3的描述' }
  ]

  constructor() {
    super(ExampleController.name)
  }

  /**
   * 获取所有示例
   */
  @Get()
  async getAll(@Query('page') page = 1, @Query('pageSize') pageSize = 10): Promise<ApiPaginatedResponse<any>> {
    const examples = this.examples
    const total = examples.length
    const totalPages = Math.ceil(total / pageSize)

    return this.paginated(
      examples,
      {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      '获取示例列表成功'
    )
  }

  /**
   * 获取单个示例 - 新的错误处理方式
   */
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    // 参数验证 - 验证失败会自动抛出 ValidationException
    Validator.stringLength(id, 1, 10, 'ID')

    const example = this.examples.find((e) => e.id === id)

    // 使用 BaseController 的断言方法 - 数据不存在时自动抛出 DataNotFoundException
    this.assertDataExists(example, '示例', id)

    return this.success(example, '获取示例成功')
  }

  /**
   * 创建示例 - 新的错误处理方式
   */
  @Post()
  async create(@Body() data: { name: string; description: string }): Promise<ApiResponse<any>> {
    // 参数验证 - 验证失败会自动抛出 ValidationException
    Validator.stringLength(data.name, 1, 50, '名称')
    Validator.stringLength(data.description, 1, 200, '描述')

    // 业务验证 - 检查名称是否已存在
    const existingExample = this.examples.find((e) => e.name === data.name)
    if (existingExample) {
      this.throwConflictError('示例名称已存在')
    }

    // 创建示例 - 异常会被 HttpExceptionFilter 自动处理
    const newExample = {
      id: (this.examples.length + 1).toString(),
      name: data.name,
      description: data.description
    }

    this.examples.push(newExample)

    return this.success(newExample, '创建示例成功')
  }

  /**
   * 更新示例 - 新的错误处理方式
   */
  @Post('update/:id')
  async update(@Param('id') id: string, @Body() data: { name?: string; description?: string }): Promise<ApiResponse<any>> {
    // 参数验证
    Validator.stringLength(id, 1, 10, 'ID')
    if (data.name !== undefined) {
      Validator.stringLength(data.name, 1, 50, '名称')
    }
    if (data.description !== undefined) {
      Validator.stringLength(data.description, 1, 200, '描述')
    }

    const index = this.examples.findIndex((e) => e.id === id)

    // 使用 BaseController 的断言方法
    this.assert(index !== -1, '示例不存在')

    // 检查名称冲突
    if (data.name && data.name !== this.examples[index].name) {
      const existingExample = this.examples.find((e) => e.name === data.name)
      if (existingExample) {
        this.throwConflictError('示例名称已存在')
      }
    }

    // 更新示例
    this.examples[index] = {
      ...this.examples[index],
      ...data
    }

    return this.success(this.examples[index], '更新示例成功')
  }

  /**
   * 删除示例 - 新的错误处理方式
   */
  @Post('delete/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    // 参数验证
    Validator.stringLength(id, 1, 10, 'ID')

    const index = this.examples.findIndex((e) => e.id === id)

    // 使用 BaseController 的断言方法
    this.assert(index !== -1, '示例不存在')

    this.examples.splice(index, 1)

    return this.success(null, '删除示例成功')
  }

  // ========================================
  // 🚨 错误处理示例 - 新的统一异常处理方式
  // ========================================

  /**
   * 业务错误示例 - 直接抛出异常
   */
  @Get('error/business')
  businessErrorExample(): never {
    // 直接抛出业务异常，HttpExceptionFilter 会自动处理
    this.throwBusinessError('这是一个业务错误示例')
  }

  /**
   * 验证错误示例 - 直接抛出异常
   */
  @Get('error/validation')
  validationErrorExample(): never {
    // 直接抛出验证异常，HttpExceptionFilter 会自动处理
    this.throwValidationError('输入数据验证失败', {
      fields: [
        { field: 'name', message: '名称不能为空' },
        { field: 'email', message: '邮箱格式不正确' }
      ]
    })
  }

  /**
   * 数据不存在错误示例 - 直接抛出异常
   */
  @Get('error/not-found')
  notFoundErrorExample(): never {
    // 直接抛出数据不存在异常，HttpExceptionFilter 会自动处理
    this.throwDataNotFound('示例', '999')
  }

  /**
   * 冲突错误示例 - 直接抛出异常
   */
  @Get('error/conflict')
  conflictErrorExample(): never {
    // 直接抛出冲突异常，HttpExceptionFilter 会自动处理
    this.throwConflictError('资源已存在，无法重复创建')
  }

  /**
   * 服务器内部错误示例 - 让异常自然抛出
   */
  @Get('error/server')
  serverErrorExample(): never {
    // 直接抛出原生错误，HttpExceptionFilter 会捕获并转换为标准响应
    throw new Error('这是一个服务器内部错误示例')
  }
}
