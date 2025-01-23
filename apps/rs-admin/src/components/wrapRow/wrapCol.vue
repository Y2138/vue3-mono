<template>
  <n-flex :style="{ width: colWidth }" align="center" :wrap="false">
    <label v-if="label" :style="{ width: computedLabelWidth }" class="whitespace-nowrap flex-shrink-0">{{ label }}</label>
    <div :style="{ width: computedContentWidth }" :class="contentClass">
      <slot></slot>
    </div>
  </n-flex>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
defineOptions({
  name: 'WrapCol'
})
const { label, labelWidth = 'auto', contentWidth = '200px', contentClass = '' } = defineProps<{
  label?: string
  labelWidth?: string | number | 'auto'
  contentWidth?: string | number
  contentClass?: string
}>()
const injectedConfig = inject<{
  labelWidth: string | number | 'auto'
  cols: number
  size: 'small' | 'medium' | number
}>('wrapInjectKey')

function dealWidth(width: string | number | 'auto'): string {
  if (width === 'auto') {
    return 'auto'
  }
  return isNaN(Number(width)) ? width as string : `${width}px`
}

// 计算label宽度
const computedLabelWidth = computed(() => {
  if (labelWidth) {
    return dealWidth(labelWidth)
  }
  if (injectedConfig && injectedConfig.labelWidth) {
    return dealWidth(injectedConfig.labelWidth)
  }
  return 'auto'
})
const computedContentWidth = computed(() => {
  return dealWidth(contentWidth)
})

const colWidth = computed(() => {
  let col = 3
  if (injectedConfig) {
    if (injectedConfig.cols === 0) {
      return 'auto'
    } else {
      col = injectedConfig.cols
    }
  }
  const gap = injectedConfig?.size === 'small' ? 8 : injectedConfig?.size === 'medium' ? 16 : (injectedConfig?.size || 0)
  return `calc(${(100 / col).toFixed(2)}% - ${gap}px)`
})
</script>

<style scoped>

</style>
