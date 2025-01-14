<template>
    <div>
        {{ loading ? '加载中...' : '这是主页' }}
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
const loading = ref(true)
onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 2000)
})
</script>

<style scoped>

</style>