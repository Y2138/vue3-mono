// 协议降级服务导出
export { 
  ProtocolFallbackService,
  FallbackStrategy,
  ServiceStatus,
  type FallbackConfig
} from './protocol-fallback.service';

// 健康检查器导出 - 暂时注释，需要额外依赖
// export { 
//   HealthChecker,
//   HealthStatus,
//   type HealthCheckResult,
//   type HealthCheckConfig,
//   type ServiceInfo
// } from './health-checker';

// 降级模块聚合对象
import { ProtocolFallbackService } from './protocol-fallback.service';

export const FallbackModule = {
  ProtocolFallback: ProtocolFallbackService,
  // HealthChecker: HealthChecker, // 暂时注释，因为依赖问题
}; 