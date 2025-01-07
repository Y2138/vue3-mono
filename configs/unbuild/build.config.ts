import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    entries: ['src/index.ts'], // 入口文件
    outDir: 'lib', //
    rollup: {
        emitCJS: true
    },
    declaration: true
})