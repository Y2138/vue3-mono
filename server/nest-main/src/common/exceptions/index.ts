/**
 * 异常模块统一导出
 */

// 业务异常类
export { BusinessException, DataNotFoundException, ValidationException, ConflictException, BusinessRuleException } from './business.exception'

// 异常工具类
export { ExceptionUtils } from './exception.utils'

// 重新导出 NestJS 内置异常（保持兼容性）
export { HttpException, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, ConflictException as NestConflictException, InternalServerErrorException } from '@nestjs/common'
