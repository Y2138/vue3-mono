<template>
  <div class="flex items-center pl-2" :style="{ width: colWidth }">
    <label v-if="props.label" :style="{ width: computedLabelWidth }" class="whitespace-nowrap flex-shrink-0 mr-2">{{ props.label }}</label>
    <div class="flex-1" :class="contentClass">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
defineOptions({
  name: 'WrapCol'
})
const props = defineProps<{
  label?: string
  labelWidth?: string | number | 'auto'
  contentClass?: string
}>()
const injectedConfig = inject<{
  labelWidth: string | number | 'auto'
  cols: number
  inline: boolean
}>('wrapInjectKey')

function dealWidth(width: string | number | 'auto'): string {
  if (width === 'auto') {
    return 'auto'
  }
  return isNaN(Number(width)) ? (width as string) : `${width}px`
}

// 计算label宽度
const computedLabelWidth = computed(() => {
  if (props.labelWidth) {
    return dealWidth(props.labelWidth)
  }
  if (injectedConfig && injectedConfig.labelWidth) {
    return dealWidth(injectedConfig.labelWidth)
  }
  return 'auto'
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
  return `${(100 / col).toFixed(2)}%`
})
</script>

<style scoped></style>
