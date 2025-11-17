import { useMenuStore } from '@/store/modules/menu'
import { useTabStore } from '@/store/modules/tab'
import { useUserStore } from '@/store/modules/user'
import { NavigationGuardNext, RouteLocationNormalized, createRouter, createWebHistory } from 'vue-router'
import systemRoutes from './modules/system'
import resourceRoutes from './modules/resource'
import testRouters from './test-router'

// const modules = import.meta.glob(`./*-router.ts`, { eager: true, import: 'default' });

export const routes: CustomRouteRecord[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: '登录',
    component: () => import('@/views/auth/login.vue'),
    meta: {
      title: '用户登录',
      noAuth: true, // 不需要认证
      activeMenu: '/home' // 不在菜单中显示
    }
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
  resourceRoutes,
  ...testRouters
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  console.log('Router navigation:', { to: to.path, toFullPath: to.fullPath, from: from.path })

  const menuStore = useMenuStore()
  const userStore = useUserStore()

  // 开启loadingBar
  window.$loadingBar?.start()

  try {
    // 恢复用户状态（如果有存储的token）
    if (!userStore.isLoggedIn && userStore.authToken) {
      try {
        await userStore.fetchUserInfo()
      } catch (error) {
        console.warn('Failed to restore user session:', error)
        // 清除无效的token
        await userStore.logout()
      }
    }

    // 检查是否需要认证
    const requiresAuth = !to.meta?.noAuth
    const isLoggedIn = userStore.isLoggedIn

    // 登录验证
    if (requiresAuth && !isLoggedIn) {
      console.log('Authentication required, redirecting to login')
      window.$message?.warning('请先登录')
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始访问路径
      })
      return
    }

    // 如果已登录且尝试访问登录页，跳转到首页
    if (isLoggedIn && to.path === '/login') {
      console.log('Already logged in, redirecting to home')
      next({ path: '/home' })
      return
    }

    // 如果是相同路由的导航，直接返回
    if (from.fullPath === to.fullPath) {
      return next(false)
    }

    // 更新菜单和标签页状态
    menuStore.setActiveMenuKey(to.path)
    const tabStore = useTabStore()
    tabStore.activeTab(to.fullPath, String(to.meta?.title || to.name))

    next()
  } catch (error) {
    console.error('Router navigation error:', error)
    window.$message?.error('页面跳转失败')
    next(false)
  }
})

router.afterEach((_to: RouteLocationNormalized, _from: RouteLocationNormalized, failure: any) => {
  if (failure) {
    console.error('错误: ', failure)
  }
  // 关闭loadingBar
  window.$loadingBar.finish()
})

export default router
