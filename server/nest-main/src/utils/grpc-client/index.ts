// gRPC 测试客户端导出
export { 
  GrpcTestClient, 
  createTestClient, 
  quickTest,
  type GrpcClientConfig 
} from './grpc-test-client';

// 连接测试工具导出
export { 
  detailedConnectionTest, 
  simpleHealthCheck, 
  batchConnectionTest 
} from './connection-test';

// 便捷的导出对象
export const GrpcTestTools = {
  // 客户端相关
  createClient: (config?: any) => import('./grpc-test-client').then(m => m.createTestClient(config)),
  quickTest: (config?: any) => import('./grpc-test-client').then(m => m.quickTest(config)),
  
  // 测试相关
  detailedTest: () => import('./connection-test').then(m => m.detailedConnectionTest()),
  healthCheck: () => import('./connection-test').then(m => m.simpleHealthCheck()),
  batchTest: () => import('./connection-test').then(m => m.batchConnectionTest()),
}; 