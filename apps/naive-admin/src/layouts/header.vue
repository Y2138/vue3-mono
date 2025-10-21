<template>
  <div class="px-2 pt-4 pb-2">
    <div class="flex-center mb-2">
      <div class="flex-1 w-0 flex-start">
        <Icon class="cursor-pointer" :class="menuStore.collapsed ? 'transform-rotate-180' : ''" icon="ion:chevron-back-circle-outline" width="20" height="20" @click="handleToggleMenu"></Icon>
        <n-breadcrumb class="ml-2">
          <n-breadcrumb-item v-for="item in menuRoutes" :key="item.path" @click="handleLinkClick(item)">
            {{ item.name }}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>

      <n-space size="large" class="mr-5" align="center" item-class="flex">
        <Icon icon="ion:search" width="20" height="20" class="cursor-pointer"></Icon>
        <Icon icon="ion:sunny-sharp" width="20" height="20" class="cursor-pointer" @click="handleChangeTheme" title="切换主题"></Icon>
        <Icon icon="ion:refresh" width="20" height="20" class="cursor-pointer animate-keyframes-spin" @click="handleRefresh" title="刷新"></Icon>
        <n-dropdown trigger="click" :options="userOptions" @select="handleUserAction">
          <div class="flex-center cursor-pointer">
            <n-avatar class="mr-2" round size="small" :src="userAvatar" />
            <span>{{ userInfo?.username || '未登录' }}</span>
          </div>
        </n-dropdown>
      </n-space>
    </div>
    <TabBar></TabBar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'
import { Icon } from '@iconify/vue'
import TabBar from './tabBar.vue'
import { useRouter } from 'vue-router'
import { useMenuStore } from '@/store/modules/menu'
import { useGlobalStore } from '@/store/modules/global'
import { usePageLoading } from '@/hooks/usePageLoading'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const globalStore = useGlobalStore()
const userStore = useUserStore()
const { refresh } = usePageLoading()
const menuStore = useMenuStore()
const menuRoutes = computed(() => menuStore.menuRoutes)

// 用户信息
const userInfo = computed(() => userStore.userInfo)
// 用户头像
const userAvatar = ref('https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg')

// 用户下拉菜单选项
const userOptions = [
  {
    label: '个人信息',
    key: 'profile',
    icon: () => h(Icon, { icon: 'ion:person' })
  },
  {
    label: '修改密码',
    key: 'password',
    icon: () => h(Icon, { icon: 'ion:key' })
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(Icon, { icon: 'ion:exit' })
  }
]

// 处理用户下拉菜单事件
const handleUserAction = async (key: string) => {
  if (key === 'logout') {
    try {
      await userStore.logout()
      window.$message.success('退出登录成功')
      router.push('/login')
    } catch (error) {
      console.error('退出登录失败', error)
      window.$message.error('退出登录失败')
    }
  } else if (key === 'profile') {
    // 跳转到个人信息页面
    window.$message.info('功能开发中...')
  } else if (key === 'password') {
    // 跳转到修改密码页面
    window.$message.info('功能开发中...')
  }
}

// 跳转
const handleLinkClick = (item: any) => {
  router.push(item.path)
}
const handleToggleMenu = () => {
  menuStore.toggleCollapse()
}
const handleRefresh = () => {
  refresh()
}
const handleChangeTheme = () => {
  globalStore.toggleTheme()
}
</script>
