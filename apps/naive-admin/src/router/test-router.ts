const routes: CustomRouteRecord[] = [
  {
    path: '/test',
    name: '测试路由',
    component: () => import('@/views/demo/test.vue')
  },
  {
    path: '/test/list-demo',
    name: '列表Demo',
    component: () => import('@/views/demo/listDemo.vue')
  },
  {
    path: '/test/form-demo',
    name: '表单页Demo',
    component: () => import('@/views/demo/formDemo.vue')
  }
]

export default routes
