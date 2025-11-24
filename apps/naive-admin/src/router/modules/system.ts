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
    },
    {
      path: 'resource',
      name: 'resourceList',
      component: () => import('@/views/system/resources/index.vue'),
      meta: {
        title: '资源管理'
      }
    },
    {
      path: 'resource/create',
      name: 'resourceCreate',
      component: () => import('@/views/system/resources/components/resource-form.vue'),
      meta: {
        title: '创建资源',
        activeMenuPath: '/system-manage/resource'
      }
    },
    {
      path: 'resource/edit',
      name: 'resourceEdit',
      component: () => import('@/views/system/resources/components/resource-form.vue'),
      meta: {
        title: '编辑资源',
        activeMenuPath: '/system-manage/resource'
      }
    }
    // {
    //   path: 'role',
    //   name: 'roleManage',
    //   component: () => import('@/views/system/role/list.vue'),
    //   meta: {
    //     title: '角色管理'
    //   }
    // },
    // {
    //   path: 'role/create',
    //   name: 'roleCreate',
    //   component: () => import('@/views/system/role/form.vue'),
    //   meta: {
    //     title: '创建角色',
    //     activeMenuPath: '/system-manage/role'
    //   }
    // },
    // {
    //   path: 'role/edit',
    //   name: 'roleEdit',
    //   component: () => import('@/views/system/role/form.vue'),
    //   meta: {
    //     title: '编辑角色',
    //     activeMenuPath: '/system-manage/role'
    //   }
    // },
  ]
}

export default systemRoutes
