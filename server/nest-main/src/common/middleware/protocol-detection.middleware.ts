import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 协议类型枚举
 */
export enum ProtocolType {
  GRPC = 'grpc',
  HTTP = 'http',
  UNKNOWN = 'unknown',
}

/**
 * 扩展 Request 接口，添加协议信息
 */
declare global {
  namespace Express {
    interface Request {
      protocol_type?: ProtocolType;
      protocol_metadata?: {
        contentType: string;
        userAgent: string;
        headers: Record<string, string>;
        detectedAt: Date;
      };
    }
  }
}

/**
 * 协议检测中间件
 * 识别请求是 gRPC 还是 HTTP，并将信息添加到请求上下文
 */
@Injectable()
export class ProtocolDetectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProtocolDetectionMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const protocolInfo = this.detectProtocol(req);
    
    // 将协议信息添加到请求对象
    req.protocol_type = protocolInfo.type;
    req.protocol_metadata = protocolInfo.metadata;

    // 记录协议检测结果
    if (process.env.ENABLE_PROTOCOL_LOGGING === 'true') {
      this.logger.debug(
        `Protocol detected: ${protocolInfo.type} for ${req.method} ${req.url}`
      );
    }

    // 添加响应头标识协议类型
    res.setHeader('X-Protocol-Detected', protocolInfo.type);

    next();
  }

  /**
   * 检测请求协议类型
   */
  private detectProtocol(req: Request): {
    type: ProtocolType;
    metadata: {
      contentType: string;
      userAgent: string;
      headers: Record<string, string>;
      detectedAt: Date;
    };
  } {
    const contentType = req.headers['content-type'] || '';
    const userAgent = req.headers['user-agent'] || '';
    const grpcEncoding = req.headers['grpc-encoding'];
    const grpcAcceptEncoding = req.headers['grpc-accept-encoding'];

    // gRPC 协议检测规则
    const isGrpc = this.isGrpcRequest(contentType, userAgent, grpcEncoding, grpcAcceptEncoding);

    const metadata = {
      contentType,
      userAgent,
      headers: this.extractRelevantHeaders(req),
      detectedAt: new Date(),
    };

    return {
      type: isGrpc ? ProtocolType.GRPC : ProtocolType.HTTP,
      metadata,
    };
  }

  /**
   * 判断是否为 gRPC 请求
   */
  private isGrpcRequest(
    contentType: string,
    userAgent: string,
    grpcEncoding: any,
    grpcAcceptEncoding: any
  ): boolean {
    // 1. Content-Type 检测
    if (contentType.includes('application/grpc')) {
      return true;
    }

    // 2. gRPC 特定头部检测
    if (grpcEncoding || grpcAcceptEncoding) {
      return true;
    }

    // 3. User-Agent 检测（gRPC 客户端通常包含特定标识）
    if (userAgent.includes('grpc')) {
      return true;
    }

    // 4. HTTP/2 + 特定路径检测（gRPC 通常使用 HTTP/2）
    // 注意：这里需要根据实际的 gRPC 服务路径进行调整
    // if (path.startsWith('/grpc/') || path.includes('.proto')) {
    //   return true;
    // }

    return false;
  }

  /**
   * 提取相关的请求头信息
   */
  private extractRelevantHeaders(req: Request): Record<string, string> {
    const relevantHeaders = [
      'content-type',
      'user-agent',
      'authorization',
      'x-request-id',
      'grpc-encoding',
      'grpc-accept-encoding',
      'grpc-timeout',
      'grpc-metadata',
    ];

    const headers: Record<string, string> = {};
    
    relevantHeaders.forEach(header => {
      const value = req.headers[header];
      if (value) {
        headers[header] = Array.isArray(value) ? value.join(', ') : value;
      }
    });

    return headers;
  }
}

/**
 * 从请求中获取协议类型
 */
export function getProtocolType(req: Request): ProtocolType {
  return req.protocol_type || ProtocolType.UNKNOWN;
}

/**
 * 检查是否为 gRPC 请求
 */
export function isGrpcRequest(req: Request): boolean {
  return getProtocolType(req) === ProtocolType.GRPC;
}

/**
 * 检查是否为 HTTP 请求
 */
export function isHttpRequest(req: Request): boolean {
  return getProtocolType(req) === ProtocolType.HTTP;
}

/**
 * 获取协议元数据
 */
export function getProtocolMetadata(req: Request) {
  return req.protocol_metadata;
}

/**
 * 创建协议上下文信息
 */
export function createProtocolContext(req: Request) {
  return {
    type: getProtocolType(req),
    metadata: getProtocolMetadata(req),
    isGrpc: isGrpcRequest(req),
    isHttp: isHttpRequest(req),
  };
}

/**
 * 协议检测工具函数聚合对象
 */
export const ProtocolDetectionUtils = {
  getProtocolType,
  isGrpcRequest,
  isHttpRequest,
  getProtocolMetadata,
  createProtocolContext,
}; 