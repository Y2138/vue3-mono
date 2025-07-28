import { Metadata } from '@grpc/grpc-js';

/**
 * 从元数据中提取认证 token
 */
export function extractAuthToken(metadata: Metadata): string | null {
  const authValue = metadata.get('authorization')[0];
  if (typeof authValue === 'string' && authValue.startsWith('Bearer ')) {
    return authValue.substring(7);
  }
  return null;
}

/**
 * 从元数据中提取用户信息
 */
export function extractUserInfo(metadata: Metadata): { userId?: string; userPhone?: string } {
  const userId = metadata.get('user-id')[0];
  const userPhone = metadata.get('user-phone')[0];
  
  return {
    userId: typeof userId === 'string' ? userId : undefined,
    userPhone: typeof userPhone === 'string' ? userPhone : undefined,
  };
}

/**
 * 创建带有认证信息的元数据
 */
export function createAuthMetadata(token: string): Metadata {
  const metadata = new Metadata();
  metadata.add('authorization', `Bearer ${token}`);
  return metadata;
}

/**
 * 创建带有用户信息的元数据
 */
export function createUserMetadata(userId: string, userPhone: string): Metadata {
  const metadata = new Metadata();
  metadata.add('user-id', userId);
  metadata.add('user-phone', userPhone);
  return metadata;
}

/**
 * 从元数据中提取请求 ID（用于链路追踪）
 */
export function extractRequestId(metadata: Metadata): string | null {
  const requestId = metadata.get('request-id')[0];
  return typeof requestId === 'string' ? requestId : null;
}

/**
 * 添加请求 ID 到元数据
 */
export function addRequestId(metadata: Metadata, requestId: string): void {
  metadata.add('request-id', requestId);
}

/**
 * 将 HTTP 请求头转换为 gRPC 元数据
 */
export function fromHttpHeaders(headers: Record<string, string>): Metadata {
  const metadata = new Metadata();
  
  // 转换常见的请求头
  if (headers.authorization) {
    metadata.add('authorization', headers.authorization);
  }
  
  if (headers['user-agent']) {
    metadata.add('user-agent', headers['user-agent']);
  }
  
  if (headers['x-request-id']) {
    metadata.add('request-id', headers['x-request-id']);
  }
  
  return metadata;
}

/**
 * 将 gRPC 元数据转换为 HTTP 响应头
 */
export function toHttpHeaders(metadata: Metadata): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // 提取常见的响应头
  const requestId = extractRequestId(metadata);
  if (requestId) {
    headers['x-request-id'] = requestId;
  }
  
  return headers;
} 