<template>
  <div>
    {{ loading ? '加载中...' : '这是主页' }}
    <n-button @click="loadIcon('accessibility')">
      加载Accessibility图标
    </n-button>
    <n-button @click="loadIcon('menu')">
      加载Menu图标
    </n-button>
    <Icon :icon="currentIcon" width="24" height="24" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
const loading = ref(true)
const currentIcon = ref('ion:accessibility')

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 2000)
})

function loadIcon(iconName: string) {
  currentIcon.value = `ion:${iconName}`
}
</script>

<style scoped>

</style>