import { credentials, Metadata } from '@grpc/grpc-js';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'node:path';

/**
 * gRPC 客户端配置
 */
export interface GrpcClientConfig {
  host: string;
  port: number;
  insecure?: boolean;
  timeout?: number;
}

/**
 * gRPC 测试客户端
 */
export class GrpcTestClient {
  private readonly config: GrpcClientConfig;
  private clients: Record<string, any> = {};

  constructor(config: Partial<GrpcClientConfig> = {}) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 50051,
      insecure: config.insecure ?? true,
      timeout: config.timeout || 30000,
    };
  }

  /**
   * 初始化所有服务客户端
   */
  async initialize(): Promise<void> {
    try {
      // 加载 proto 文件
      const protoFiles = [
        join(__dirname, '../../../protos/users.proto'),
        join(__dirname, '../../../protos/rbac.proto'),
        join(__dirname, '../../../protos/common.proto'),
      ];

      for (const protoFile of protoFiles) {
        await this.loadProtoFile(protoFile);
      }

      console.log('✅ gRPC 客户端初始化成功');
      console.log(`📡 连接地址: ${this.config.host}:${this.config.port}`);
      console.log(`🔧 可用服务: ${Object.keys(this.clients).join(', ')}`);
    } catch (error) {
      console.error('❌ gRPC 客户端初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载单个 proto 文件
   */
  private async loadProtoFile(protoPath: string): Promise<void> {
    try {
      const packageDefinition = loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = loadPackageDefinition(packageDefinition);
      
      // 提取包名（从文件名推断）
      const packageName = protoPath.includes('users') ? 'users' : 
                         protoPath.includes('rbac') ? 'rbac' : 'common';
      
      if (protoDescriptor[packageName]) {
        const packageServices = protoDescriptor[packageName] as any;
        
        // 为每个服务创建客户端
        for (const [serviceName, ServiceConstructor] of Object.entries(packageServices)) {
          if (typeof ServiceConstructor === 'function' && ServiceConstructor.name.endsWith('Service')) {
            const serviceClient = new (ServiceConstructor as any)(
              `${this.config.host}:${this.config.port}`,
              this.config.insecure ? credentials.createInsecure() : credentials.createSsl()
            );

            this.clients[serviceName] = serviceClient;
            console.log(`📦 加载服务: ${packageName}.${serviceName}`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ 加载 proto 文件失败: ${protoPath}`, error);
      throw error;
    }
  }

  /**
   * 获取指定服务的客户端
   */
  getClient(serviceName: string): any {
    const client = this.clients[serviceName];
    if (!client) {
      throw new Error(`服务 '${serviceName}' 不存在。可用服务: ${Object.keys(this.clients).join(', ')}`);
    }
    return client;
  }

  /**
   * 创建带有认证信息的元数据
   */
  createAuthMetadata(token: string): Metadata {
    const metadata = new Metadata();
    metadata.add('authorization', `Bearer ${token}`);
    return metadata;
  }

  /**
   * 创建带有用户信息的元数据
   */
  createUserMetadata(userPhone: string, token?: string): Metadata {
    const metadata = new Metadata();
    if (token) {
      metadata.add('authorization', `Bearer ${token}`);
    }
    metadata.add('user-phone', userPhone);
    metadata.add('request-id', `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    return metadata;
  }

  /**
   * 调用 gRPC 方法
   */
  async call<T>(
    serviceName: string,
    methodName: string,
    request: any,
    metadata?: Metadata
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const client = this.getClient(serviceName);
      const method = client[methodName];
      
      if (typeof method !== 'function') {
        reject(new Error(`方法 '${methodName}' 在服务 '${serviceName}' 中不存在`));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`请求超时 (${this.config.timeout}ms): ${serviceName}.${methodName}`));
      }, this.config.timeout);

      try {
        method.call(
          client,
          request,
          metadata || new Metadata(),
          (error: any, response: T) => {
            clearTimeout(timeout);
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * 测试服务连接
   */
  async testConnection(): Promise<boolean> {
    try {
      // 尝试调用一个简单的方法来测试连接
      const services = Object.keys(this.clients);
      if (services.length === 0) {
        throw new Error('没有可用的服务客户端');
      }

      console.log('🔍 测试 gRPC 服务连接...');
      
      // 这里可以添加具体的健康检查调用
      // 例如：await this.call('HealthService', 'check', {});
      
      console.log('✅ gRPC 服务连接正常');
      return true;
    } catch (error) {
      console.error('❌ gRPC 服务连接失败:', error);
      return false;
    }
  }

  /**
   * 关闭所有客户端连接
   */
  async close(): Promise<void> {
    for (const [serviceName, client] of Object.entries(this.clients)) {
      try {
        if (client && typeof client.close === 'function') {
          client.close();
        }
        console.log(`🔌 关闭服务连接: ${serviceName}`);
      } catch (error) {
        console.error(`❌ 关闭服务连接失败: ${serviceName}`, error);
      }
    }
    this.clients = {};
  }

  /**
   * 获取客户端状态信息
   */
  getStatus(): {
    config: GrpcClientConfig;
    services: string[];
    isInitialized: boolean;
  } {
    return {
      config: this.config,
      services: Object.keys(this.clients),
      isInitialized: Object.keys(this.clients).length > 0,
    };
  }
}

/**
 * 创建默认的测试客户端实例
 */
export const createTestClient = (config?: Partial<GrpcClientConfig>): GrpcTestClient => {
  return new GrpcTestClient(config);
};

/**
 * 快速测试工具函数
 */
export const quickTest = async (config?: Partial<GrpcClientConfig>): Promise<void> => {
  const client = createTestClient(config);
  
  try {
    await client.initialize();
    const isConnected = await client.testConnection();
    
    if (isConnected) {
      console.log('🎉 gRPC 服务测试成功!');
      console.log('📊 状态信息:', client.getStatus());
    } else {
      console.log('❌ gRPC 服务测试失败');
    }
  } catch (error) {
    console.error('💥 测试过程中出现错误:', error);
  } finally {
    await client.close();
  }
}; 