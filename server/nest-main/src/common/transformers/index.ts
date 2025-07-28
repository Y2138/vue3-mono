// 通用转换器导出
export { 
  CommonTransformers,
  TimestampTransformer,
  PaginationTransformer,
  ResponseStatusTransformer,
  ArrayTransformer,
  StringTransformer,
  NumberTransformer
} from './common.transformer';

// 用户转换器导出
export { UserTransformer } from './user.transformer';

// RBAC 转换器导出
export { 
  RbacTransformers,
  PermissionTransformer,
  RoleTransformer,
  RbacTransformer
} from './rbac.transformer';

// 重新导出所有转换器的聚合对象
import { CommonTransformers } from './common.transformer';
import { UserTransformer } from './user.transformer';
import { RbacTransformers } from './rbac.transformer';

export const Transformers = {
  common: CommonTransformers,
  user: UserTransformer,
  rbac: RbacTransformers,
};

// 类型导出，用于其他模块的类型推断
export type TransformerMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
}; 