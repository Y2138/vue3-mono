const systemRoutes: CustomRouteRecord = {
  path: '/system-manage',
  name: 'systemManage',
  redirect: '/system-manage/user',
  meta: {
    title: '系统管理'
  },
  children: [
    {
      path: 'user',
      name: 'userManage',
      component: () => import('@/views/system/user/list.vue'),
      meta: {
        title: '人员管理'
      }
    },
    {
      path: 'user/create',
      name: 'userCreate',
      component: () => import('@/views/system/user/form.vue'),
      meta: {
        title: '新增人员',
        activeMenuPath: '/system-manage/user'
      }
    },
    {
      path: 'user/edit',
      name: 'userEdit',
      component: () => import('@/views/system/user/form.vue'),
      meta: {
        title: '编辑人员',
        activeMenuPath: '/system-manage/user'
      }
    },
    {
      path: 'user/detail',
      name: 'userDetail',
      component: () => import('@/views/system/user/form.vue'),
      meta: {
        title: '人员详情',
        activeMenuPath: '/system-manage/user'
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
      component: () => import('@/views/system/resources/components/ResourceForm.vue'),
      meta: {
        title: '创建资源',
        activeMenuPath: '/system-manage/resource'
      }
    },
    {
      path: 'resource/edit',
      name: 'resourceEdit',
      component: () => import('@/views/system/resources/components/ResourceForm.vue'),
      meta: {
        title: '编辑资源',
        activeMenuPath: '/system-manage/resource'
      }
    },
    {
      path: 'role',
      name: 'RoleList',
      component: () => import('@/views/system/role/index.vue'),
      meta: {
        title: '角色列表',
        permission: 'role:read'
      }
    },
    {
      path: 'role/create',
      name: 'RoleCreate',
      component: () => import('@/views/system/role/create.vue'),
      meta: {
        title: '创建角色',
        permission: 'role:create',
        hidden: true,
        activeMenuPath: '/system-manage/role'
      }
    },
    {
      path: 'role/edit',
      name: 'RoleEdit',
      component: () => import('@/views/system/role/edit.vue'),
      meta: {
        title: '编辑角色',
        permission: 'role:update',
        hidden: true,
        activeMenuPath: '/system-manage/role'
      }
    }
  ]
}

export default systemRoutes
