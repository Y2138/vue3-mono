import { CacheModule } from '@nestjs/cache-manager';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import * as redisStore from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import databaseConfig from './config/database.config';
import { User } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { Role } from './modules/rbac/entities/role.entity';
import { Permission } from './modules/rbac/entities/permission.entity';
import { HealthModule } from './health/health.module';
import { MonitoringInterceptor } from './interceptors/monitoring.interceptor';
import { HybridAuthGuard } from './common/guards/hybrid-auth.guard';
import { PermissionGuard } from './modules/rbac/guards/permission.guard';
import { HttpExceptionFilter, GrpcExceptionFilter } from './common/filters';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      name: 'default',
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const config: TypeOrmModuleOptions = {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST', 'localhost'),
          port: configService.get('POSTGRES_PORT', 5432),
          username: configService.get('POSTGRES_USER', 'postgres'),
          password: configService.get('POSTGRES_PASSWORD', 'postgres'),
          database: configService.get('POSTGRES_DB', 'nest'),
          entities: [User, Role, Permission],
          synchronize: process.env.NODE_ENV !== 'production',
          autoLoadEntities: true,
          logging: true,
          logger: 'advanced-console',
        };
        
        console.log('Database config:', {
          ...config,
          password: '******', // 隐藏密码
        });
        
        return config;
      },
      inject: [ConfigService],
    }),

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
