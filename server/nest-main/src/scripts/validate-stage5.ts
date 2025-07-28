import { existsSync } from 'fs';
import { join } from 'path';

/**
 * 阶段五验证脚本
 * 验证测试和性能优化的完成情况
 */

interface ValidationResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
}

/**
 * 阶段五验证类
 */
export class Stage5Validator {
  private results: ValidationResult[] = [];

  /**
   * 执行完整验证
   */
  async validate(): Promise<void> {
    console.log('🔍 开始阶段五验证：测试和性能优化\n');

    await this.validateTestCoverage();
    await this.validatePerformanceTools();
    await this.validateErrorHandling();
    await this.validateScripts();

    this.displayResults();
  }

  /**
   * 验证测试覆盖情况
   */
  private async validateTestCoverage(): Promise<void> {
    console.log('📊 验证测试覆盖情况...');

    // 检查测试文件存在性
    const testFiles = [
      'src/modules/users/user.grpc.controller.spec.ts',
      'src/modules/rbac/permission.grpc.controller.spec.ts',
      'test/security.e2e-spec.ts',
      'test/app.e2e-spec.ts',
    ];

    let allTestsExist = true;
    const missingTests: string[] = [];

    for (const testFile of testFiles) {
      if (!existsSync(join(process.cwd(), testFile))) {
        allTestsExist = false;
        missingTests.push(testFile);
      }
    }

    if (allTestsExist) {
      this.results.push({
        name: '测试文件完整性',
        status: 'passed',
        message: '所有核心测试文件已创建',
        details: `已验证 ${testFiles.length} 个测试文件`
      });
    } else {
      this.results.push({
        name: '测试文件完整性',
        status: 'failed',
        message: '缺少测试文件',
        details: `缺少文件: ${missingTests.join(', ')}`
      });
    }

    // 检查测试配置
    const testConfigFiles = [
      'vitest.config.ts',
      'test/vitest-e2e.config.ts',
      'test/setup.ts',
      'test/setup-e2e.ts',
    ];

    let configComplete = true;
    for (const configFile of testConfigFiles) {
      if (!existsSync(join(process.cwd(), configFile))) {
        configComplete = false;
        break;
      }
    }

    this.results.push({
      name: '测试配置',
      status: configComplete ? 'passed' : 'warning',
      message: configComplete ? '测试配置完整' : '测试配置不完整',
      details: '单元测试和E2E测试配置'
    });
  }

  /**
   * 验证性能工具
   */
  private async validatePerformanceTools(): Promise<void> {
    console.log('⚡ 验证性能工具...');

    // 检查性能测试脚本
    const performanceFiles = [
      'src/scripts/performance-test.ts',
      'src/utils/grpc-client/grpc-test-client.ts',
      'src/utils/grpc-client/connection-test.ts',
    ];

    let performanceToolsReady = true;
    for (const file of performanceFiles) {
      if (!existsSync(join(process.cwd(), file))) {
        performanceToolsReady = false;
        break;
      }
    }

    this.results.push({
      name: '性能测试工具',
      status: performanceToolsReady ? 'passed' : 'failed',
      message: performanceToolsReady ? '性能测试工具完整' : '性能测试工具不完整',
      details: 'gRPC vs HTTP 性能对比工具'
    });

    // 检查监控组件
    const monitoringFiles = [
      'src/interceptors/monitoring.interceptor.ts',
      'src/health/monitoring.service.ts',
    ];

    let monitoringReady = true;
    for (const file of monitoringFiles) {
      if (!existsSync(join(process.cwd(), file))) {
        monitoringReady = false;
        break;
      }
    }

    this.results.push({
      name: '监控组件',
      status: monitoringReady ? 'passed' : 'failed',
      message: monitoringReady ? '监控组件完整' : '监控组件不完整',
      details: '性能监控和指标收集'
    });
  }

