const routes: CustomRouteRecord[] = [
	{
		path: '/test',
		name: '测试路由',
    component: () => import(/* webpackChunkName: "login" */ '@/views/test.vue'),
	},
  {
    path: '/list-demo',
    name: '列表Demo',
    component: () => import('@/views/listDemo.vue'),
  }, {
    path: '/form-demo',
    name: '表单页Demo',
    component: () => import('@/views/formDemo.vue')
  }
];

export default routes;
