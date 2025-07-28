// gRPC 服务基类导出
export { BaseGrpcService } from './base-grpc.service';

// gRPC 异常处理导出
export { 
  GrpcStatusMapping,
  ExceptionToGrpcStatus,
  GrpcException,
  mapNestExceptionToGrpc,
  type GrpcErrorResponse
} from './grpc-exceptions';

// gRPC 元数据工具导出
export { 
  extractAuthToken,
  extractUserInfo,
  extractRequestId,
  createAuthMetadata,
  createUserMetadata,
  addRequestId,
  fromHttpHeaders,
  toHttpHeaders
} from './grpc-metadata';

// 便捷的导出对象
import { BaseGrpcService } from './base-grpc.service';
import { GrpcException, GrpcStatusMapping, mapNestExceptionToGrpc } from './grpc-exceptions';
import { 
  extractAuthToken, 
  extractUserInfo, 
  extractRequestId,
  createAuthMetadata,
  createUserMetadata,
  addRequestId,
  fromHttpHeaders,
  toHttpHeaders
} from './grpc-metadata';

export const GrpcInfrastructure = {
  BaseService: BaseGrpcService,
  Exception: GrpcException,
  StatusMapping: GrpcStatusMapping,
  mapException: mapNestExceptionToGrpc,
  metadata: {
    extractAuth: extractAuthToken,
    extractUser: extractUserInfo,
    extractRequestId,
    createAuth: createAuthMetadata,
    createUser: createUserMetadata,
    addRequestId,
    fromHttp: fromHttpHeaders,
    toHttp: toHttpHeaders,
  }
}; 