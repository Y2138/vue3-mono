import { Plugin } from 'vite'
import { execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as chokidar from 'chokidar'
import chalk from 'chalk'

export interface ProtobufPluginOptions {
  /** Proto 文件输入目录 */
  protoDir: string
  /** TypeScript 输出目录 */
  outputDir: string
  /** 要处理的 proto 文件列表 */
  protoFiles: string[]
  /** 是否启用监听模式 */
  watch?: boolean
  /** 额外的 protoc 选项 */
  protocOptions?: string[]
  /** 是否启用调试日志 */
  debug?: boolean
}

interface ProtoFileConfig {
  src: string
  dest: string
  file: string
}

/**
 * Vite Protobuf 插件
 * 
 * 功能：
 * - Vite 启动时自动生成 protobuf 类型
 * - 开发模式下监听 proto 文件变化
 * - 集成现有的 proto-gen.cjs 逻辑
 */
export function protobufPlugin(options: ProtobufPluginOptions): Plugin {
  const {
    protoDir,
    outputDir,
    protoFiles,
    watch = true,
    protocOptions = [],
    debug = false
  } = options

  let watcher: chokidar.FSWatcher | null = null
  let isGenerating = false

  const log = {
    info: (msg: string) => console.log(chalk.cyan('[protobuf]'), msg),
    success: (msg: string) => console.log(chalk.green('[protobuf]'), msg),
    warn: (msg: string) => console.log(chalk.yellow('[protobuf]'), msg),
    error: (msg: string) => console.log(chalk.red('[protobuf]'), msg),
    debug: (msg: string) => debug && console.log(chalk.gray('[protobuf]'), msg)
  }

  // 递归获取目录下的文件
  async function getFilesRecursively(dir: string, extension: string): Promise<string[]> {
    const result: string[] = []
    
    if (!fs.existsSync(dir)) {
      return result
    }
    
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        const subFiles = await getFilesRecursively(fullPath, extension)
        result.push(...subFiles)
      } else if (entry.isFile() && fullPath.endsWith(extension)) {
        result.push(fullPath)
      }
    }
    
    return result
  }

  // 分析文件并提取导出的类型
  function extractExportsFromFile(filePath: string): string[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const exports: string[] = []
      
      // 匹配 export interface 和 export type
      const interfaceMatches = content.match(/export interface (\w+)/g)
      if (interfaceMatches) {
        interfaceMatches.forEach(match => {
          const name = match.replace('export interface ', '')
          exports.push(name)
        })
      }
      
      const typeMatches = content.match(/export type (\w+)/g)
      if (typeMatches) {
        typeMatches.forEach(match => {
          const name = match.replace('export type ', '')
          exports.push(name)
        })
      }
      
      return exports
    } catch (error) {
      log.debug(`Error extracting exports from ${filePath}: ${error}`)
      return []
    }
  }

  // 生成智能导出文件
  async function generateIndexFile(sourceDir: string, outputDir: string, protoFileName: string) {
    const _moduleName = protoFileName.replace('.proto', '')
    
    try {
      // 使用 fs 递归读取目录，避免 glob 版本冲突
      const files = await getFilesRecursively(outputDir, '.ts')
      
      let exportStatements = `// 自动生成的类型导出文件（精简模式）
// 只包含接口类型定义，不包含编码/解码逻辑  
// 自动解决 protobufPackage 命名冲突
// 请勿手动修改
// PROTO SOURCE: ${sourceDir}${protoFileName}

`

      const moduleExports: string[] = []
      
      files
        .filter(file => !file.endsWith('index.ts'))
        .forEach(file => {
          const exports = extractExportsFromFile(file)
          
          if (exports.length > 0) {
            const relativePath = path.relative(outputDir, file).replace('.ts', '').replace(/\\/g, '/')
            const baseName = path.basename(relativePath)
            const _alias = baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/[^a-z0-9]/gi, '') + 'Module'
            
            const exportList = exports.join(',\n  ')
            moduleExports.push(`// ${baseName.charAt(0).toUpperCase() + baseName.slice(1)} types
export type {
  ${exportList}
} from './${relativePath}';`)
          }
        })

      exportStatements += moduleExports.join('\n\n')
      
      const indexFilePath = path.join(outputDir, 'index.ts')
      await fs.promises.writeFile(indexFilePath, exportStatements)
      
      log.success(`Generated index.ts with ${moduleExports.length} modules`)
    } catch (error) {
      log.error(`Failed to generate index.ts: ${error}`)
    }
  }

  // 生成 protobuf 源码
  async function generateProtoSource(config: ProtoFileConfig) {
    if (isGenerating) {
      log.debug('Generation already in progress, skipping...')
      return
    }

    isGenerating = true
    
    try {
      const { src, dest, file } = config
      
      log.info(`Generating types for ${file}...`)
      
      // 确保输出目录存在
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
      }

      // 检查 proto 文件是否存在
      const protoFilePath = path.join(src, file)
      if (!fs.existsSync(protoFilePath)) {
        throw new Error(`Proto file not found: ${protoFilePath}`)
      }

      // 构建 protoc 命令
      const pluginPath = path.resolve('node_modules/.bin/protoc-gen-ts_proto')
      const baseCommand = [
        'protoc',
        `--plugin=${pluginPath}`,
        `--ts_proto_out=${dest}`,
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
        '--ts_proto_opt=useExactTypes=false',
        '--ts_proto_opt=oneof=unions',
        `--proto_path=${src}`,
        ...protocOptions,
        protoFilePath
      ]

      const command = baseCommand.join(' ')
      log.debug(`Running: ${command}`)

      execSync(command, { 
        stdio: debug ? 'inherit' : 'pipe',
        cwd: process.cwd()
      })

      // 生成智能导出文件
      await generateIndexFile(src, dest, file)
      
      log.success(`✅ Generated types for ${file}`)
    } catch (error) {
      log.error(`Failed to generate ${config.file}: ${error}`)
      throw error
    } finally {
      isGenerating = false
    }
  }

  // 生成所有 proto 文件
  async function generateAllProtos() {
    log.info('🔨 Generating all protobuf types...')
    
    for (const protoFile of protoFiles) {
      await generateProtoSource({
        src: protoDir,
        dest: outputDir,
        file: protoFile
      })
    }
    
    log.success('🎉 All protobuf types generated!')
  }

  // 启动文件监听
  function startWatching() {
    if (!watch) return

    const watchPattern = path.join(protoDir, '*.proto')
    log.info(`👀 Watching proto files: ${watchPattern}`)

    watcher = chokidar.watch(watchPattern, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    })

    watcher
      .on('change', async (filePath) => {
        const fileName = path.basename(filePath)
        if (protoFiles.includes(fileName)) {
          log.info(`📝 Proto file changed: ${fileName}`)
          await generateProtoSource({
            src: protoDir,
            dest: outputDir,
            file: fileName
          })
        }
      })
      .on('error', (error) => {
        log.error(`Watcher error: ${error}`)
      })
  }

  return {
    name: 'vite-plugin-protobuf',
    
    async buildStart() {
      log.info('🚀 Protobuf plugin initialized')
      
      try {
        // 初始化时生成所有 proto 文件
        await generateAllProtos()
        
        // 启动监听（仅在开发模式）
        if (this.meta.watchMode) {
          startWatching()
        }
      } catch (error) {
        log.error(`Initialization failed: ${error}`)
        // 不阻止构建过程
      }
    },

    buildEnd() {
      if (watcher) {
        watcher.close()
        log.info('📁 Stopped watching proto files')
      }
    },

    // 处理虚拟模块（可选）
    resolveId(id) {
      if (id === 'virtual:protobuf-types') {
        return id
      }
    },

    load(id) {
      if (id === 'virtual:protobuf-types') {
        // 可以返回生成的类型导出
        return `export * from '${path.relative(process.cwd(), path.join(outputDir, 'index.ts')).replace(/\\/g, '/')}'`
      }
    }
  }
} 