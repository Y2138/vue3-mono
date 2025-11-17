/**
 * 初始化管理员用户脚本
 * 创建一个默认的超级管理员账户
 */

import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from '../app.module'
import { UserService } from '../modules/users/user.service'

async function initAdmin() {
  const logger = new Logger('InitAdmin')

  try {
    logger.log('🚀 开始初始化管理员用户...')

    // 创建应用实例
    const app = await NestFactory.createApplicationContext(AppModule)

    // 获取服务实例
    const userService = app.get(UserService)

    // 管理员用户信息
    const adminData = {
      username: 'admin',
      phone: '15316120580', // 使用LOGIN_CREDENTIALS.md中指定的手机号
      password: 'Admin123!', // 符合密码强度要求：8位，包含大小写字母、数字和特殊字符
      status: 2 // 设置为活跃状态
    }

    logger.log(`📱 准备创建管理员用户: ${adminData.username} (${adminData.phone})`)

    try {
      // 检查用户是否已存在
      const existingUser = await userService.findOne(adminData.phone)
      if (existingUser) {
        logger.warn(`⚠️  管理员用户已存在: ${adminData.phone}`)
        logger.log('如需重新创建，请先删除现有用户或使用不同的手机号')
        await app.close()
        return
      }
    } catch (_error) {
      // 用户不存在，继续创建
      logger.log('✅ 用户不存在，可以创建新用户', _error)
    }

    // 创建普通管理员用户（直接使用userService创建）
    await userService.create(adminData)
    // 更新用户状态为激活
    await userService.updateUserStatus(adminData.phone, 2)

    logger.log('🎉 管理员用户创建成功!')
    logger.log(`📋 用户信息:`)
    logger.log(`   手机号: ${adminData.phone}`)
    logger.log(`   密码: ${adminData.password}`)

    logger.log('✨ 现在您可以使用以下信息登录:')
    logger.log(`   手机号: ${adminData.phone}`)
    logger.log(`   密码: ${adminData.password}`)

    await app.close()
  } catch (error) {
    logger.error('❌ 初始化管理员用户失败:', error.message)
    logger.error('详细错误:', error.stack)
    process.exit(1)
  }
}

// 运行脚本
if (require.main === module) {
  initAdmin()
    .then(() => {
      console.log('\n🎯 初始化完成!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 初始化失败:', error)
      process.exit(1)
    })
}

export { initAdmin }
