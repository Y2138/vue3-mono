import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { RbacSeedService } from '../seeds/rbac-seed.service';

@Injectable()
export class RbacInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacInitService.name);

  constructor(private readonly rbacSeedService: RbacSeedService) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('开始初始化 RBAC 数据...');
      await this.rbacSeedService.seed();
      this.logger.log('RBAC 数据初始化完成');
    } catch (error) {
      this.logger.error('RBAC 数据初始化失败', error.stack);
      // 这里我们只记录错误，不抛出异常，以免影响应用启动
      // 如果您希望在初始化失败时终止应用启动，可以取消下面的注释
      // throw error;
    }
  }
} 