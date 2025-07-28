import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProtocolType } from '../middleware/protocol-detection.middleware';
import { FallbackStrategy, type FallbackConfig } from '../fallback/protocol-fallback.service';
import { type ResponseFormatterConfig } from '../response/response-types';

/**
 * 协议优先级枚举
 */
export enum ProtocolPriority {
  /** 优先使用 gRPC */
  GRPC_FIRST = 'grpc_first',
  /** 优先使用 HTTP */
  HTTP_FIRST = 'http_first',
  /** 自动选择 */
  AUTO = 'auto',
}

/**
 * 协议配置接口
 */
export interface ProtocolConfiguration {
  /** 默认协议 */
  defaultProtocol: ProtocolType;
  /** 协议优先级 */
  priority: ProtocolPriority;
  /** 是否启用协议检测 */
  enableDetection: boolean;
  /** gRPC 配置 */
  grpc: {
    /** 端口 */
    port: number;
    /** 主机 */
    host: string;
    /** 是否启用 */
    enabled: boolean;
    /** 最大消息长度 */
    maxMessageLength: number;
    /** 超时时间 */
    timeout: number;
  };
  /** HTTP 配置 */
  http: {
    /** 端口 */
    port: number;
    /** 主机 */
    host: string;
    /** 是否启用 */
    enabled: boolean;
    /** 超时时间 */
    timeout: number;
  };
  /** 降级配置 */
  fallback: FallbackConfig;
  /** 响应格式化配置 */
  responseFormatter: ResponseFormatterConfig;
  /** 是否启用协议日志 */
  enableProtocolLogging: boolean;
  /** 是否启用性能监控 */
  enableMetrics: boolean;
}

/**
 * 协议配置服务
 * 统一管理双协议的配置参数
 */
