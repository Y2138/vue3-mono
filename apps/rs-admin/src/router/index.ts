import { createRouter, createWebHistory } from 'vue-router';
import testRouters from './test-router'
import { Person, WifiOutline } from '@vicons/ionicons5'
import { useMenuStore } from '@/store/modules/menu';
import { useTabStore } from '@/store/modules/tab';

// const modules = import.meta.glob(`./*-router.ts`, { eager: true, import: 'default' });

export const routes: CustomRouteRecord[] = [
	{
		path: '/',
		name: '首页',
		component: () => import('@/views/home.vue'),
		meta: {
			title: '首页'
		}
	},
	{
		path: '/front/market',
		component: () => import('@/views/home.vue'),
		meta: {
			title: '市场素材审核管理',
			icon: 'Menu'
		},
		name: '市场素材审核管理',
		redirect: '/front/market/material',
		children: [
			{
				path: 'material',
				name: '市场素材审核',
				meta: {
					title: '市场素材审核',
					icon: Person
				},
				component: () => import('@/views/home.vue'),
				redirect: '/front/market/material/audit-list',
				children: [
					{
						path: 'audit-list',
						component: () => import('@/views/home.vue'),
						name: '市场素材初审',
						meta: {
							title: '市场素材初审',
							icon: 'Person'
						}
					},
					{
						path: 'recheck-list',
						component: () => import('@/views/home.vue'),
						name: '市场素材复审',
						meta: {
							title: '市场素材复审',
							icon: 'AddCircle'
						}
					},
					{
						path: 'script-audit',
						component: () => import('@/views/home.vue'),
						name: '脚本初审',
						meta: {
							title: '脚本初审',
							icon: 'AlertCircle'
						}
					},
					{
						path: 'script-recheck',
						component: () => import('@/views/home.vue'),
						name: '脚本复审',
						meta: {
							title: '脚本复审'
						}
					},
					{
						path: 'export',
						component: () => import('@/views/home.vue'),
						name: '导出管理',
						meta: {
							title: '导出管理',
							icon: WifiOutline
						}
					},
					{
						path: 'config',
						component: () => import('@/views/home.vue'),
						name: '配置管理',
						meta: {
							title: '配置管理'
						}
					},
					{
						path: 'strategy-lexicon',
						component: () => import('@/views/home.vue'),
						name: '策略词库',
						meta: {
							title: '策略词库'
						}
					}
				]
			}
		]
	},
	...testRouters
];

// console.log('routes modules: ', modules);
// let devNavRoutes = [...routes];
// let prdRoutesList = [...routes];

// for (const path in modules) {
// 	const module = modules[path] as any;
// 	const node = (module.default || []) as RouteRecordRaw[];
// 	devNavRoutes = devNavRoutes.concat(node);
// 	if (node && node.length) {
// 		node.forEach((item: any) => {
// 			prdRoutesList = prdRoutesList.concat(item.children || []);
// 		});
// 	}
// }

// export { devNavRoutes, prdRoutesList as routes };

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach((to, from, next) => {
	// console.log('to: ', to);
	// console.log('from: ', from);
  const menuStore = useMenuStore();
  menuStore.setActiveMenuKey(to.path);
  const tabStore = useTabStore();
  console.log('to => ', to)
  tabStore.activeTab(to.path, String(to.meta?.name || to.name));
  // 开启loadingBar
  window.$loadingBar.start()
  next();
});

router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('错误: ', failure)
  }
  // 关闭loadingBar
  window.$loadingBar.finish()
})

export default router;
