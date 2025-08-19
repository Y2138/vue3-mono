import { CacheModule } from '@nestjs/cache-manager';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import * as redisStore from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import databaseConfig from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { MonitoringInterceptor } from './interceptors/monitoring.interceptor';
import { HybridAuthGuard } from './common/guards/hybrid-auth.guard';
import { PermissionGuard } from './modules/rbac/guards/permission.guard';
import { HttpExceptionFilter, GrpcExceptionFilter } from './common/filters';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { ResponseInterceptor } from './common/response';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    PrismaModule,

    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    RbacModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    // 全局拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: MonitoringInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // 全局认证守卫
    {
      provide: APP_GUARD,
      useClass: HybridAuthGuard,
    },
    // 全局权限守卫
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 配置安全中间件，应用于所有路由
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
