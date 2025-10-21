import { ValidationPipe, Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { LoggingInterceptor } from './interceptors/logging.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  // 全局拦截器
  app.useGlobalInterceptors(new LoggingInterceptor())

  // 全局管道 (HTTP 参数验证)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动去除未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 如果请求参数中包含未在 DTO 中定义的属性，则抛出异常
      transform: true // 自动将请求参数转换为 DTO 中定义的类型
    })
  )

  // CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : ['http://localhost:6767', 'http://localhost:3000', 'http://localhost:6868'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })

  // Swagger (只在开发环境启用)
  if (process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder().setTitle('NestJS REST API').setDescription('基于 NestJS 的 REST API 服务').setVersion('1.0').addBearerAuth().addTag('Authentication', '用户认证相关接口').addTag('Users', '用户管理相关接口').addTag('RBAC', '权限管理相关接口').addTag('System', '系统相关接口').build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, document)
    logger.log(`Swagger documentation available at: http://localhost:${process.env.APP_PORT || '3000'}/api`)
  }

  // 启动 HTTP 服务
  const httpPort = process.env.APP_PORT || 3000
  await app.listen(httpPort)
  logger.log(`HTTP server is running on: http://localhost:${httpPort}`)
  logger.log('🚀 Application started successfully!')
}
bootstrap()
