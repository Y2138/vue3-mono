import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

/**
 * 日志级别枚举
 */
export enum CustomLogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  requestId?: string;
  userId?: string;
  protocol?: 'http' | 'grpc';
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * 统一日志服务
 * 提供结构化日志记录和多种输出格式
 */
@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logLevel: LogLevel[];
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // 根据环境设置日志级别
    const envLogLevel = process.env.LOG_LEVEL || 'info';
    this.logLevel = this.getLogLevels(envLogLevel);
  }

  /**
   * 记录错误日志
   */
  error(message: any, trace?: string, context?: string) {
    this.writeLog('error', message, context, { trace });
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: string) {
    this.writeLog('warn', message, context);
  }

  /**
   * 记录信息日志
   */
  log(message: any, context?: string) {
    this.writeLog('info', message, context);
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: string) {
    this.writeLog('debug', message, context);
  }

  /**
   * 记录详细日志
   */
  verbose(message: any, context?: string) {
    this.writeLog('verbose', message, context);
  }

  /**
   * 记录结构化日志
   */
  private writeLog(level: string, message: any, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(level as LogLevel)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      context,
      ...metadata,
    };

    // 输出日志
    this.output(logEntry);
  }

  /**
   * 记录请求日志
   */
  logRequest(
    method: string,
    path: string,
    protocol: 'http' | 'grpc',
    statusCode?: number,
    responseTime?: number,
    requestId?: string,
    userId?: string,
    error?: Error
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: error ? 'error' : 'info',
      message: `${protocol.toUpperCase()} ${method} ${path}`,
      context: 'RequestLogger',
      requestId,
      userId,
      protocol,
      method,
      path,
      statusCode,
      responseTime,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    this.output(logEntry);
  }

  /**
   * 记录数据库操作日志
   */
  logDatabase(
    operation: string,
    table: string,
    duration: number,
    rowCount?: number,
    error?: Error,
    context = 'DatabaseLogger'
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: error ? 'error' : duration > 1000 ? 'warn' : 'debug',
      message: `DB ${operation.toUpperCase()} ${table}`,
      context,
      metadata: {
        operation,
        table,
        duration,
        rowCount,
      },
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    this.output(logEntry);
  }

  /**
   * 记录缓存操作日志
   */
  logCache(
    operation: 'hit' | 'miss' | 'set' | 'del',
    key: string,
    ttl?: number,
    context = 'CacheLogger'
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message: `Cache ${operation.toUpperCase()} ${key}`,
      context,
      metadata: {
        operation,
        key,
        ttl,
      },
    };

    this.output(logEntry);
  }

  /**
   * 记录安全事件日志
   */
  logSecurity(
    event: string,
    details: Record<string, any>,
    level: 'info' | 'warn' | 'error' = 'warn',
    context = 'SecurityLogger'
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `Security Event: ${event}`,
      context,
      metadata: {
        event,
        ...details,
      },
    };

    this.output(logEntry);
  }

  /**
   * 输出日志
   */
  private output(logEntry: LogEntry) {
    if (this.isProduction) {
      // 生产环境输出 JSON 格式日志
      console.log(JSON.stringify(logEntry));
    } else {
      // 开发环境输出格式化日志
      this.outputFormatted(logEntry);
    }
  }

  /**
   * 输出格式化日志（开发环境）
   */
  private outputFormatted(logEntry: LogEntry) {
    const { timestamp, level, message, context, requestId, responseTime } = logEntry;
    
    // 选择颜色
    const color = this.getColorForLevel(level);
    const levelText = level.toUpperCase().padEnd(7);
    
    // 构建日志行
    let logLine = `${this.colorize(timestamp, '90')} ${this.colorize(levelText, color)}`;
    
    if (context) {
      logLine += ` ${this.colorize(`[${context}]`, '33')}`;
    }
    
    if (requestId) {
      logLine += ` ${this.colorize(`{${requestId.slice(0, 8)}}`, '36')}`;
    }
    
    logLine += ` ${message}`;
    
    if (responseTime) {
      const timeColor = responseTime > 1000 ? '31' : responseTime > 500 ? '33' : '32';
      logLine += ` ${this.colorize(`(${responseTime}ms)`, timeColor)}`;
    }

    console.log(logLine);

    // 输出错误堆栈
    if (logEntry.error?.stack && this.isDevelopment) {
      console.log(this.colorize(logEntry.error.stack, '90'));
    }

    // 输出元数据（调试模式）
    if (logEntry.metadata && level === 'debug' && this.isDevelopment) {
      console.log(this.colorize(JSON.stringify(logEntry.metadata, null, 2), '90'));
    }
  }

  /**
   * 为文本添加颜色
   */
  private colorize(text: string, colorCode: string): string {
    if (this.isProduction) {
      return text;
    }
    return `\x1b[${colorCode}m${text}\x1b[0m`;
  }

  /**
   * 获取日志级别对应的颜色
   */
  private getColorForLevel(level: string): string {
    switch (level) {
      case 'error': return '31'; // 红色
      case 'warn': return '33';  // 黄色
      case 'info': return '32';  // 绿色
      case 'debug': return '36'; // 青色
      case 'verbose': return '35'; // 紫色
      default: return '37';      // 白色
    }
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return this.logLevel.includes(level);
  }

  /**
   * 根据环境获取日志级别
   */
  private getLogLevels(envLogLevel: string): LogLevel[] {
    const levels: Record<string, LogLevel[]> = {
      error: ['error'],
      warn: ['error', 'warn'],
      info: ['error', 'warn', 'log'],
      debug: ['error', 'warn', 'log', 'debug'],
      verbose: ['error', 'warn', 'log', 'debug', 'verbose'],
    };

    return levels[envLogLevel] || levels.info;
  }

  /**
   * 设置请求上下文
   */
  setRequestContext(requestId: string, userId?: string) {
    // 这里可以实现请求上下文存储
    // 例如使用 AsyncLocalStorage 或类似机制
  }

  /**
   * 清除请求上下文
   */
  clearRequestContext() {
    // 清除请求上下文
  }
} 