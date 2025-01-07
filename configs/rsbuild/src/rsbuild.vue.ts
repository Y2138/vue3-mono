import { loadEnv, mergeRsbuildConfig, type RsbuildEntry, type RsbuildConfig, type RsbuildPlugins } from '@rsbuild/core';
import { pluginVue2 } from '@rsbuild/plugin-vue2';
import { pluginSass } from '@rsbuild/plugin-sass';
// import SentryWebpackPlugin from '@sentry/webpack-plugin';
import path from 'path';
import { pluginVue } from '@rsbuild/plugin-vue';

const resolve = (dir: string) => path.join(__dirname, dir);

const entryFile: RsbuildEntry = {
	index: './src/main.js', // 主项目
}
if (process.env.NODE_ENV === 'location') {
	entryFile.docs = './docs/index.js' // 组件文档
}



const copyAssets = [
	{ from: 'public/static/img/', to: resolve(`dist/zuozhe-platform/web/img/`), }
];
//灰度发布时，需要将静态资源文件复制到对应文件夹
if (process.env.GIT_BRANCH == 'package') {
	copyAssets.push({
		from: 'public/static/', to: `${process.env.npm_package_version}/static/`,
	});
}


interface IRsbuildVueConfig extends RsbuildConfig {
	/* 根目录 */
	rootDir: string
	/* 静态文件输出目录 */
	assetsDir: string
	vueVersion?: '2' | '3'
	useVuemd: boolean
}

export function defineVueConfig(configs: IRsbuildVueConfig, options: RsbuildConfig) {
	// VUE_APP_ 环境变量
	const { publicVars, rawPublicVars, } = loadEnv({ prefixes: ['VUE_APP_', 'NODE_ENV'], });
	// 项目路径配置
	const pathConfig = {
		outputDir: path.resolve(configs.rootDir, 'dist'),
		assetsDir: configs.assetsDir || '', // 静态文件输出目录
	};

	const entryFile: RsbuildEntry = {
		index: path.resolve(configs.rootDir, 'src/main.js'), // 主项目
	}
	if (process.env.NODE_ENV === 'location' && configs.useVuemd) {
		entryFile.docs = path.resolve(configs.rootDir, 'docs/index.js') // 组件文档
	}

	const defaultConfigOptions: RsbuildConfig = {
		html: {
			template: 'public/index.html',
		},
		plugins: [
			configs.vueVersion === '2' ? pluginVue2() : pluginVue(),
			pluginSass({
				sassLoaderOptions: {
					additionalData: `
						@import "@/assets/style/include/base.scss";
					`,
					sassOptions: {
						silenceDeprecations: ['import', 'legacy-js-api', 'css-function-mixin'],
					},
					// api: 'legacy',
				},
			})
		],
		source: {
			// 多入口
			entry: entryFile,
			// 别名
			alias: {
				'@': resolve('src'),
				'@docs': resolve('docs'),
			},
			// 环境变量
			define: {
				...publicVars,
				'process.env': JSON.stringify(rawPublicVars),
			},
			// 需要转化的按需引入npm包
			transformImport: [
				{
					libraryName: 'vxe-table',
					style: true, // 样式是否也按需加载
				},
				{
					libraryName: 'qm-npm-pc',
					libraryDirectory: 'lib',
				},
				{
					libraryName: 'q-ui-pc',
					libraryDirectory: 'lib',
				},
				{
					libraryName: 'q-element-ui',
					styleLibraryDirectory: 'theme-chalk',
				}
			],
	
			// 指定需要额外编译的js文件
			include: [
				path.dirname(require.resolve('q-element-ui')),
				path.dirname(require.resolve('echarts')),
				path.dirname(require.resolve('vue-echarts')),
				path.dirname(require.resolve('resize-detector')),
				path.dirname(require.resolve('canvas-confetti')),
				path.dirname(require.resolve('vxe-table')),
				path.dirname(require.resolve('qm-npm-pc')),
				path.dirname(require.resolve('q-ui-pc')),
	
				path.dirname(require.resolve('@qm-statistics-sdk/web')),
				/node_modules[\\/]@qm-statistics-sdk[\\/]/
			],
		},
		output: {
			assetPrefix: process.env.NODE_ENV === 'production'
				? 'https://cdn-front.qimao.com/'
				: '/',
			distPath: {
				root: pathConfig.outputDir,
				js: pathConfig.assetsDir + 'js/',
				css: pathConfig.assetsDir + 'css/',
				font: pathConfig.assetsDir + 'fonts/',
				image: pathConfig.assetsDir + 'img/',
			},
			copy: [...copyAssets],
			sourceMap: {
				js: process.env.NODE_ENV === 'production' ? 'source-map' : 'cheap-module-source-map',
				css: false,
			},
			polyfill: 'entry',
		},
		server: {
			proxy: {
				'/apiQM': {
					target: 'https://zuozhe.qimao.com',
					changeOrigin: true,
					secure: false,
					pathRewrite: {
						'^/apiQM': 'api',
					},
				},
				'/apiZongheng': {
					target: 'https://zuozhe.zongheng.com',
					changeOrigin: true,
					secure: false,
					pathRewrite: {
						'^/apiZongheng': 'api',
					},
				},
				'/bbs': {
					target: 'https://bbs.qimao.com',
					changeOrigin: true,
					secure: false,
					pathRewrite: {
						'^/bbs': '/api',
					},
				},
			},
		},
		// 构建性能相关配置
		performance: {
			removeConsole: true,
		},
		tools: {
			rspack: (config, { addRules }) => {
				if (configs.useVuemd) {
					// markdown解析配置
					const _markOptions = {
						// wrapperName: 'DemoBlock', // 定义 demo 包裹组件（请全局注册好组件），如果空则仅渲染 demo
						// fileDemoNamePerfix: 'FileDemo', // 文件 demo 组件名前缀
						// blockDemoNamePerfix: 'BlockCodeDemo', // 代码块 demo 组件名前缀
						fileDemoTag: 'demo:vue',
						blockDemoTag: 'demo:vue',
						includeCodeTag: 'include:code', // 导入code，渲染成代码
						includeRawTag: 'include:raw', // 导入html片段
						dest: false, // 输出结果文件 bool 或者 function
						// dest(code, contextPath, resourcePath) {}, // 自定义写文件
						markdown: { // markdown-it options see: https://github.com/markdown-it/markdown-it#init-with-presets-and-options
							options: {
								html: true,
							},
							notWrapper: false
						},
					};
					addRules({
						test: /\.md$/,
						use: [
							'vue-loader',
							{
								loader: 'vue-dotmd-loader',
								options: _markOptions
							}
						]
					})
				}
				// if (configs.useSentry && process.env.VUE_APP_ENV !== 'location') {
				// 	config.plugins?.push(
				// 		new SentryWebpackPlugin({
				// 			include: projectConfig.outputDir || '', // 作用的文件夹
				// 			release: process.env.VUE_APP_RELEASE_VERSION, // 一致的版本号
				// 			configFile: 'sentry.properties', // 不用改
				// 			ignore: ['node_modules', 'rsbuild.config.ts', 'src'],
				// 			ignoreFile: '.sentrycliignore',
				// 			urlPrefix: `~/`, // 注意这个，上传到sentry的路径需要与网页资源文件加载的一致（～表示域名）
				// 			// deleteAfterCompile: true
				// 		})
				// 	);
				// }
			},
		},
	}
	const _plugins: RsbuildPlugins = [];
	_plugins.push(configs.vueVersion && configs.vueVersion === '2' ? pluginVue2() : pluginVue());
	return mergeRsbuildConfig(defaultConfigOptions, options)
}
