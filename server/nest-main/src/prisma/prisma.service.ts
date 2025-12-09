import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common'
import { PrismaClient, Prisma } from '@prisma/client'
import { userRoleExtension } from './prisma.middleware'

// 定义日志监控扩展
const loggerExtension = Prisma.defineExtension({
  name: 'loggerExtension',
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const logger = new Logger('PrismaLogger')
        const start = Date.now()

        try {
          const result = await query(args)
          const duration = Date.now() - start

          // 记录慢查询
          if (duration > 100) {
            logger.warn(`慢查询: ${model}.${operation} - ${duration}ms`)
          } else if (process.env.NODE_ENV === 'development') {
            logger.debug(`查询: ${model}.${operation} - ${duration}ms`)
          }

          return result
        } catch (error) {
          const duration = Date.now() - start
          logger.error(`查询失败: ${model}.${operation} - ${duration}ms - ${error.message}`)
          throw error
        }
      }
    }
  }
})

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private extendedPrisma: any

  private readonly prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    })
    // 先应用日志监控扩展，再应用用户角色转换扩展
    this.extendedPrisma = this.prisma.$extends(loggerExtension).$extends(userRoleExtension)

    this.logger.log('Prisma Client 已初始化并应用扩展')
  }

  async onModuleInit() {
    this.logger.log('Connecting to Prisma...')
    await this.prisma.$connect()
    this.logger.log('Connected to Prisma successfully')
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Prisma...')
    await this.prisma.$disconnect()
    this.logger.log('Disconnected from Prisma successfully')
  }

  // 提供对扩展后的Prisma Client的访问
  get client(): PrismaClient {
    return this.extendedPrisma
  }

  // 为了兼容直接使用prisma.resource而不是prisma.client.resource
  get resource(): Prisma.ResourceDelegate {
    return this.extendedPrisma.resource
  }

  get user(): Prisma.UserDelegate {
    return this.extendedPrisma.user
  }

  get role(): Prisma.RoleDelegate {
    return this.extendedPrisma.role
  }

  get permission(): Prisma.PermissionDelegate {
    return this.extendedPrisma.permission
  }

  get roleResource(): Prisma.RoleResourceDelegate {
    return this.extendedPrisma.roleResource
  }

  get userRole(): Prisma.UserRoleDelegate {
    return this.extendedPrisma.userRole
  }

  /**
   * 健康检查方法
   * 用于验证Prisma连接是否正常
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 执行一个简单的查询来验证连接
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      this.logger.error(`Prisma健康检查失败: ${error.message}`, error.stack)
      return false
    }
  }

  // 事务支持
  get $transaction(): typeof this.extendedPrisma.$transaction {
    return this.extendedPrisma.$transaction.bind(this.extendedPrisma)
  }
}
