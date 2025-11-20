// src/pipes/query-object.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import * as qs from 'qs'

@Injectable()
export class QueryObjectPipe implements PipeTransform {
  transform(value: any) {
    try {
      // 将查询字符串解析为对象
      const parsed = qs.parse(value, { allowDots: true, depth: 10 })
      // 转换分页字段
      return this.convertPaginationFields(parsed)
    } catch {
      throw new BadRequestException('Invalid query parameters')
    }
  }

  private convertPaginationFields(obj: any): any {
    // 确保 pagination 对象存在
    if (obj.pagination) {
      // 转换 page 和 pageSize
      if (obj.pagination.page) {
        obj.pagination.page = this.convertToNumber(obj.pagination.page)
      }

      if (obj.pagination.pageSize) {
        obj.pagination.pageSize = this.convertToNumber(obj.pagination.pageSize)
      }
    }

    return obj
  }

  private convertToNumber(value: any): number | any {
    if (typeof value === 'string') {
      const num = Number(value)
      return isNaN(num) ? value : num
    }
    return value
  }
}
