import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		path: '/test',
		name: '测试路由',
    	component: () => import(/* webpackChunkName: "login" */ '@/views/test.vue'),
    children: [
			
		],
	},
];

export default routes;