@Injectable()
export class ProtocolConfigService {
  private readonly logger = new Logger(ProtocolConfigService.name);
  private readonly configuration: ProtocolConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.configuration = this.loadConfiguration();
    this.validateConfiguration();
    this.logger.log('Protocol configuration loaded successfully');
  }

  /**
   * 获取完整配置
   */
  getConfiguration(): ProtocolConfiguration {
    return { ...this.configuration };
  }

  /**
   * 获取默认协议
   */
  getDefaultProtocol(): ProtocolType {
    return this.configuration.defaultProtocol;
  }

  /**
   * 获取协议优先级
   */
  getProtocolPriority(): ProtocolPriority {
    return this.configuration.priority;
  }

  /**
   * 获取 gRPC 配置
   */
  getGrpcConfig() {
    return { ...this.configuration.grpc };
  }

  /**
   * 获取 HTTP 配置
   */
  getHttpConfig() {
    return { ...this.configuration.http };
  }

  /**
   * 获取降级配置
   */
  getFallbackConfig(): FallbackConfig {
    return { ...this.configuration.fallback };
  }

  /**
   * 获取响应格式化配置
   */
  getResponseFormatterConfig(): ResponseFormatterConfig {
    return { ...this.configuration.responseFormatter };
  }

  /**
   * 检查是否启用协议检测
   */
  isDetectionEnabled(): boolean {
    return this.configuration.enableDetection;
  }

  /**
   * 检查是否启用协议日志
   */
  isProtocolLoggingEnabled(): boolean {
    return this.configuration.enableProtocolLogging;
  }

  /**
   * 检查是否启用性能监控
   */
  isMetricsEnabled(): boolean {
    return this.configuration.enableMetrics;
  }

  /**
   * 检查指定协议是否启用
   */
  isProtocolEnabled(protocol: ProtocolType): boolean {
    switch (protocol) {
      case ProtocolType.GRPC:
        return this.configuration.grpc.enabled;
      case ProtocolType.HTTP:
        return this.configuration.http.enabled;
      default:
        return false;
    }
  }

  /**
   * 获取协议端口
   */
  getProtocolPort(protocol: ProtocolType): number {
    switch (protocol) {
      case ProtocolType.GRPC:
        return this.configuration.grpc.port;
      case ProtocolType.HTTP:
        return this.configuration.http.port;
      default:
        throw new Error(`Unknown protocol: ${protocol}`);
    }
  }

  /**
   * 获取协议主机
   */
  getProtocolHost(protocol: ProtocolType): string {
    switch (protocol) {
      case ProtocolType.GRPC:
        return this.configuration.grpc.host;
      case ProtocolType.HTTP:
        return this.configuration.http.host;
      default:
        throw new Error(`Unknown protocol: ${protocol}`);
    }
  }

  /**
   * 获取协议超时时间
   */
  getProtocolTimeout(protocol: ProtocolType): number {
    switch (protocol) {
      case ProtocolType.GRPC:
        return this.configuration.grpc.timeout;
      case ProtocolType.HTTP:
        return this.configuration.http.timeout;
      default:
        throw new Error(`Unknown protocol: ${protocol}`);
    }
  }

  /**
   * 根据优先级选择协议
   */
  selectProtocol(requestedProtocol?: ProtocolType): ProtocolType {
    // 如果明确指定了协议，检查是否启用
    if (requestedProtocol && this.isProtocolEnabled(requestedProtocol)) {
      return requestedProtocol;
    }

    // 根据优先级策略选择
    switch (this.configuration.priority) {
      case ProtocolPriority.GRPC_FIRST:
        return this.configuration.grpc.enabled ? ProtocolType.GRPC : ProtocolType.HTTP;
      
      case ProtocolPriority.HTTP_FIRST:
        return this.configuration.http.enabled ? ProtocolType.HTTP : ProtocolType.GRPC;
      
      case ProtocolPriority.AUTO:
        // 自动选择：如果都启用，使用默认协议
        if (this.configuration.grpc.enabled && this.configuration.http.enabled) {
          return this.configuration.defaultProtocol;
        }
        // 否则使用可用的协议
        return this.configuration.grpc.enabled ? ProtocolType.GRPC : ProtocolType.HTTP;
      
      default:
        return this.configuration.defaultProtocol;
    }
  }

  /**
   * 更新配置
   */
  updateConfiguration(updates: Partial<ProtocolConfiguration>): void {
    Object.assign(this.configuration, updates);
    this.validateConfiguration();
    this.logger.log('Protocol configuration updated');
  }

  /**
   * 加载配置
   */
  private loadConfiguration(): ProtocolConfiguration {
    return {
      defaultProtocol: this.parseProtocolType(
        this.configService.get('PROTOCOL_DEFAULT', 'grpc')
      ),
      priority: this.parseProtocolPriority(
        this.configService.get('PROTOCOL_PRIORITY', 'grpc_first')
      ),
      enableDetection: this.configService.get('PROTOCOL_DETECTION_ENABLED', 'true') === 'true',
      
      grpc: {
        port: this.configService.get('GRPC_PORT', 50051),
        host: this.configService.get('GRPC_HOST', 'localhost'),
        enabled: this.configService.get('GRPC_ENABLED', 'true') === 'true',
        maxMessageLength: this.configService.get('GRPC_MAX_MESSAGE_LENGTH', 4194304),
        timeout: this.configService.get('GRPC_TIMEOUT', 30000),
      },
      
      http: {
        port: this.configService.get('APP_PORT', 3000),
        host: this.configService.get('APP_HOST', 'localhost'),
        enabled: this.configService.get('HTTP_ENABLED', 'true') === 'true',
        timeout: this.configService.get('HTTP_TIMEOUT', 30000),
      },
      
      fallback: {
        strategy: this.parseFallbackStrategy(
          this.configService.get('FALLBACK_STRATEGY', 'auto')
        ),
        enabled: this.configService.get('FALLBACK_ENABLED', 'true') === 'true',
        failureThreshold: this.configService.get('FALLBACK_FAILURE_THRESHOLD', 3),
        recoveryThreshold: this.configService.get('FALLBACK_RECOVERY_THRESHOLD', 2),
        fallbackTimeout: this.configService.get('FALLBACK_TIMEOUT', 5000),
        retryInterval: this.configService.get('FALLBACK_RETRY_INTERVAL', 30000),
        maxRetries: this.configService.get('FALLBACK_MAX_RETRIES', 5),
      },
      
      responseFormatter: {
        includeStackInProduction: this.configService.get('RESPONSE_INCLUDE_STACK_PROD', 'false') === 'true',
        includeExecutionTime: this.configService.get('RESPONSE_INCLUDE_EXECUTION_TIME', 'true') === 'true',
        includeProtocolInfo: this.configService.get('RESPONSE_INCLUDE_PROTOCOL_INFO', 'true') === 'true',
      },
      
      enableProtocolLogging: this.configService.get('ENABLE_PROTOCOL_LOGGING', 'false') === 'true',
      enableMetrics: this.configService.get('ENABLE_METRICS', 'false') === 'true',
    };
  }

  /**
   * 解析协议类型
   */
  private parseProtocolType(value: string): ProtocolType {
    switch (value.toLowerCase()) {
      case 'grpc':
        return ProtocolType.GRPC;
      case 'http':
        return ProtocolType.HTTP;
      default:
        this.logger.warn(`Unknown protocol type: ${value}, defaulting to gRPC`);
        return ProtocolType.GRPC;
    }
  }

  /**
   * 解析协议优先级
   */
  private parseProtocolPriority(value: string): ProtocolPriority {
    switch (value.toLowerCase()) {
      case 'grpc_first':
        return ProtocolPriority.GRPC_FIRST;
      case 'http_first':
        return ProtocolPriority.HTTP_FIRST;
      case 'auto':
        return ProtocolPriority.AUTO;
      default:
        this.logger.warn(`Unknown protocol priority: ${value}, defaulting to grpc_first`);
        return ProtocolPriority.GRPC_FIRST;
    }
  }

  /**
   * 解析降级策略
   */
  private parseFallbackStrategy(value: string): FallbackStrategy {
    switch (value.toLowerCase()) {
      case 'auto':
        return FallbackStrategy.AUTO;
      case 'manual':
        return FallbackStrategy.MANUAL;
      case 'disabled':
        return FallbackStrategy.DISABLED;
      default:
        this.logger.warn(`Unknown fallback strategy: ${value}, defaulting to auto`);
        return FallbackStrategy.AUTO;
    }
  }

  /**
   * 验证配置
   */
  private validateConfiguration(): void {
    const config = this.configuration;

    // 检查至少有一个协议启用
    if (!config.grpc.enabled && !config.http.enabled) {
      throw new Error('At least one protocol (gRPC or HTTP) must be enabled');
    }

    // 检查端口配置
    if (config.grpc.enabled && (config.grpc.port < 1 || config.grpc.port > 65535)) {
      throw new Error('Invalid gRPC port configuration');
    }

    if (config.http.enabled && (config.http.port < 1 || config.http.port > 65535)) {
      throw new Error('Invalid HTTP port configuration');
    }

    // 检查端口冲突
    if (config.grpc.enabled && config.http.enabled && config.grpc.port === config.http.port) {
      throw new Error('gRPC and HTTP cannot use the same port');
    }

    // 检查降级配置
    if (config.fallback.enabled) {
      if (config.fallback.failureThreshold < 1) {
        throw new Error('Fallback failure threshold must be at least 1');
      }
      
      if (config.fallback.recoveryThreshold < 1) {
        throw new Error('Fallback recovery threshold must be at least 1');
      }
    }

    this.logger.debug('Configuration validation passed');
  }
} 