<template>
  <div>
    {{ loading ? '加载中...' : '这是主页' }}
    <n-button @click="loadIcon1('Accessibility')">
      加载Accessibility图标
    </n-button>
    <n-button @click="loadIcon1('Menu')">
      加载Menu图标
    </n-button>
    <n-button @click="loadIcon2">
      加载全图标
    </n-button>
    <n-icon>
      <component :is="dynamicContent"></component>
    </n-icon>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted, h, type VNode } from 'vue';
const loading = ref(true)


onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 2000)
})

const dynamicContent = ref<VNode>()
async function loadIcon1(iconName: string) {
  const AccessibilityIcon = await import(`@vicons/ionicons5/${iconName}`)
  console.log('2501=> ', AccessibilityIcon.default)
  dynamicContent.value = h(AccessibilityIcon.default)
}
async function loadIcon2() {
  const allIcons = await import('@vicons/ionicons5')
  console.log('2501=> ', allIcons.Accessibility)
  dynamicContent.value = h(allIcons.Accessibility)
}
</script>

<style scoped>

</style>