<template>
  <n-layout class="h-100%" content-class="h-100%" has-sider>
    <n-layout-sider ref="siderRef" :native-scrollbar="false" bordered>
      <Menu></Menu>
    </n-layout-sider>
    <n-layout class="h-100%" content-class="w-100%">
      <n-layout-header>
        <Header></Header>
      </n-layout-header>
      <n-layout-content ref="contentRef" class="flex-1 w-100% h-100% mx-2 my-2" content-class="h-100%">
        <slot></slot>
      </n-layout-content>
      <n-layout-footer class="w100%">
        <Footer></Footer>
      </n-layout-footer>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import Menu from './menu.vue'
import Header from './header.vue';
import Footer from './footer.vue';
</script>

<style scoped>

</style>