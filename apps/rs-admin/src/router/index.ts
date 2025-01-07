import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import testRouters from './test-router'
// import { RouterTy } from '@/types/router';

// const modules = import.meta.glob(`./*-router.ts`, { eager: true, import: 'default' });

export const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: '主页',
		component: () => import(/* webpackChunkName: "login" */ '@/views/home.vue'),
		meta: {
			layout: false,
		},
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

export default router;
