<template>
  <n-config-provider :theme="themeVar" :theme-overrides="theme === 'dark' ? darkThemeOverrides : lightThemeOverrides" :locale="zhCN" :date-locale="dateZhCN" inline-theme-disabled>
    <n-dialog-provider>
      <n-message-provider>
        <n-loading-bar-provider>
          <RouterView v-if="!showLayout"></RouterView>
          <Layout v-else>
            <RouterView :key="fullPath + pageRefreshKey"></RouterView>
          </Layout>
        </n-loading-bar-provider>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import Layout from '@/layouts/index.vue'
import { RouterView, useRoute } from 'vue-router'
import { useGlobalStore } from './store/modules/global'
import { storeToRefs } from 'pinia'
import { darkTheme, zhCN, dateZhCN, GlobalThemeOverrides } from 'naive-ui'

const route = useRoute()
const { fullPath } = toRefs(route)
const { pageRefreshKey, theme } = storeToRefs(useGlobalStore())
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#3954ff',
    primaryColorHover: '#5c7cff',
    primaryColorPressed: '#2540d9',
    primaryColorSuppl: '#2540d9',
    // color
    textColorBase: '#3954ff'
  },
  Tag: {
    textColorInfo: '#3954ff'
  },
  Dialog: {
    contentMargin: '16px 0'
  }
}
const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#5c7cff',
    primaryColorHover: '#7aa2ff',
    primaryColorPressed: '#3954ff',
    primaryColorSuppl: '#3954ff',
    // color
    textColorBase: '#e0e7ff'
  },
  Tag: {
    textColorInfo: '#e0e7ff'
  },
  Dialog: {
    contentMargin: '16px 0'
  },
  Input: {
    color: 'rgb(24, 24, 28)',
    colorActive: 'rgb(24, 24, 28)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  InternalSelection: {
    color: 'rgb(24, 24, 28)',
    colorActive: 'rgb(24, 24, 28)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  }
}
const themeVar = computed(() => {
  return theme.value === 'dark' ? darkTheme : null
})

const showLayout = computed(() => {
  // 安全检查：确保 route 和 route.path 存在
  if (!route || !route.path) {
    return false
  }
  return route.path !== '/login' && route.path !== '/register'
})
</script>

<style scoped>
.content {
  display: flex;
  min-height: 100vh;
  line-height: 1.1;
  text-align: center;
  flex-direction: column;
  justify-content: center;
}

.content h1 {
  font-size: 3.6rem;
  font-weight: 700;
}

.content p {
  font-size: 1.2rem;
  font-weight: 400;
  opacity: 0.5;
}
</style>
