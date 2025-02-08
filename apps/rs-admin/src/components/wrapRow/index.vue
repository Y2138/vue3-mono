<template>
    <n-flex class="w-full ml-[-0.5rem]" align="center" :size="size" v-bind="$attrs">
      <slot></slot>
    </n-flex>
</template>

<script setup lang="ts">
import { provide } from 'vue'
defineOptions({
  name: 'WrapRow'
})
const {
  labelWidth = 'auto',
  cols = 3,
  size = [0, 4]
} = defineProps<{
  labelWidth?: string | number | 'auto'
  cols?: number
  size?: 'small' | 'medium' | number | [number, number]
}>()
provide('wrapInjectKey', {
  labelWidth,
  cols,
  size
})
</script>

<style scoped>

</style>
