import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 安全中间件
 * 提供基础的安全防护功能
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // 设置安全响应头
    this.setSecurityHeaders(res);
    
    // 记录可疑请求
    this.logSuspiciousActivity(req);
    
    // 基础 DDoS 防护
    this.rateLimitCheck(req, res, next);
    
    next();
  }

  /**
   * 设置安全响应头
   */
  private setSecurityHeaders(res: Response): void {
    // 防止 XSS 攻击
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // 内容安全策略
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // HTTPS 重定向（生产环境）
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // 隐藏服务器信息
    res.removeHeader('X-Powered-By');
  }

  /**
   * 记录可疑活动
   */
  private logSuspiciousActivity(req: Request): void {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress;
    
    // 检测可疑的 User-Agent
    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /burp/i,
      /zap/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      this.logger.warn(`Suspicious User-Agent detected from ${ip}: ${userAgent}`);
    }
    
    // 检测可疑的请求路径
    const suspiciousUrls = [
      /\/admin/i,
      /\/wp-admin/i,
      /\/phpmyadmin/i,
      /\.php$/i,
      /\.asp$/i
    ];
    
    if (suspiciousUrls.some(pattern => pattern.test(req.url))) {
      this.logger.warn(`Suspicious URL access from ${ip}: ${req.url}`);
    }
  }

  /**
   * 简单的速率限制检查
   */
  private rateLimitCheck(req: Request, _res: Response, _next: NextFunction): void {
    // 这里可以实现更复杂的速率限制逻辑
    // 当前只是一个占位符，实际项目中建议使用 redis 实现
    
    const ip = req.ip || req.connection.remoteAddress;
    
    // 在开发环境跳过速率限制
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // TODO: 实现基于 Redis 的速率限制
    // 当前只记录高频请求
    const requestTime = Date.now();
    
    // 这里应该使用 Redis 或内存存储来跟踪请求频率
    this.logger.debug(`Rate limit check for ${ip} at ${requestTime}`);
  }
} 