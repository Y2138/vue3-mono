// 协议配置导出
export {
  ProtocolConfigService,
  ProtocolPriority,
  type ProtocolConfiguration,
} from './protocol-config';

// 中间件导出
export {
  ProtocolDetectionMiddleware,
  ProtocolType,
  getProtocolType,
  isGrpcRequest,
  isHttpRequest,
  getProtocolMetadata,
  createProtocolContext,
  CommonMiddleware,
} from '../middleware';

// 响应模块导出
export {
  ResponseModule,
  ResponseFormatter,
  ResponseInterceptor,
  defaultResponseFormatter,
  type UnifiedResponse,
  type PaginatedResponse,
  type ErrorResponse,
} from '../response';

// 降级模块导出
export {
  FallbackModule,
  ProtocolFallbackService,
  FallbackStrategy,
  ServiceStatus,
  type FallbackConfig,
} from '../fallback';

// gRPC 基础设施导出
export {
  GrpcInfrastructure,
  BaseGrpcService,
  GrpcException,
  mapNestExceptionToGrpc,
} from '../grpc';

// 数据转换器导出
export {
  Transformers,
  UserTransformer,
  RbacTransformers,
  CommonTransformers,
} from '../transformers';

// 测试工具导出
export {
  GrpcTestTools,
  GrpcTestClient,
  createTestClient,
  quickTest,
} from '../../utils/grpc-client';

// 协议模块聚合对象
import { ProtocolConfigService } from './protocol-config';
import { CommonMiddleware } from '../middleware';
import { ResponseModule } from '../response';
import { FallbackModule } from '../fallback';
import { GrpcInfrastructure } from '../grpc';

export const ProtocolsModule = {
  Config: ProtocolConfigService,
  Middleware: CommonMiddleware,
  Response: ResponseModule,
  Fallback: FallbackModule,
  Grpc: GrpcInfrastructure,
}; 