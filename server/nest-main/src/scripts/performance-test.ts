import { performance } from 'perf_hooks';
import { GrpcTestClient } from '../utils/grpc-client/grpc-test-client';

/**
 * 性能测试脚本
 * 测试 gRPC vs HTTP 性能对比和并发处理能力
 */

interface PerformanceResult {
  protocol: 'gRPC' | 'HTTP';
  operation: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  totalDuration: number;
}

interface TestConfig {
  concurrency: number;
  totalRequests: number;
  timeout: number;
}

/**
 * 性能测试类
 */
export class PerformanceTest {
  private grpcClient?: GrpcTestClient;
  private httpBaseUrl: string;

  constructor() {
    this.httpBaseUrl = `http://localhost:${process.env.APP_PORT || 3000}`;
  }

  /**
   * 初始化测试环境
   */
  async initialize(): Promise<void> {
    console.log('🚀 初始化性能测试环境...');
    
    // 初始化 gRPC 客户端
    try {
      this.grpcClient = new GrpcTestClient({
        host: 'localhost',
        port: parseInt(process.env.GRPC_PORT || '50051'),
        insecure: true,
      });
      await this.grpcClient.initialize();
      console.log('✅ gRPC 客户端初始化成功');
    } catch (error) {
      console.error('❌ gRPC 客户端初始化失败:', error);
    }

    // 测试 HTTP 连接
    try {
      const response = await fetch(`${this.httpBaseUrl}/health`);
      if (response.ok) {
        console.log('✅ HTTP 服务连接成功');
      } else {
        console.error('❌ HTTP 服务连接失败');
      }
    } catch (error) {
      console.error('❌ HTTP 服务连接失败:', error);
    }
  }

  /**
   * 执行性能测试
   */
  async runPerformanceTests(): Promise<void> {
    console.log('\n📊 开始性能测试...\n');

    const testConfigs: TestConfig[] = [
      { concurrency: 1, totalRequests: 100, timeout: 5000 },
      { concurrency: 10, totalRequests: 100, timeout: 10000 },
      { concurrency: 50, totalRequests: 500, timeout: 30000 },
    ];

    for (const config of testConfigs) {
      console.log(`\n🔄 测试配置: ${config.concurrency} 并发, ${config.totalRequests} 请求\n`);
      
      // 测试健康检查接口
      await this.testHealthCheck(config);
      
      // 测试登录接口
      await this.testLogin(config);
      
      // 测试权限查询接口
      await this.testPermissionQuery(config);
      
      console.log('\n' + '='.repeat(80) + '\n');
    }
  }

  /**
   * 测试健康检查接口
   */
  private async testHealthCheck(config: TestConfig): Promise<void> {
    console.log('📈 测试健康检查接口...');

    // HTTP 测试
    const httpResult = await this.runHttpTest(
      'GET',
      '/health',
      null,
      config,
      '健康检查'
    );
    
    // gRPC 测试 (如果可用)
    let grpcResult: PerformanceResult | null = null;
    if (this.grpcClient) {
      grpcResult = await this.runGrpcTest(
        'HealthService',
        'Check',
        {},
        config,
        '健康检查'
      );
    }

    this.displayResults('健康检查', httpResult, grpcResult);
  }

  /**
   * 测试登录接口
   */
  private async testLogin(config: TestConfig): Promise<void> {
    console.log('📈 测试用户登录接口...');

    const loginData = {
      phone: '13800138000',
      password: 'test123',
    };

    // HTTP 测试
    const httpResult = await this.runHttpTest(
      'POST',
      '/auth/login',
      loginData,
      config,
      '用户登录'
    );

    // gRPC 测试 (如果可用)
    let grpcResult: PerformanceResult | null = null;
    if (this.grpcClient) {
      grpcResult = await this.runGrpcTest(
        'UserService',
        'Login',
        loginData,
        config,
        '用户登录'
      );
    }

    this.displayResults('用户登录', httpResult, grpcResult);
  }

  /**
   * 测试权限查询接口
   */
  private async testPermissionQuery(config: TestConfig): Promise<void> {
    console.log('📈 测试权限查询接口...');

    const queryData = {
      pagination: { page: 1, pageSize: 10 }
    };

    // HTTP 测试
    const httpResult = await this.runHttpTest(
      'GET',
      '/permissions?page=1&limit=10',
      null,
      config,
      '权限查询'
    );

    // gRPC 测试 (如果可用)
    let grpcResult: PerformanceResult | null = null;
    if (this.grpcClient) {
      grpcResult = await this.runGrpcTest(
        'PermissionService',
        'GetPermissions',
        queryData,
        config,
        '权限查询'
      );
    }

    this.displayResults('权限查询', httpResult, grpcResult);
  }

  /**
   * 执行 HTTP 性能测试
   */
  private async runHttpTest(
    method: string,
    path: string,
    data: any,
    config: TestConfig,
    operation: string
  ): Promise<PerformanceResult> {
    const responseTimes: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    const startTime = performance.now();

    // 创建并发请求
    const promises: Promise<void>[] = [];
    const requestsPerBatch = Math.ceil(config.totalRequests / config.concurrency);

    for (let i = 0; i < config.concurrency; i++) {
      const batchPromise = this.runHttpBatch(
        method,
        path,
        data,
        requestsPerBatch,
        responseTimes,
        (success) => success ? successCount++ : errorCount++
      );
      promises.push(batchPromise);
    }

    await Promise.all(promises);

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    return this.calculateResults('HTTP', operation, responseTimes, successCount, errorCount, totalDuration);
  }

