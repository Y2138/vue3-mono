import { Body, Controller, Get, Param, Post, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiConsumes, ApiProduces, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Public } from '@/common/decorators/public.decorator'
import { RESOURCE_ENUMS } from '@/modules/resource/enums/resource.enums'
import { ResourceService } from '@/modules/resource/services/resource.service'
import { ResourceTreeService } from '@/modules/resource/services/resource-tree.service'
import { BaseController } from '@/common/controllers/base.controller'
import { CreateResourceRequest, UpdateResourceRequest, MoveResourceRequest, DuplicateResourceRequest, BatchDeleteResourcesRequest, GetResourcesRequest } from '@/shared/resource'

@Controller('api/resources')
@ApiTags('资源管理')
export class ResourceController extends BaseController {
  constructor(private readonly resourceService: ResourceService, private readonly resourceTreeService: ResourceTreeService) {
    super(ResourceController.name)
  }

  /**
   * 创建资源
   */
  @Post('create')
  @ApiOperation({ summary: '创建资源', description: '创建新的资源' })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({ status: 201, description: '创建成功', type: Object })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createResourceRequest: CreateResourceRequest) {
    // 参数验证
    this.assertNotEmpty(createResourceRequest.name, '资源名称')
    this.assertNotEmpty(createResourceRequest.type, '资源类型')

    const result = await this.resourceService.create(createResourceRequest)
    return this.created({
      data: result
    })
  }

  /**
   * 获取资源列表
   */
  @Get('list')
  @ApiOperation({ summary: '获取资源列表', description: '获取资源列表，支持类型、名称、路径、状态筛选和分页' })
  @ApiQuery({ name: 'type', required: false, description: '资源类型筛选' })
  @ApiQuery({ name: 'name', required: false, description: '资源名称筛选' })
  @ApiQuery({ name: 'path', required: false, description: '资源路径筛选' })
  @ApiQuery({ name: 'isActive', required: false, description: '资源状态筛选' })
  @ApiQuery({ name: 'pagination', required: false, description: '分页信息' })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '获取成功', type: Object })
  async list(@Query() getResourcesRequest: GetResourcesRequest) {
    const { type, name, path, isActive, pagination } = getResourcesRequest
    const result = await this.resourceService.findAll(type, name, path, isActive, pagination)
    return this.paginated(result.data, {
      total: result.total,
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20
    })
  }

  /**
   * 获取资源枚举
   */
  @Get('enums')
  @Public()
  @ApiOperation({ summary: '获取资源枚举', description: '获取资源类型和状态枚举' })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '获取成功', type: Object })
  async getResourceEnums() {
    const resourceType = Object.values(RESOURCE_ENUMS.RESOURCE_TYPE).map((item) => ({
      value: item.value,
      label: item.label,
      desc: item.extra ? JSON.parse(item.extra).description : ''
    }))

    const resourceStatus = [
      { value: 1, label: '启用', desc: '资源状态正常' },
      { value: 0, label: '禁用', desc: '资源状态禁用' }
    ]

    const enums = {
      resourceType,
      resourceStatus
    }

    return this.success(enums)
  }

  /**
   * 获取资源树
   */
  @Get('tree')
  @ApiOperation({ summary: '获取资源树', description: '获取资源树结构，支持类型筛选和单个ID查询' })
  @ApiQuery({ name: 'type', required: false, description: '资源类型筛选' })
  @ApiQuery({ name: 'id', required: false, description: '单个资源ID查询' })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '获取成功', type: Object })
  async tree(@Query('type') type?: string, @Query('id') id?: string) {
    // 如果提供了id，则查询该资源的子树
    if (id) {
      const result = await this.resourceTreeService.getSubtree(id)
      return this.success(result)
    }

    // 否则查询完整树，支持类型筛选
    const result = type ? await this.resourceTreeService.getResourceTreeByType(parseInt(type)) : await this.resourceTreeService.getResourceTree()
    return this.success(result)
  }

  /**
   * 获取资源路径
   */
  @Get('path')
  @ApiOperation({ summary: '获取资源路径', description: '获取资源的完整路径' })
  @ApiQuery({ name: 'id', description: '资源ID', required: true })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '获取成功', type: Object })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async getResourcePath(@Query('id') id: string) {
    this.assertNotEmpty(id, '资源ID')
    const result = await this.resourceTreeService.getResourcePath(id)
    return this.success({
      data: result
    })
  }

  /**
   * 获取资源祖先
   */
  @Get('ancestors')
  @ApiOperation({ summary: '获取资源祖先', description: '获取资源的祖先链' })
  @ApiQuery({ name: 'id', description: '资源ID', required: true })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '获取成功', type: Object })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async getAncestors(@Query('id') id: string) {
    this.assertNotEmpty(id, '资源ID')
    const result = await this.resourceTreeService.getResourcePath(id)
    return this.success({
      data: result
    })
  }

  /**
   * 获取单个资源
   */
  @Get('detail')
  @ApiOperation({ summary: '获取单个资源', description: '根据ID获取单个资源' })
  @ApiParam({ name: 'id', description: '资源ID', required: true })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '获取成功', type: Object })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async getResource(@Query('id') id: string) {
    const result = await this.resourceService.findOne(id)
    this.assertDataExists(result, '资源', id)
    return this.success(result)
  }

  /**
   * 更新资源
   */
  @Post('update')
  @ApiOperation({ summary: '更新资源', description: '更新指定资源信息' })
  @ApiQuery({ name: 'id', description: '资源ID', required: true })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '更新成功', type: Object })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async update(@Query('id') id: string, @Body() updateResourceRequest: UpdateResourceRequest) {
    this.assertNotEmpty(id, '资源ID')
    const result = await this.resourceService.update(id, updateResourceRequest)
    return this.success({
      data: result
    })
  }

  /**
   * 移动资源
   */
  @Post('move')
  @ApiOperation({ summary: '移动资源', description: '移动资源到新的父级' })
  @ApiQuery({ name: 'id', description: '资源ID', required: true })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '移动成功', type: Object })
  @ApiResponse({ status: 400, description: '请求参数错误或循环引用' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async move(@Query('id') id: string, @Body() moveRequest: MoveResourceRequest) {
    this.assertNotEmpty(id, '资源ID')
    const result = await this.resourceTreeService.moveResource(id, moveRequest.parentId || null)
    return this.success(result)
  }

  /**
   * 复制资源
   */
  @Post('duplicate')
  @ApiOperation({ summary: '复制资源', description: '复制资源到指定位置' })
  @ApiQuery({ name: 'id', description: '资源ID', required: true })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({ status: 201, description: '复制成功', type: Object })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  @HttpCode(HttpStatus.CREATED)
  async duplicate(@Query('id') id: string, @Body() duplicateRequest: DuplicateResourceRequest) {
    this.assertNotEmpty(id, '资源ID')
    const result = await this.resourceTreeService.duplicateResource(id, duplicateRequest.parentId, duplicateRequest.newName)
    return this.created({
      data: result
    })
  }

  /**
   * 删除资源
   */
  @Post('remove')
  @ApiOperation({ summary: '删除资源', description: '删除指定资源' })
  @ApiQuery({ name: 'id', description: '资源ID', required: true })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  @HttpCode(HttpStatus.OK)
  async remove(@Query('id') id: string) {
    this.assertNotEmpty(id, '资源ID')
    await this.resourceService.remove(id)
    return this.success({
      message: '删除成功'
    })
  }

  /**
   * 批量删除资源
   */
  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除资源', description: '批量删除多个资源' })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMany(@Body() batchDeleteRequest: BatchDeleteResourcesRequest) {
    this.assertNotEmpty(batchDeleteRequest.ids, '资源ID列表')
    await this.resourceService.removeMany(batchDeleteRequest.ids)
    return this.noContent()
  }

  /**
   * 根据路径获取资源
   */
  @Get('by-path/:path')
  @ApiOperation({ summary: '根据路径获取资源', description: '根据路径获取资源信息' })
  @ApiParam({ name: 'path', description: '资源路径', required: true })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '获取成功', type: Object })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async findByPath(@Param('path') path: string) {
    this.assertNotEmpty(path, '资源路径')
    const result = await this.resourceService.findByPath(path)
    this.assertDataExists(result, '资源', `路径: ${path}`)
    return this.success({
      data: result
    })
  }

  /**
   * 验证树形结构
   */
  @Get('validate/tree')
  @ApiOperation({ summary: '验证树形结构', description: '验证资源树结构的完整性' })
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '验证成功', type: Object })
  @ApiResponse({ status: 400, description: '树形结构存在问题' })
  async validateTree() {
    const result = await this.resourceTreeService.validateTree()
    return this.success(result)
  }
}
