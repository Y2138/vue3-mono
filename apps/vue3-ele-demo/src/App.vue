<template>
  <div class="content">
    <Home></Home>
  </div>
</template>
<script setup>
// import { ref } from 'vue'
import Home from './views/home.vue'
</script>

<style scoped>
.content {
  margin: 0 auto;
  display: flex;
  width: 80%;
  min-height: 100vh;
  line-height: 1.1;
  text-align: center;
  flex-direction: column;
  justify-content: center;
}
</style>