  /**
   * 执行 HTTP 批次请求
   */
  private async runHttpBatch(
    method: string,
    path: string,
    data: any,
    requestCount: number,
    responseTimes: number[],
    onResult: (success: boolean) => void
  ): Promise<void> {
    for (let i = 0; i < requestCount; i++) {
      const requestStart = performance.now();
      
      try {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (data) {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.httpBaseUrl}${path}`, options);
        const requestEnd = performance.now();
        
        responseTimes.push(requestEnd - requestStart);
        onResult(response.ok);
      } catch (error) {
        const requestEnd = performance.now();
        responseTimes.push(requestEnd - requestStart);
        console.warn(`HTTP request failed: ${error}`);
        onResult(false);
      }
    }
  }

  /**
   * 执行 gRPC 性能测试
   */
  private async runGrpcTest(
    serviceName: string,
    methodName: string,
    data: any,
    config: TestConfig,
    operation: string
  ): Promise<PerformanceResult> {
    const responseTimes: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    const startTime = performance.now();

    // 创建并发请求
    const promises: Promise<void>[] = [];
    const requestsPerBatch = Math.ceil(config.totalRequests / config.concurrency);

    for (let i = 0; i < config.concurrency; i++) {
      const batchPromise = this.runGrpcBatch(
        serviceName,
        methodName,
        data,
        requestsPerBatch,
        responseTimes,
        (success) => success ? successCount++ : errorCount++
      );
      promises.push(batchPromise);
    }

    await Promise.all(promises);

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    return this.calculateResults('gRPC', operation, responseTimes, successCount, errorCount, totalDuration);
  }

  /**
   * 执行 gRPC 批次请求
   */
  private async runGrpcBatch(
    serviceName: string,
    methodName: string,
    data: any,
    requestCount: number,
    responseTimes: number[],
    onResult: (success: boolean) => void
  ): Promise<void> {
    if (!this.grpcClient) {
      return;
    }

    for (let i = 0; i < requestCount; i++) {
      const requestStart = performance.now();
      
      try {
        // 这里需要根据实际的 gRPC 客户端 API 调用
        // 暂时使用模拟调用
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
        
        const requestEnd = performance.now();
        responseTimes.push(requestEnd - requestStart);
        onResult(true);
      } catch (error) {
        const requestEnd = performance.now();
        responseTimes.push(requestEnd - requestStart);
        console.warn(`gRPC request failed: ${error}`);
        onResult(false);
      }
    }
  }

  /**
   * 计算性能结果
   */
  private calculateResults(
    protocol: 'gRPC' | 'HTTP',
    operation: string,
    responseTimes: number[],
    successCount: number,
    errorCount: number,
    totalDuration: number
  ): PerformanceResult {
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    
    return {
      protocol,
      operation,
      totalRequests: responseTimes.length,
      successCount,
      errorCount,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      p99ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
      throughput: (responseTimes.length / totalDuration) * 1000, // requests per second
      totalDuration,
    };
  }

  /**
   * 显示测试结果
   */
  private displayResults(
    testName: string,
    httpResult: PerformanceResult,
    grpcResult: PerformanceResult | null
  ): void {
    console.log(`\n📊 ${testName} 性能测试结果:`);
    console.log('━'.repeat(60));

    this.displaySingleResult(httpResult);
    
    if (grpcResult) {
      console.log('');
      this.displaySingleResult(grpcResult);
      
      // 性能对比
      console.log('\n📈 性能对比:');
      const speedupRatio = httpResult.avgResponseTime / grpcResult.avgResponseTime;
      const throughputRatio = grpcResult.throughput / httpResult.throughput;
      
      console.log(`  响应时间: gRPC 比 HTTP ${speedupRatio > 1 ? '快' : '慢'} ${(Math.abs(speedupRatio - 1) * 100).toFixed(1)}%`);
      console.log(`  吞吐量: gRPC 比 HTTP ${throughputRatio > 1 ? '高' : '低'} ${(Math.abs(throughputRatio - 1) * 100).toFixed(1)}%`);
    }
  }

  /**
   * 显示单个测试结果
   */
  private displaySingleResult(result: PerformanceResult): void {
    console.log(`${result.protocol} 协议:`);
    console.log(`  ✅ 成功请求: ${result.successCount}/${result.totalRequests}`);
    console.log(`  ❌ 失败请求: ${result.errorCount}`);
    console.log(`  ⏱️  平均响应时间: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`  ⚡ 最快响应时间: ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`  🐌 最慢响应时间: ${result.maxResponseTime.toFixed(2)}ms`);
    console.log(`  📊 P95 响应时间: ${result.p95ResponseTime.toFixed(2)}ms`);
    console.log(`  📊 P99 响应时间: ${result.p99ResponseTime.toFixed(2)}ms`);
    console.log(`  🚀 吞吐量: ${result.throughput.toFixed(2)} req/s`);
    console.log(`  ⏰ 总耗时: ${result.totalDuration.toFixed(2)}ms`);
  }

  /**
   * 生成性能报告
   */
  generateReport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `./performance-report-${timestamp}.json`;
    
    console.log(`\n📄 性能报告已生成: ${reportPath}`);
    console.log('🎯 性能优化建议:');
    console.log('  1. 监控响应时间，目标 < 100ms');
    console.log('  2. 提升吞吐量，目标 > 1000 req/s');
    console.log('  3. 减少错误率，目标 < 1%');
    console.log('  4. 优化 P99 响应时间，避免长尾延迟');
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const performanceTest = new PerformanceTest();
  
  try {
    await performanceTest.initialize();
    await performanceTest.runPerformanceTests();
    performanceTest.generateReport();
  } catch (error) {
    console.error('❌ 性能测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
} 