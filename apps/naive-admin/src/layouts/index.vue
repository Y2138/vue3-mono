<template>
  <n-layout class="h-100%" content-class="h-100%" has-sider>
    <n-layout-sider ref="siderRef" :native-scrollbar="false" :width="244" bordered collapse-mode="width" :collapsed-width="64" :collapsed="collapsed">
      <Menu></Menu>
    </n-layout-sider>
    <n-layout class="h-100%" content-class="w-100% flex flex-col">
      <n-layout-header>
        <Header></Header>
      </n-layout-header>
      <n-spin class="flex-1 h-0 w-100% p-2" content-class="h-100%" :show="pageRefreshStatus">
        <n-layout-content ref="contentRef" class="h-100%" content-class="h-100%">
          <slot></slot>
        </n-layout-content>
      </n-spin>
      <n-layout-footer class="w100%">
        <Footer></Footer>
      </n-layout-footer>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Menu from './menu.vue'
import Header from './header.vue'
import Footer from './footer.vue'
import { useMenuStore } from '@/store/modules/menu'
import { useMessage, useLoadingBar } from 'naive-ui'
import { usePageLoading } from '@/hooks/usePageLoading'

const menuStore = useMenuStore()
// 在window上挂载一个$message以在setup函数外使用
window.$message = useMessage()
window.$loadingBar = useLoadingBar()

const collapsed = computed(() => {
  return menuStore.collapsed
})
const { pageRefreshStatus } = usePageLoading()
</script>
