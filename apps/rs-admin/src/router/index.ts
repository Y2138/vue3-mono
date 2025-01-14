import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import testRouters from './test-router'
import {
	BookOutline as BookIcon,
	PersonOutline as PersonIcon,
	WineOutline as WineIcon,
} from '@vicons/ionicons5'
import { useMenuStore } from '@/store/modules/menu';
import { useTabStore } from '@/store/modules/tab';

// const modules = import.meta.glob(`./*-router.ts`, { eager: true, import: 'default' });

export const routes: RouteRecordRaw[] = [
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
			icon: BookIcon
		},
		name: '市场素材审核管理',
		redirect: '/front/market/material',
		children: [
			{
				path: 'material',
				name: '市场素材审核',
				meta: {
					title: '市场素材审核',
					icon: PersonIcon
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
							icon: PersonIcon
						}
					},
					{
						path: 'recheck-list',
						component: () => import('@/views/home.vue'),
						name: '市场素材复审',
						meta: {
							title: '市场素材复审'
						}
					},
					{
						path: 'script-audit',
						component: () => import('@/views/home.vue'),
						name: '脚本初审',
						meta: {
							title: '脚本初审'
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
							icon: WineIcon
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
  next();
});

export default router;
