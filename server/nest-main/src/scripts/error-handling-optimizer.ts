import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * 错误处理优化工具
 * 分析和优化项目中的错误处理机制
 */

interface ErrorPattern {
  type: 'missing-try-catch' | 'generic-error' | 'poor-error-message' | 'no-error-logging';
  file: string;
  line?: number;
  description: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

interface ErrorHandlingReport {
  totalFiles: number;
  analyzedFiles: number;
  patterns: ErrorPattern[];
  recommendations: string[];
  score: number;
}

/**
 * 错误处理优化类
 */
export class ErrorHandlingOptimizer {
  private srcDir: string;
  private patterns: ErrorPattern[] = [];

  constructor() {
    this.srcDir = join(process.cwd(), 'src');
  }

  /**
   * 执行错误处理分析和优化
   */
  async optimize(): Promise<void> {
    console.log('🔍 开始错误处理分析和优化...\n');

    await this.analyzeErrorHandling();
    await this.generateErrorCodes();
    await this.createErrorUtils();
    
    const report = this.generateReport();
    this.displayReport(report);
  }

  /**
   * 分析现有错误处理
   */
  private async analyzeErrorHandling(): Promise<void> {
    console.log('📊 分析现有错误处理模式...');

    const files = this.getAllTsFiles(this.srcDir);
    
    for (const file of files) {
      await this.analyzeFile(file);
    }

    console.log(`✅ 已分析 ${files.length} 个文件`);
  }

  /**
   * 获取所有 TypeScript 文件
   */
  private getAllTsFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!existsSync(dir)) {
      return files;
    }

