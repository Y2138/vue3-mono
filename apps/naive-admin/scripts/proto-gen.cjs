#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置路径
const PROTO_DIR = path.resolve(__dirname, '../../../protos');
const OUTPUT_DIR = path.resolve(__dirname, '../src/shared');
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 清理输出目录
function cleanOutputDir() {
  console.log('🧹 清理输出目录...');
  
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    files.forEach(file => {
      if (file.endsWith('.ts') && file !== 'index.ts') {
        fs.unlinkSync(path.join(OUTPUT_DIR, file));
      }
    });
  }
}

// 编译 Proto 文件
function compileProtos() {
  console.log('🔨 开始编译 Proto 文件（精简模式）...');
  
  return new Promise((resolve, reject) => {
    // 使用精简配置：只生成类型定义，不生成编码/解码逻辑
    const pluginPath = path.join(PROJECT_ROOT, 'node_modules/.bin/protoc-gen-ts_proto');
    const cmd = [
      'protoc',
      `--plugin=protoc-gen-ts_proto=${pluginPath}`,
      `--ts_proto_out=${OUTPUT_DIR}`,
      // 前端精简配置选项
      '--ts_proto_opt=esModuleInterop=true',
      '--ts_proto_opt=useOptionals=messages',
      '--ts_proto_opt=stringEnums=true',
      '--ts_proto_opt=forceLong=string',
      '--ts_proto_opt=useMapType=true',
      // 关键：只生成类型，不生成编码/解码函数
      '--ts_proto_opt=outputEncodeMethods=false',
      '--ts_proto_opt=outputJsonMethods=false',
      '--ts_proto_opt=outputPartialMethods=false',
      '--ts_proto_opt=outputClientImpl=false',
      // 生成简单的创建函数
      '--ts_proto_opt=useExactTypes=false',
      '--ts_proto_opt=oneof=unions',
      `--proto_path=${PROTO_DIR}`,
      `${PROTO_DIR}/*.proto`
    ].join(' ');
    
    console.log(`📦 运行命令: ${cmd}`);
    console.log(`📁 工作目录: ${PROJECT_ROOT}`);
    exec(cmd, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ 编译失败:`, error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️  编译警告:`, stderr);
      }
      
      if (stdout) {
        console.log(`📝 编译输出:`, stdout);
      }
      
      console.log(`✅ Proto 文件编译成功（精简模式）`);
      resolve(stdout);
    });
  });
}

// 分析文件并提取导出的类型
function extractExportsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const exports = [];
  
  // 匹配 export interface 和 export type
  const interfaceMatches = content.match(/export interface (\w+)/g);
  if (interfaceMatches) {
    interfaceMatches.forEach(match => {
      const name = match.replace('export interface ', '');
      exports.push(name);
    });
  }
  
  // 匹配 export type（如果有的话）
  const typeMatches = content.match(/export type (\w+)/g);
  if (typeMatches) {
    typeMatches.forEach(match => {
      const name = match.replace('export type ', '');
      exports.push(name);
    });
  }
  
  return exports;
}

// 生成智能导出文件
function generateIndexFile() {
  console.log('📄 生成智能导出文件...');
  
  const files = fs.readdirSync(OUTPUT_DIR);
  const tsFiles = files.filter(file => file.endsWith('.ts') && file !== 'index.ts');
  
  if (tsFiles.length === 0) {
    console.log('⚠️  没有找到生成的 TypeScript 文件');
    return;
  }

  const moduleExports = [];
  
  tsFiles.forEach(file => {
    const moduleName = path.basename(file, '.ts');
    const filePath = path.join(OUTPUT_DIR, file);
    const exports = extractExportsFromFile(filePath);
    
    if (exports.length > 0) {
      // 使用显式导出避免 protobufPackage 冲突
      const exportList = exports.join(',\n  ');
      moduleExports.push(`// ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} types
export type {
  ${exportList}
} from './${moduleName}';`);
    }
  });

  const indexContent = `// 自动生成的类型导出文件（精简模式）
// 只包含接口类型定义，不包含编码/解码逻辑
// 自动解决 protobufPackage 命名冲突
// 请勿手动修改

${moduleExports.join('\n\n')}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('✅ 智能导出文件生成完成（避免命名冲突）');
}

// 统计文件大小
function showFileSizes() {
  console.log('📊 生成文件统计:');
  
  const files = fs.readdirSync(OUTPUT_DIR);
  const tsFiles = files.filter(file => file.endsWith('.ts'));
  
  let totalSize = 0;
  let totalLines = 0;
  
  tsFiles.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file);
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    
    totalSize += stats.size;
    totalLines += lines;
    
    console.log(`  📄 ${file}: ${(stats.size / 1024).toFixed(1)}KB (${lines} 行)`);
  });
  
  console.log(`📈 总计: ${(totalSize / 1024).toFixed(1)}KB (${totalLines} 行)`);
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始 Protobuf 类型生成流程（前端精简模式）...');
    
    // 确保输出目录存在
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    cleanOutputDir();
    await compileProtos();
    generateIndexFile();
    showFileSizes();
    
    console.log('🎉 Protobuf 类型生成完成！');
    
  } catch (error) {
    console.error('💥 编译失败:', error);
    process.exit(1);
  }
}

main(); 