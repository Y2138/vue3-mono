import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { BaseController } from './base.controller';
import { ApiResponse, ApiPaginatedResponse } from '../response/types';

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
    { id: '3', name: '示例3', description: '这是示例3的描述' },
  ];

  constructor() {
    super(ExampleController.name);
  }

  /**
   * 获取所有示例
   */
  @Get()
  async getAll(@Query('page') page = 1, @Query('pageSize') pageSize = 10): Promise<ApiPaginatedResponse<any>> {
    const examples = this.examples;
    const total = examples.length;
    const totalPages = Math.ceil(total / pageSize);
    
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
    );
  }

  /**
   * 获取单个示例
   */
  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const example = this.examples.find(e => e.id === id);
    
    if (!example) {
      return this.notFound('示例');
    }
    
    return this.success(example, '获取示例成功');
  }

  /**
   * 创建示例
   */
  @Post()
  async create(@Body() data: { name: string; description: string }): Promise<ApiResponse<any>> {
    try {
      // 模拟创建操作
      const newExample = {
        id: (this.examples.length + 1).toString(),
        name: data.name,
        description: data.description
      };
      
      this.examples.push(newExample);
      
      return this.success(newExample, '创建示例成功');
    } catch (error) {
      return this.businessError('创建示例失败：' + error.message);
    }
  }

  /**
   * 更新示例
   */
  @Post('update/:id')
  async update(@Param('id') id: string, @Body() data: { name?: string; description?: string }): Promise<ApiResponse<any>> {
    // 使用 safeExecute 方法简化错误处理
    return this.safeExecute(
      async () => {
        const index = this.examples.findIndex(e => e.id === id);
        
        if (index === -1) {
          throw new NotFoundException('示例不存在');
        }
        
        // 更新示例
        this.examples[index] = {
          ...this.examples[index],
          ...data
        };
        
        return this.examples[index];
      },
      '更新示例成功'
    );
  }

  /**
   * 删除示例
   */
  @Post('delete/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    const index = this.examples.findIndex(e => e.id === id);
    
    if (index === -1) {
      return this.notFound('示例');
    }
    
    this.examples.splice(index, 1);
    
    return this.success(null, '删除示例成功');
  }

  /**
   * 用户友好错误示例
   */
  @Get('error/user-friendly')
  userFriendlyErrorExample(): ApiResponse<null> {
    return this.userError('这是一个用户友好的错误，可以直接展示给用户');
  }

  /**
   * 业务错误示例
   */
  @Get('error/business')
  businessErrorExample(): ApiResponse<null> {
    return this.businessError('这是一个业务错误');
  }

  /**
   * 验证错误示例
   */
  @Get('error/validation')
  validationErrorExample(): ApiResponse<null> {
    return this.validationError('输入数据验证失败', [
      { field: 'name', message: '名称不能为空' },
      { field: 'email', message: '邮箱格式不正确' }
    ]);
  }

  /**
   * 服务器错误示例
   */
  @Get('error/server')
  serverErrorExample(): ApiResponse<null> {
    try {
      throw new Error('这是一个服务器内部错误');
    } catch (error) {
      return this.serverError('服务器处理请求时发生错误', error);
    }
  }
}
