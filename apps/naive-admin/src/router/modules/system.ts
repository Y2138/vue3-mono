const systemRoutes: CustomRouteRecord = {
  path: '/system-manage',
  name: 'systemManage',
  redirect: '/system-manage/person',
  meta: {
    title: '系统管理'
  },
  children: [
    {
      path: 'person',
      name: 'personManage',
      component: () => import('@/views/system/person/list.vue'),
      meta: {
        title: '人员管理'
      }
    },
    {
      path: 'person/detail',
      name: 'personDetail',
      component: () => import('@/views/system/person/detail.vue'),
      meta: {
        title: '人员详情',
        activeMenuPath: '/system-manage/person'
      }
    }
  ]
}

export default systemRoutes
