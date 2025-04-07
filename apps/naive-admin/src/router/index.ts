import { useMenuStore } from '@/store/modules/menu';
import { useTabStore } from '@/store/modules/tab';
import { NavigationGuardNext, RouteLocationNormalized, createRouter, createWebHistory } from 'vue-router';
import systemRoutes from './modules/system'
import testRouters from './test-router'

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
		path: '/operation',
		// component: () => import('@/views/home.vue'),
		meta: {
			title: '运营管理',
			icon: 'material-symbols:menu'
		},
		name: '运营管理',
		redirect: '/operation/column',
		children: [
			{
				path: 'column',
				name: '专栏管理',
				meta: {
					title: '专栏管理',
					icon: 'mdi:account'
				},
				component: () => import('@/views/operation-manage/column.vue')
			}
		]
	},
	systemRoutes,
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

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
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

router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized, failure: any) => {
  if (failure) {
    console.error('错误: ', failure)
  }
  // 关闭loadingBar
  window.$loadingBar.finish()
})

export default router;
