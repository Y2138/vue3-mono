<template>
  <n-config-provider :theme="themeVar" :locale="zhCN" :date-locale="dateZhCN" inline-theme-disabled>
    <n-message-provider>
      <Layout>
        <RouterView :key="fullPath + pageRefreshKey"></RouterView>
      </Layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import Layout from '@/layouts/index.vue'
import { RouterView, useRoute } from 'vue-router';
import { useGlobalStore } from './store/modules/global';
import { storeToRefs } from 'pinia';
import { darkTheme, zhCN, dateZhCN } from 'naive-ui';

const route = useRoute()
const { fullPath } = toRefs(route)
const { pageRefreshKey, theme } = storeToRefs(useGlobalStore())
const themeVar = computed(() => {
  return theme.value === 'dark' ? darkTheme : null
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
