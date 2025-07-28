import { SetMetadata } from '@nestjs/common';

/**
 * 公开访问装饰器
 * 标记不需要认证的端点
 */
export const Public = () => SetMetadata('isPublic', true); 