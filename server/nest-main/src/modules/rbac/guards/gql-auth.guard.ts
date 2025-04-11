import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(GqlAuthGuard.name);

  constructor() {
    super();
    this.logger.log('GqlAuthGuard已初始化');
  }

  canActivate(context: ExecutionContext) {
    this.logger.log('GqlAuthGuard.canActivate被调用');
    
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    
    if (req?.headers?.authorization) {
      this.logger.log(`请求包含Authorization头: ${req.headers.authorization.substring(0, 20)}...`);
    } else {
      this.logger.warn('请求没有Authorization头');
      req.headers = req.headers || {};
      req.headers.authorization = ''; // 确保没有token时不会崩溃
    }
    
    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext) {
    this.logger.log('GqlAuthGuard.getRequest被调用');
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    this.logger.debug(`请求路径: ${req.path}`);
    return req;
  }

  // 重写handleRequest方法，确保将用户信息同时存储在请求对象和GraphQL上下文中
  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    this.logger.log(`JWT Auth - HandleRequest: ${user ? '用户已验证' : '认证失败'}`);
    
    if (err || !user) {
      this.logger.error(`JWT Auth error: ${err?.message || 'No user found'}`);
      this.logger.error(`JWT Auth info: ${JSON.stringify(info)}`);
      if (info) {
        this.logger.error(`JWT token error: ${info.message}`);
      }
    } else {
      // 获取GraphQL上下文
      const gqlContext = GqlExecutionContext.create(context).getContext();

      // 将用户信息存储在GraphQL上下文中
      gqlContext.user = user;

      this.logger.log(`JWT Auth - User authenticated: ${user.phone}, roles: ${user.roles?.map(r => r.name).join(', ') || 'none'}`);
    }
    
    return super.handleRequest(err, user, info, context, status);
  }
} 