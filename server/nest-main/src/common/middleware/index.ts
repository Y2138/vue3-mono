// 协议检测中间件导出
export { 
  ProtocolDetectionMiddleware,
  ProtocolType,
  getProtocolType,
  isGrpcRequest,
  isHttpRequest,
  getProtocolMetadata,
  createProtocolContext
} from './protocol-detection.middleware';

// 导入用于聚合对象
import { 
  ProtocolDetectionMiddleware,
  ProtocolType,
  ProtocolDetectionUtils
} from './protocol-detection.middleware';

// 中间件聚合对象
export const CommonMiddleware = {
  ProtocolDetection: ProtocolDetectionMiddleware,
  Utils: {
    Protocol: ProtocolDetectionUtils,
  },
  Types: {
    ProtocolType,
  },
}; 