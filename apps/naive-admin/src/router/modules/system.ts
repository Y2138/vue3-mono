const systemRoutes: CustomRouteRecord = {
  path: '/system',
  name: 'System',
  redirect: '/system/role',
  meta: {
    title: '系统管理',
    icon: 'mdi:settings',
    sort: 1000,
  },
  children: [
    {
      path: 'role',
      name: 'SystemRole',
      component: () => import('@/views/system/role/RoleList.vue'),
      meta: {
        title: '角色管理',
        permissions: ['roles:read'],
      },
    },
    {
      path: 'permission',
      name: 'SystemPermission',
      component: () => import('@/views/system/permission/PermissionList.vue'),
      meta: {
        title: '权限管理',
        permissions: ['permissions:read'],
      },
    },
  ],
};

export default systemRoutes; 