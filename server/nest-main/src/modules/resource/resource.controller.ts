import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiConsumes, ApiProduces, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Public } from '@/common/decorators/public.decorator'
import { RESOURCE_ENUMS } from '@/modules/resource/enums/resource.enums'
import { ResourceService } from '@/modules/resource/services/resource.service'
import { ResourceTreeService } from '@/modules/resource/services/resource-tree.service'
import { BaseController } from '@/common/controllers/base.controller'
import { Resource, CreateResourceRequest, UpdateResourceRequest, GetResourcesRequest } from '@/shared/resource'
import { isNotEmpty } from '@/utils'
import { QueryObjectPipe } from '@/common/pipes/query.pipe'
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
  async list(@Query(QueryObjectPipe) getResourcesRequest: GetResourcesRequest) {
    const { type, name, path, isActive, pagination } = getResourcesRequest
    const result = await this.resourceService.findAll(isNotEmpty(type) ? Number(type) : undefined, name, path, isNotEmpty(isActive) ? Number(isActive) : undefined, pagination)
    const data: Resource[] = result.data.map((item) => ({
      ...item,
      createdAt: this.formatDateTime(item.createdAt),
      updatedAt: this.formatDateTime(item.updatedAt)
    }))
    return this.paginated(data, {
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
    this.logger.log(`获取资源详情，ID: ${JSON.stringify(id)}`)
    const result = await this.resourceService.findOne(id)
    this.assertDataExists(result, '资源', id)
    return this.success(result)
  }

  /**
   * 更新资源
   */
  @Post('update')
  @ApiOperation({ summary: '更新资源', description: '更新指定资源信息' })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '更新成功', type: Object })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  async update(@Body() updateResourceRequest: UpdateResourceRequest) {
    this.assertNotEmpty(updateResourceRequest.id, '资源ID')
    const result = await this.resourceService.update(updateResourceRequest.id, updateResourceRequest)
    return this.success({
      data: result
    })
  }

  /**
   * 删除资源
   */
  @Post('delete')
  @ApiOperation({ summary: '删除资源', description: '删除指定资源' })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '资源不存在' })
  @HttpCode(HttpStatus.OK)
  async delete(@Body() body: { id: string }) {
    this.assertNotEmpty(body.id, '资源ID')
    await this.resourceService.remove(body.id)
    return this.success({
      message: '删除成功'
    })
  }
}
