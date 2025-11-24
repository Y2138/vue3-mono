import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { RoleController } from './role.controller'
import { RoleService } from './services/role.service'

/**
 * 角色管理模块
 * 
 * 提供角色管理功能，包括：
 * - 角色 CRUD 操作
 * - 角色权限分配管理
 * - 角色用户分配管理
 */
@Module({
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
  imports: [PrismaModule]
})
export class RoleModule {
  constructor() {}

  async onModuleInit() {
    // 模块初始化逻辑
    await this.seedInitialData()
  }

  /**
   * 初始化基础角色数据
   * 确保系统有基础的管理员角色
   */
  private async seedInitialData() {
    // 模块初始化逻辑暂时禁用，避免启动时执行
    // 实际应用中可以通过专门的脚本或命令行工具来初始化数据
    console.log('角色模块已初始化')
  }
}