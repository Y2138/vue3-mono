import { useMenuStore } from '@/store/modules/menu.ts';
import { useTabStore } from '@/store/modules/tab.ts';
import { useUserStore } from '@/store/modules/user.ts';
import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import systemRoutes from './modules/system.ts'

// const modules = import.meta.glob(`./*-router.ts`, { eager: true, import: 'default' });

export const routes: CustomRouteRecord[] = [
	{
		path: '/login',
		name: '登录',
		component: () => import('@/views/auth/login.vue'),
		meta: {
			title: '登录',
			hideInMenu: true,
			noAuth: true
		}
	},
	{
		path: '/register',
		name: '注册',
		component: () => import('@/views/auth/register.vue'),
		meta: {
			title: '注册',
			hideInMenu: true,
			noAuth: true
		}
	},
	{
		path: '/',
		name: '首页',
		component: () => import('@/views/home.vue'),
		meta: {
			title: '首页'
		}
	},
	systemRoutes,
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
	// console.log('to: ', to);
	// console.log('from: ', from);
  const menuStore = useMenuStore();
  const userStore = useUserStore();
  const token = userStore.getToken();
  
  // 登录验证
  if (!token && !to.meta?.noAuth) {
    // 如果没有token且不是无需验证的页面，则跳转到登录页
    window.$message.warning('请先登录');
    next({ path: '/login' });
    return;
  }
  
  // 如果已登录且尝试访问登录页，跳转到首页
  if (token && to.path === '/login') {
    next({ path: '/' });
    return;
  }
  
  menuStore.setActiveMenuKey(to.path);
  const tabStore = useTabStore();
  console.log('to => ', to)
  tabStore.activeTab(to.path, String(to.meta?.name || to.name));
  // 开启loadingBar
  window.$loadingBar.start()
  next();
});

router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized, failure: any) => {
  if (failure) {
    console.error('错误: ', failure)
  }
  // 关闭loadingBar
  window.$loadingBar.finish()
})

export default router;
