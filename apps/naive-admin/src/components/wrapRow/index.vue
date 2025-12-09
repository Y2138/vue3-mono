<template>
  <n-flex class="w-full" align="center" :size="size" v-bind="$attrs">
    <slot></slot>
  </n-flex>
</template>

<script setup lang="ts">
import { provide } from 'vue'
defineOptions({
  name: 'WrapRow'
})
const props = withDefaults(
  defineProps<{
    labelWidth?: string | number | 'auto'
    cols?: number
    size?: 'small' | 'medium' | number | [number, number]
  }>(),
  {
    labelWidth: 'auto',
    cols: 3,
    size: [0, 4]
  }
)
provide('wrapInjectKey', {
  labelWidth: props.labelWidth,
  cols: props.cols,
  size: props.size
})
</script>
