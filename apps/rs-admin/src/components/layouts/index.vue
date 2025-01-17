<template>
  <n-layout class="h-100%" content-class="h-100%" has-sider>
    <n-layout-sider
      ref="siderRef"
      :native-scrollbar="false"
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :collapsed="collapsed">
      <Menu></Menu>
    </n-layout-sider>
    <n-layout class="h-100%" content-class="w-100% flex flex-col">
      <n-layout-header>
        <Header></Header>
      </n-layout-header>
      <n-layout-content ref="contentRef" class="flex-1 w-100% h-0 mx-2 my-2" content-class="h-100%">
        <slot></slot>
      </n-layout-content>
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
import { useMessage } from 'naive-ui'

const menuStore = useMenuStore()
// 在window上挂载一个$message以在setup函数外使用
window.$message = useMessage();

const collapsed = computed(() => {
  return menuStore.collapsed
})
</script>

<style scoped>

</style>