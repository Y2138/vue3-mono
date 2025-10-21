import { useMenuStore } from '@/store/modules/menu'
import { useTabStore } from '@/store/modules/tab'
// import { useUserStore } from '@/store/modules/user';
import { NavigationGuardNext, RouteLocationNormalized, createRouter, createWebHistory } from 'vue-router'
import systemRoutes from './modules/system'
import testRouters from './test-router'

// const modules = import.meta.glob(`./*-router.ts`, { eager: true, import: 'default' });

export const routes: CustomRouteRecord[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: '首页',
    component: () => import('@/views/home.vue'),
    meta: {
      title: '首页'
    }
  },
  systemRoutes,
  ...testRouters
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  console.log('to: ', to)
  console.log('from: ', from)

  const menuStore = useMenuStore()
  // const userStore = useUserStore();
  // const token = userStore.getToken();

  // // 登录验证
  // if (!token && !to.meta?.noAuth) {
  //   // 如果没有token且不是无需验证的页面，则跳转到登录页
  //   window.$message.warning('请先登录');
  //   next({ path: '/login' });
  //   return;
  // }

  // // 如果已登录且尝试访问登录页，跳转到首页
  // if (token && to.path === '/login') {
  //   next({ path: '/' });
  //   return;
  // }

  menuStore.setActiveMenuKey(to.path)
  const tabStore = useTabStore()
  tabStore.activeTab(to.path, String(to.meta?.name || to.name))
  // 如果是相同路由的导航，直接返回
  if (from.path === to.path) {
    return next(false)
  }
  // 开启loadingBar
  window.$loadingBar.start()
  next()
})

router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized, failure: any) => {
  if (failure) {
    console.error('错误: ', failure)
  }
  // 关闭loadingBar
  window.$loadingBar.finish()
})

export default router
