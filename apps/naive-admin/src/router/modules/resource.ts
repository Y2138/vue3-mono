import type { CustomRouteRecord } from '@/types/router'

const resourceRoutes: CustomRouteRecord = {
  path: '/resource',
  name: 'resource',
  redirect: '/resource/list',
  meta: {
    title: '资源管理'
  },
  children: [
    {
      path: 'list',
      name: 'resourceList',
      component: () => import('@/views/resources/index.vue'),
      meta: {
        title: '资源列表'
      }
    },
    {
      path: 'create',
      name: 'resourceCreate',
      component: () => import('@/views/resources/components/resource-form.vue'),
      meta: {
        title: '创建资源',
        activeMenuPath: '/resource/list'
      }
    },
    {
      path: 'edit/:id',
      name: 'resourceEdit',
      component: () => import('@/views/resources/components/resource-form.vue'),
      meta: {
        title: '编辑资源',
        activeMenuPath: '/resource/list'
      }
    }
  ]
}

export default resourceRoutes