import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import databaseConfig from './config/database.config';
import { HealthResolver } from './health/health.resolver';
import { User } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { Role } from './modules/rbac/entities/role.entity';
import { Permission } from './modules/rbac/entities/permission.entity';
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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: process.env.APP_ENV === 'development',
      formatError: (error) => {
        const exception = error.extensions?.exception;
        const isObject = (obj: unknown): obj is Record<string, unknown> => obj !== null && typeof obj === 'object';
        const response = isObject(exception) && 'response' in exception ? exception.response : null;
        const message = isObject(response) && 'message' in response ? response.message as string | string[] : error.message;
        const graphQLFormattedError = {
          message: Array.isArray(message) ? message.join(', ') : message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          locations: error.locations,
          path: error.path,
          extensions: {
            ...error.extensions,
            exception: isObject(exception) ? {
              ...exception,
              response: undefined, // 移除原始响应以避免冗余
            } : undefined,
          },
        };
        return graphQLFormattedError;
      },
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
  ],
  providers: [HealthResolver],
})
export class AppModule {}
