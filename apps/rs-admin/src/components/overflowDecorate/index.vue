<template>
  <el-tooltip effect="light" :content="title" :disabled="!isOverflow">
    <p ref="overflowDecorateRef" :class="`truncate ${contentClass}`" :style="contentStyle" uc-truncate
      bg="blue-400 hover:blue-500">
      {{ title }}
    </p>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComputedRef, type StyleValue } from 'vue'
const {
  title = '',
  line = 1,
  contentClass = '',
} = defineProps<{
  title: string
  line?: number
  contentClass?: string
}>()
const isOverflow = ref(false)
const overflowDecorateRef = ref<HTMLElement>()
const contentStyle: ComputedRef<StyleValue> = computed(() => {
  // 多行使用 webkit-box
  if (line === 2 && isOverflow.value) {
    return {
      display: '-webkit-box',
      'line-clamp': line,
      '-webkit-line-clamp': line,
      '-webkit-box-orient': 'vertical',
      'white-space': 'normal',
    }
  }
  // 单行直接使用 truncate class即可
  return {}
})
function computeTruncate() {
  if (overflowDecorateRef.value) {
    console.log(
      '2412==> ',
      overflowDecorateRef.value.scrollWidth,
      overflowDecorateRef.value.offsetWidth,
    )
    // 计算scrollWidth是否大于offsetWidth * line
    isOverflow.value =
      overflowDecorateRef.value.scrollWidth > overflowDecorateRef.value.offsetWidth * line
    if (!isOverflow.value) {
      overflowDecorateRef.value.style['whiteSpace'] = 'normal'
    }
  }
}
// 初始化渲染后计算
onMounted(() => {
  computeTruncate()
})
// 监听变动后计算
watch(
  () => title,
  () => {
    nextTick(() => {
      computeTruncate()
    })
  },
)
</script>

<style scoped></style>