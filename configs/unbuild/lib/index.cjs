'use strict';

const unbuild = require('unbuild');
const path = require('path');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const path__default = /*#__PURE__*/_interopDefaultCompat(path);

const presetConfig = {
  entries: ["src/index.ts"],
  // 入口文件
  outDir: "lib",
  // 构建输出的文件夹名
  name: "",
  // 构建生成的文件名
  // rootDir: 'src', // 用于指定 ts 源代码文件的根目录
  clean: true,
  // 用于控制是否打包前清空目录
  sourcemap: false,
  // 是否生成map文件
  declaration: true,
  // 用于配置是否生成 `.d.ts` 文件
  stub: false,
  // 开启后，构建产物使用 jiti 链接，后续打包后的源码会实时更新，开发中使用
  stubOptions: {},
  // 指定一些 `jiti` 的配置
  // externals: [], // 指定一些需要排除的外部依赖
  alias: {
    // 导入别名配置
    "@": "./src"
  },
  // replace: { // 配置构建过程中的文本替换规则
  //     __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  // },
  rollup: {
    emitCJS: true
  },
  // rollup的配置
  preset: {}
  // 用于指定预设的构建配置；可以是对象，也可以是函数
  // 在 unbuild 中，hooks 配置用于定义构建过程中的钩子函数，以便在特定的构建阶段执行自定义的操作。
  // 这个配置允许你在构建过程中插入自定义的逻辑，以满足特定的需求或执行额外的操作。以下是 unbuild 目前支持的 hook
  // hooks: fn,hooks
};
function exportBuildConfig(pathConfig, customConfig) {
  return unbuild.defineBuildConfig({
    entries: [path__default.resolve(pathConfig.rootDir, "src/index.ts")],
    // 入口文件
    outDir: path__default.resolve(pathConfig.rootDir, "lib"),
    // 构建输出的文件夹名
    name: "",
    // 构建生成的文件名
    rootDir: path__default.resolve(pathConfig.rootDir, "src"),
    // 用于指定 ts 源代码文件的根目录
    clean: true,
    // 用于控制是否打包前清空目录
    sourcemap: false,
    // 是否生成map文件
    declaration: true,
    // 用于配置是否生成 `.d.ts` 文件
    stub: false,
    // 开启后，构建产物使用 jiti 链接，后续打包后的源码会实时更新，开发中使用
    stubOptions: {},
    // 指定一些 `jiti` 的配置
    // externals: [], // 指定一些需要排除的外部依赖
    // alias: { // 导入别名配置
    //     "@": './src'
    // },
    // replace: { // 配置构建过程中的文本替换规则
    //     __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    // },
    rollup: {},
    // rollup的配置
    preset: {},
    // 用于指定预设的构建配置；可以是对象，也可以是函数
    // 在 unbuild 中，hooks 配置用于定义构建过程中的钩子函数，以便在特定的构建阶段执行自定义的操作。
    // 这个配置允许你在构建过程中插入自定义的逻辑，以满足特定的需求或执行额外的操作。以下是 unbuild 目前支持的 hook
    // hooks: fn,hooks 
    ...customConfig
  });
}

exports.exportBuildConfig = exportBuildConfig;
exports.presetConfig = presetConfig;
