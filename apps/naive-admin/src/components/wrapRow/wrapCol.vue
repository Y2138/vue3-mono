<template>
  <div class="flex items-center pl-2 relative" :style="{ width: colWidth }">
    <label v-if="isInputComp" class="text-xs absolute top--1.5 left-4 color-primary-500 lh-3 bg-white px-1 z-10">{{ props.label }}</label>
    <label v-else :style="{ width: computedLabelWidth }" class="whitespace-nowrap flex-shrink-0 mr-2">{{ props.label }}</label>
    <div class="flex-1" :class="contentClass">
      <slot> {{ slotContent }} </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, useSlots } from 'vue'
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

const slots = useSlots()
const slotContent = slots.default?.() || ''

const InputCompNames = ['Input', 'Select', 'DatePicker', 'AutoComplete', 'Cascader', 'Mention', 'TreeSelect']

// 判断是否是 类input 的组件
const isInputComp = computed(() => {
  if (typeof slotContent === 'string') {
    return false
  }
  console.log(slotContent)
  for (const vnode of slotContent) {
    if (typeof vnode.type === 'object') {
      const { name: compName } = vnode.type as any
      if (InputCompNames.includes(compName)) {
        return true
      }
    }
  }
  return false
})

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
