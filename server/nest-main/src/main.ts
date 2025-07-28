import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 配置 gRPC 微服务
  const grpcPort = process.env.GRPC_PORT || 50051;
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['users', 'rbac', 'common'],
      protoPath: [
        join(__dirname, '../protos/users.proto'),
        join(__dirname, '../protos/rbac.proto'),
        join(__dirname, '../protos/common.proto'),
      ],
      url: `0.0.0.0:${grpcPort}`,
      maxReceiveMessageLength: Number.parseInt(process.env.GRPC_MAX_RECEIVE_MESSAGE_LENGTH || '4194304'),
      maxSendMessageLength: Number.parseInt(process.env.GRPC_MAX_SEND_MESSAGE_LENGTH || '4194304'),
      keepalive: {
        keepaliveTimeMs: Number.parseInt(process.env.GRPC_KEEPALIVE_TIME_MS || '30000'),
        keepaliveTimeoutMs: Number.parseInt(process.env.GRPC_KEEPALIVE_TIMEOUT_MS || '5000'),
        keepalivePermitWithoutCalls: 1,
        http2MaxPingsWithoutData: 0,
        http2MinTimeBetweenPingsMs: 10000,
        http2MinPingIntervalWithoutDataMs: 300000,
      },
    },
  });

  // 全局拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 全局管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    // exceptionFactory: (errors) => {
    //   const formattedErrors = errors.map(err => {
    //     return {
    //       field: err.property,
    //       errors: Object.values(err.constraints || {}).map(msg => ({ message: msg }))
    //     };
    //   });
    //   return new BadRequestException({
    //     message: '请求参数验证失败',
    //     errors: formattedErrors
    //   });
    // }
  }));

  // CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:6767', 'http://localhost:3000', 'http://localhost:6868'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger (只在开发环境启用)
  if (process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('NestJS API - 双协议支持')
      .setDescription('支持 HTTP 和 gRPC 双协议的 NestJS API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('HTTP API', 'HTTP REST 接口')
      .addTag('gRPC', 'gRPC 服务接口')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    logger.log(`Swagger documentation available at: http://localhost:${process.env.APP_PORT || '3000'}/api`);
  }

  // 启动 gRPC 微服务
  await app.startAllMicroservices();
  logger.log(`gRPC microservice is running on: 0.0.0.0:${grpcPort}`);

  // 启动 HTTP 服务
  const httpPort = process.env.APP_PORT || 3000;
  await app.listen(httpPort);
  logger.log(`HTTP server is running on: http://localhost:${httpPort}`);
  logger.log('🚀 Application started successfully with dual protocol support!');
}
bootstrap();
