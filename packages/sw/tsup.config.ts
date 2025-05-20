import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/sw.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
  external: ['workbox-window'],
  noExternal: ['workbox-window'],
  treeshake: true,
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': "'production'",
    };
  },
  // 复制模板文件到dist目录
  async onSuccess() {
    // 可以添加构建成功后的回调
    console.log('构建成功！');
  },
}); 