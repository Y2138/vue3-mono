<template>
  <n-config-provider inline-theme-disabled>
    <Layout>
      <RouterView></RouterView>
    </Layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import Layout from '@/components/layouts/index.vue'
import { RouterView } from 'vue-router';

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
