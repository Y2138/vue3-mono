const routes: CustomRouteRecord[] = [
	{
		path: '/test',
		name: '测试路由',
    	component: () => import(/* webpackChunkName: "login" */ '@/views/test.vue'),
    children: [
			
		],
	},
];

export default routes;
