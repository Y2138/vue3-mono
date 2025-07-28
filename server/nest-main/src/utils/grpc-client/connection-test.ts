#!/usr/bin/env node

/**
 * gRPC 连接测试脚本
 * 用法：npm run test:grpc 或直接运行此文件
 */

import { GrpcTestClient, quickTest } from './grpc-test-client';

/**
 * 详细的连接测试
 */
async function detailedConnectionTest(): Promise<void> {
  console.log('🚀 开始 gRPC 连接详细测试...\n');

  const client = new GrpcTestClient({
    host: process.env.GRPC_HOST || 'localhost',
    port: parseInt(process.env.GRPC_PORT || '50051', 10),
    insecure: process.env.GRPC_INSECURE !== 'false',
    timeout: parseInt(process.env.GRPC_TIMEOUT || '10000', 10),
  });

  try {
    // 1. 初始化客户端
    console.log('📋 步骤 1: 初始化 gRPC 客户端');
    await client.initialize();
    console.log('✅ 客户端初始化成功\n');

    // 2. 获取状态信息
    console.log('📋 步骤 2: 获取客户端状态');
    const status = client.getStatus();
    console.log('📊 客户端配置:', status.config);
    console.log('📦 可用服务:', status.services);
    console.log('🔧 初始化状态:', status.isInitialized ? '已初始化' : '未初始化');
    console.log('');

    // 3. 测试基本连接
    console.log('📋 步骤 3: 测试服务连接');
    const isConnected = await client.testConnection();
    console.log(`🔗 连接状态: ${isConnected ? '正常' : '异常'}\n`);

    // 4. 测试具体服务方法（如果有的话）
    console.log('📋 步骤 4: 测试具体服务方法');
    await testSpecificMethods(client);

  } catch (error) {
    console.error('💥 测试过程中出现错误:', error);
    process.exit(1);
  } finally {
    console.log('\n🧹 清理资源...');
    await client.close();
    console.log('✅ 测试完成');
  }
}

/**
 * 测试具体的服务方法
 */
async function testSpecificMethods(client: GrpcTestClient): Promise<void> {
  const status = client.getStatus();
  
  if (status.services.length === 0) {
    console.log('⚠️  没有可用的服务进行测试');
    return;
  }

  // 测试用户服务（如果存在）
  if (status.services.includes('UserService')) {
    console.log('🧪 测试用户服务...');
    try {
      // 这里可以添加具体的用户服务测试
      // 例如：测试登录、获取用户等方法
      console.log('📝 UserService 服务可用');
    } catch (error) {
      console.error('❌ UserService 测试失败:', error);
    }
  }

  // 测试权限服务（如果存在）
  if (status.services.includes('PermissionService')) {
    console.log('🧪 测试权限服务...');
    try {
      // 这里可以添加具体的权限服务测试
      console.log('📝 PermissionService 服务可用');
    } catch (error) {
      console.error('❌ PermissionService 测试失败:', error);
    }
  }

  // 测试角色服务（如果存在）
  if (status.services.includes('RoleService')) {
    console.log('🧪 测试角色服务...');
    try {
      // 这里可以添加具体的角色服务测试
      console.log('📝 RoleService 服务可用');
    } catch (error) {
      console.error('❌ RoleService 测试失败:', error);
    }
  }
}

/**
 * 简单的健康检查测试
 */
async function simpleHealthCheck(): Promise<boolean> {
  console.log('🏥 执行简单健康检查...');
  
  try {
    await quickTest({
      host: process.env.GRPC_HOST || 'localhost',
      port: parseInt(process.env.GRPC_PORT || '50051', 10),
      timeout: 5000,
    });
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error);
    return false;
  }
}

/**
 * 批量连接测试
 */
async function batchConnectionTest(): Promise<void> {
  console.log('🔄 执行批量连接测试...\n');

  const testConfigs = [
    { name: '本地开发', host: 'localhost', port: 50051 },
    { name: '容器环境', host: '127.0.0.1', port: 50051 },
  ];

  for (const config of testConfigs) {
    console.log(`🧪 测试 ${config.name} (${config.host}:${config.port})`);
    
    try {
      const client = new GrpcTestClient({
        host: config.host,
        port: config.port,
        timeout: 5000,
      });

      await client.initialize();
      const isConnected = await client.testConnection();
      
      console.log(`   ${isConnected ? '✅' : '❌'} ${config.name}: ${isConnected ? '连接成功' : '连接失败'}`);
      
      await client.close();
    } catch (error) {
      console.log(`   ❌ ${config.name}: 连接失败 - ${error.message}`);
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const testType = args[0] || 'detailed';

  console.log('🔧 gRPC 连接测试工具');
  console.log('====================================\n');

  switch (testType) {
    case 'simple':
    case 'health':
      const isHealthy = await simpleHealthCheck();
      process.exit(isHealthy ? 0 : 1);
      break;

    case 'batch':
      await batchConnectionTest();
      break;

    case 'detailed':
    default:
      await detailedConnectionTest();
      break;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
  });
}

export { detailedConnectionTest, simpleHealthCheck, batchConnectionTest }; 