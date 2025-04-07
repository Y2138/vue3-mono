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
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
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