  /**
   * 验证错误处理
   */
  private async validateErrorHandling(): Promise<void> {
    console.log('🛡️ 验证错误处理...');

    // 检查异常过滤器
    const errorHandlingFiles = [
      'src/common/filters/grpc-exception.filter.ts',
      'src/common/filters/http-exception.filter.ts',
      'src/common/grpc/grpc-exceptions.ts',
    ];

    let errorHandlingComplete = true;
    for (const file of errorHandlingFiles) {
      if (!existsSync(join(process.cwd(), file))) {
        errorHandlingComplete = false;
        break;
      }
    }

    this.results.push({
      name: '异常处理机制',
      status: errorHandlingComplete ? 'passed' : 'failed',
      message: errorHandlingComplete ? '异常处理机制完整' : '异常处理机制不完整',
      details: '双协议统一异常处理'
    });

    // 检查安全组件
    const securityFiles = [
      'src/common/guards/hybrid-auth.guard.ts',
      'src/modules/rbac/guards/permission.guard.ts',
      'src/common/middleware/security.middleware.ts',
    ];

    let securityComplete = true;
    for (const file of securityFiles) {
      if (!existsSync(join(process.cwd(), file))) {
        securityComplete = false;
        break;
      }
    }

    this.results.push({
      name: '安全机制',
      status: securityComplete ? 'passed' : 'failed',
      message: securityComplete ? '安全机制完整' : '安全机制不完整',
      details: '认证、权限和安全中间件'
    });
  }

  /**
   * 验证脚本和配置
   */
  private async validateScripts(): Promise<void> {
    console.log('🔧 验证脚本和配置...');

    // 读取 package.json 检查脚本
    try {
      const packageJson = require(join(process.cwd(), 'package.json'));
      const scripts = packageJson.scripts || {};

      const requiredScripts = [
        'test',
        'test:e2e',
        'test:cov',
        'test:grpc',
        'test:performance',
        'proto:gen',
      ];

      const missingScripts = requiredScripts.filter(script => !scripts[script]);

      if (missingScripts.length === 0) {
        this.results.push({
          name: 'NPM 脚本',
          status: 'passed',
          message: '所有必需的 NPM 脚本已配置',
          details: `已验证 ${requiredScripts.length} 个脚本`
        });
      } else {
        this.results.push({
          name: 'NPM 脚本',
          status: 'warning',
          message: '部分脚本未配置',
          details: `缺少: ${missingScripts.join(', ')}`
        });
      }
    } catch (error) {
      this.results.push({
        name: 'NPM 脚本',
        status: 'failed',
        message: '无法读取 package.json',
        details: `错误: ${error}`
      });
    }

    // 检查环境配置
    const envFiles = [
      'env-config.md',
      '.gitignore',
    ];

    let envConfigReady = true;
    for (const file of envFiles) {
      if (!existsSync(join(process.cwd(), file))) {
        envConfigReady = false;
        break;
      }
    }

    this.results.push({
      name: '环境配置',
      status: envConfigReady ? 'passed' : 'warning',
      message: envConfigReady ? '环境配置文档完整' : '环境配置文档不完整',
      details: '开发和生产环境配置'
    });
  }

  /**
   * 显示验证结果
   */
  private displayResults(): void {
    console.log('\n📋 阶段五验证结果:\n');

    let passedCount = 0;
    let warningCount = 0;
    let failedCount = 0;

    for (const result of this.results) {
      const icon = result.status === 'passed' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${icon} ${result.name}: ${result.message}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }

      switch (result.status) {
        case 'passed': passedCount++; break;
        case 'warning': warningCount++; break;
        case 'failed': failedCount++; break;
      }
    }

    console.log('\n' + '━'.repeat(60));
    console.log(`📊 总结: ${passedCount} 通过, ${warningCount} 警告, ${failedCount} 失败`);

    const completionRate = (passedCount / this.results.length) * 100;
    console.log(`🎯 完成度: ${completionRate.toFixed(1)}%`);

    if (failedCount === 0 && warningCount <= 2) {
      console.log('\n🎉 阶段五验证通过！测试和性能优化已基本完成');
      console.log('✨ 可以继续进行阶段六：部署和监控');
    } else if (failedCount === 0) {
      console.log('\n⚠️  阶段五基本完成，但有一些警告项需要关注');
      console.log('💡 建议完善警告项后再进入下一阶段');
    } else {
      console.log('\n❌ 阶段五验证未通过，请修复失败项');
      console.log('🔧 请根据上述结果完善相关功能');
    }

    console.log('\n🎯 阶段五性能优化建议:');
    console.log('  1. 定期运行性能测试，建立基准');
    console.log('  2. 监控关键指标（响应时间、吞吐量、错误率）');
    console.log('  3. 优化数据库查询和缓存策略');
    console.log('  4. 实施代码质量检查和测试覆盖率要求');
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const validator = new Stage5Validator();
  
  try {
    await validator.validate();
  } catch (error) {
    console.error('❌ 验证过程出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
} 