    const fs = require('fs');
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.getAllTsFiles(fullPath));
      } else if (item.endsWith('.ts') && !item.endsWith('.spec.ts') && !item.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 分析单个文件
   */
  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      this.checkTryCatchUsage(filePath, content, lines);
      this.checkErrorMessages(filePath, content, lines);
      this.checkErrorLogging(filePath, content, lines);
      this.checkAsyncErrorHandling(filePath, content, lines);
    } catch (error) {
      console.warn(`无法分析文件 ${filePath}: ${error}`);
    }
  }

  /**
   * 检查 try-catch 使用情况
   */
  private checkTryCatchUsage(filePath: string, content: string, lines: string[]): void {
    // 检查是否有 async 函数缺少错误处理
    const asyncFunctionRegex = /async\s+\w+\s*\([^)]*\)\s*:\s*Promise[^{]*\{/g;
    const tryCatchRegex = /try\s*\{/g;
    
    const asyncMatches = content.match(asyncFunctionRegex) || [];
    const tryCatchMatches = content.match(tryCatchRegex) || [];

    if (asyncMatches.length > 0 && tryCatchMatches.length === 0) {
      this.patterns.push({
        type: 'missing-try-catch',
        file: filePath,
        description: `文件中有 ${asyncMatches.length} 个异步函数但没有错误处理`,
        suggestion: '为异步函数添加 try-catch 错误处理',
        severity: 'high'
      });
    }

    // 检查裸露的 await 调用
    lines.forEach((line, index) => {
      if (line.includes('await ') && !this.isInTryCatch(lines, index)) {
        this.patterns.push({
          type: 'missing-try-catch',
          file: filePath,
          line: index + 1,
          description: '裸露的 await 调用可能导致未处理的异常',
          suggestion: '用 try-catch 包装 await 调用',
          severity: 'medium'
        });
      }
    });
  }

  /**
   * 检查是否在 try-catch 块中
   */
  private isInTryCatch(lines: string[], lineIndex: number): boolean {
    let braceCount = 0;
    let inTry = false;

    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i];
      
      // 计算大括号
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      // 检查 try 关键字
      if (line.includes('try') && line.includes('{')) {
        inTry = true;
      }

      // 如果找到了 try 且在同一个作用域
      if (inTry && braceCount <= 0) {
        return true;
      }

      // 如果超出了函数或类的作用域
      if (braceCount < 0) {
        break;
      }
    }

    return false;
  }

  /**
   * 检查错误消息质量
   */
  private checkErrorMessages(filePath: string, content: string, lines: string[]): void {
    const genericErrorPatterns = [
      /throw new Error\('Error'\)/g,
      /throw new Error\('Something went wrong'\)/g,
      /throw new Error\('Failed'\)/g,
      /console\.log\('error'/g,
    ];

    genericErrorPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        this.patterns.push({
          type: 'poor-error-message',
          file: filePath,
          description: '使用了通用的错误消息',
          suggestion: '提供具体、有意义的错误消息',
          severity: 'medium'
        });
      }
    });

    // 检查是否有错误消息国际化
    lines.forEach((line, index) => {
      if (line.includes('throw new Error') && !line.includes('i18n') && !line.includes('translate')) {
        this.patterns.push({
          type: 'poor-error-message',
          file: filePath,
          line: index + 1,
          description: '错误消息可能需要国际化支持',
          suggestion: '考虑使用国际化错误消息',
          severity: 'low'
        });
      }
    });
  }

  /**
   * 检查错误日志记录
   */
  private checkErrorLogging(filePath: string, content: string, _lines: string[]): void {
    const catchBlocks = content.match(/catch\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
    
    catchBlocks.forEach((block, index) => {
      if (!block.includes('logger') && !block.includes('console.error') && !block.includes('log')) {
        this.patterns.push({
          type: 'no-error-logging',
          file: filePath,
          description: `catch 块 ${index + 1} 没有错误日志记录`,
          suggestion: '在 catch 块中添加错误日志记录',
          severity: 'medium'
        });
      }
    });
  }

  /**
   * 检查异步错误处理
   */
  private checkAsyncErrorHandling(filePath: string, content: string, _lines: string[]): void {
    // 检查 Promise 链是否有 .catch()
    const promiseChains = content.match(/\.\s*then\s*\([^)]*\)/g) || [];
    
    promiseChains.forEach((chain, index) => {
      const startIndex = content.indexOf(chain);
      const followingContent = content.slice(startIndex + chain.length, startIndex + chain.length + 200);
      
      if (!followingContent.includes('.catch(')) {
        this.patterns.push({
          type: 'missing-try-catch',
          file: filePath,
          description: `Promise 链 ${index + 1} 缺少 .catch() 处理`,
          suggestion: '为 Promise 链添加 .catch() 错误处理',
          severity: 'medium'
        });
      }
    });
  }

  /**
   * 生成标准化错误代码
   */
  private async generateErrorCodes(): Promise<void> {
    console.log('🏷️ 生成标准化错误代码...');

    const errorCodes = {
      // 用户相关错误 (1000-1999)
      USER_NOT_FOUND: { code: 1001, message: '用户不存在', httpStatus: 404 },
      USER_ALREADY_EXISTS: { code: 1002, message: '用户已存在', httpStatus: 409 },
      INVALID_CREDENTIALS: { code: 1003, message: '用户名或密码错误', httpStatus: 401 },
      USER_INACTIVE: { code: 1004, message: '用户账户已被停用', httpStatus: 403 },
      
      // 权限相关错误 (2000-2999)
      PERMISSION_DENIED: { code: 2001, message: '权限不足', httpStatus: 403 },
      INVALID_TOKEN: { code: 2002, message: '无效的访问令牌', httpStatus: 401 },
      TOKEN_EXPIRED: { code: 2003, message: '访问令牌已过期', httpStatus: 401 },
      PERMISSION_NOT_FOUND: { code: 2004, message: '权限不存在', httpStatus: 404 },
      ROLE_NOT_FOUND: { code: 2005, message: '角色不存在', httpStatus: 404 },
      
      // 数据验证错误 (3000-3999)
      VALIDATION_ERROR: { code: 3001, message: '数据验证失败', httpStatus: 400 },
      INVALID_PHONE_FORMAT: { code: 3002, message: '手机号格式不正确', httpStatus: 400 },
      INVALID_EMAIL_FORMAT: { code: 3003, message: '邮箱格式不正确', httpStatus: 400 },
      REQUIRED_FIELD_MISSING: { code: 3004, message: '必填字段缺失', httpStatus: 400 },
      
      // 业务逻辑错误 (4000-4999)
      BUSINESS_RULE_VIOLATION: { code: 4001, message: '违反业务规则', httpStatus: 400 },
      OPERATION_NOT_ALLOWED: { code: 4002, message: '操作不被允许', httpStatus: 403 },
      RESOURCE_CONFLICT: { code: 4003, message: '资源冲突', httpStatus: 409 },
      
      // 系统错误 (5000-5999)
      DATABASE_ERROR: { code: 5001, message: '数据库操作失败', httpStatus: 500 },
      EXTERNAL_SERVICE_ERROR: { code: 5002, message: '外部服务调用失败', httpStatus: 502 },
      INTERNAL_SERVER_ERROR: { code: 5003, message: '服务器内部错误', httpStatus: 500 },
    };

    const errorCodesContent = `/**
 * 标准化错误代码定义
 * 自动生成 - 请勿手动修改
 */

export interface ErrorCodeDefinition {
  code: number;
  message: string;
  httpStatus: number;
}

export const ERROR_CODES = ${JSON.stringify(errorCodes, null, 2)} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODES;

/**
 * 获取错误代码信息
 */
export function getErrorCode(key: ErrorCodeKey): ErrorCodeDefinition {
  return ERROR_CODES[key];
}

/**
 * 创建标准化错误
 */
export function createStandardError(key: ErrorCodeKey, details?: string): StandardError {
  const errorDef = ERROR_CODES[key];
  return new StandardError(errorDef.code, errorDef.message, errorDef.httpStatus, details);
}

/**
 * 标准化错误类
 */
export class StandardError extends Error {
  constructor(
    public readonly errorCode: number,
    public readonly errorMessage: string,
    public readonly httpStatus: number,
    public readonly details?: string
  ) {
    super(errorMessage);
    this.name = 'StandardError';
  }

  toJSON() {
    return {
      errorCode: this.errorCode,
      message: this.errorMessage,
      httpStatus: this.httpStatus,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}
`;

    const errorCodesPath = join(this.srcDir, 'common', 'errors', 'error-codes.ts');
    this.ensureDirectoryExists(join(this.srcDir, 'common', 'errors'));
    writeFileSync(errorCodesPath, errorCodesContent);
    console.log(`✅ 错误代码已生成: ${errorCodesPath}`);
  }

  /**
   * 创建错误处理工具
   */
  private async createErrorUtils(): Promise<void> {
    console.log('🛠️ 创建错误处理工具...');

    const errorUtilsContent = `import { Logger } from '@nestjs/common';
import { StandardError, ErrorCodeKey, createStandardError } from './error-codes';

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  /**
   * 安全的异步函数执行
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(\`Operation failed\${context ? \` in \${context}\` : ''}: \${error.message}\`, error.stack);
      return fallback ?? null;
    }
  }

  /**
   * 包装函数添加错误处理
   */
  static withErrorHandling<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorKey: ErrorCodeKey,
    context?: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logger.error(\`Error in \${context || fn.name}: \${error.message}\`, error.stack);
        throw createStandardError(errorKey, error.message);
      }
    };
  }

  /**
   * 验证并抛出标准错误
   */
  static validate(condition: boolean, errorKey: ErrorCodeKey, details?: string): void {
    if (!condition) {
      throw createStandardError(errorKey, details);
    }
  }

  /**
   * 处理 gRPC 错误
   */
  static handleGrpcError(error: any): StandardError {
    if (error instanceof StandardError) {
      return error;
    }

    // 根据 gRPC 状态码映射到标准错误
    const grpcStatus = error.code;
    switch (grpcStatus) {
      case 3: // INVALID_ARGUMENT
        return createStandardError('VALIDATION_ERROR', error.message);
      case 5: // NOT_FOUND
        return createStandardError('USER_NOT_FOUND', error.message);
      case 7: // PERMISSION_DENIED
        return createStandardError('PERMISSION_DENIED', error.message);
      case 16: // UNAUTHENTICATED
        return createStandardError('INVALID_TOKEN', error.message);
      default:
        return createStandardError('INTERNAL_SERVER_ERROR', error.message);
    }
  }

  /**
   * 记录错误并返回用户友好的消息
   */
  static logAndSanitize(error: any, context?: string): { message: string; code?: number } {
    this.logger.error(\`Error\${context ? \` in \${context}\` : ''}: \${error.message}\`, error.stack);

    if (error instanceof StandardError) {
      return {
        message: error.errorMessage,
        code: error.errorCode,
      };
    }

    // 不暴露敏感的系统错误信息
    return {
      message: '系统临时不可用，请稍后重试',
      code: 5003,
    };
  }
}

/**
 * 装饰器：自动错误处理
 */
export function HandleErrors(errorKey: ErrorCodeKey, context?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        ErrorHandler.logAndSanitize(error, context || \`\${target.constructor.name}.\${propertyName}\`);
        throw ErrorHandler.handleGrpcError(error);
      }
    };
  };
}
`;

    const errorUtilsPath = join(this.srcDir, 'common', 'errors', 'error-handler.ts');
    writeFileSync(errorUtilsPath, errorUtilsContent);
    console.log(`✅ 错误处理工具已创建: ${errorUtilsPath}`);

    // 创建索引文件
    const indexContent = `export * from './error-codes';
export * from './error-handler';
`;
    writeFileSync(join(this.srcDir, 'common', 'errors', 'index.ts'), indexContent);
  }

  /**
   * 确保目录存在
   */
  private ensureDirectoryExists(dir: string): void {
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 生成错误处理报告
   */
  private generateReport(): ErrorHandlingReport {
    const totalFiles = this.getAllTsFiles(this.srcDir).length;
    const score = Math.max(0, 100 - (this.patterns.length * 5));

    const recommendations = [
      '使用标准化错误代码和消息',
      '为所有异步操作添加错误处理',
      '在 catch 块中添加适当的日志记录',
      '提供用户友好的错误消息',
      '实施错误监控和告警机制',
    ];

    return {
      totalFiles,
      analyzedFiles: totalFiles,
      patterns: this.patterns,
      recommendations,
      score,
    };
  }

  /**
   * 显示错误处理报告
   */
  private displayReport(report: ErrorHandlingReport): void {
    console.log('\n📋 错误处理分析报告:\n');

    console.log(`📊 分析统计:`);
    console.log(`  - 总文件数: ${report.totalFiles}`);
    console.log(`  - 分析文件数: ${report.analyzedFiles}`);
    console.log(`  - 发现问题: ${report.patterns.length}`);
    console.log(`  - 质量评分: ${report.score}/100\n`);

    if (report.patterns.length > 0) {
      console.log('🔍 发现的问题:\n');
      
      const groupedPatterns = this.groupPatternsByType(report.patterns);
      
      Object.entries(groupedPatterns).forEach(([type, patterns]) => {
        console.log(`${this.getTypeIcon(type as any)} ${this.getTypeDescription(type as any)}:`);
        patterns.forEach(pattern => {
          const severity = pattern.severity === 'high' ? '🔴' : 
                          pattern.severity === 'medium' ? '🟡' : '🟢';
          console.log(`  ${severity} ${pattern.description}`);
          console.log(`     建议: ${pattern.suggestion}`);
          console.log(`     文件: ${pattern.file}${pattern.line ? `:${pattern.line}` : ''}\n`);
        });
      });
    }

    console.log('💡 优化建议:\n');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    console.log('\n🎯 错误处理最佳实践:');
    console.log('  - 使用 try-catch 包装所有异步操作');
    console.log('  - 提供有意义的错误消息');
    console.log('  - 记录错误但不暴露敏感信息');
    console.log('  - 使用标准化的错误代码');
    console.log('  - 实施错误监控和告警');

    if (report.score >= 80) {
      console.log('\n🎉 错误处理质量良好！');
    } else if (report.score >= 60) {
      console.log('\n⚠️  错误处理质量一般，建议改进');
    } else {
      console.log('\n❌ 错误处理质量较差，需要重点改进');
    }
  }

  /**
   * 按类型分组错误模式
   */
  private groupPatternsByType(patterns: ErrorPattern[]): Record<string, ErrorPattern[]> {
    return patterns.reduce((groups, pattern) => {
      if (!groups[pattern.type]) {
        groups[pattern.type] = [];
      }
      groups[pattern.type].push(pattern);
      return groups;
    }, {} as Record<string, ErrorPattern[]>);
  }

  /**
   * 获取类型图标
   */
  private getTypeIcon(type: ErrorPattern['type']): string {
    const icons = {
      'missing-try-catch': '🚫',
      'generic-error': '📝',
      'poor-error-message': '💬',
      'no-error-logging': '📋',
    };
    return icons[type] || '❓';
  }

  /**
   * 获取类型描述
   */
  private getTypeDescription(type: ErrorPattern['type']): string {
    const descriptions = {
      'missing-try-catch': '缺少错误处理',
      'generic-error': '通用错误',
      'poor-error-message': '错误消息质量',
      'no-error-logging': '缺少错误日志',
    };
    return descriptions[type] || '未知问题';
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const optimizer = new ErrorHandlingOptimizer();
  
  try {
    await optimizer.optimize();
  } catch (error) {
    console.error('❌ 错误处理优化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
} 