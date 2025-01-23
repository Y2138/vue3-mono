<template>
  <n-card size="small">
    <WrapRow :cols="computedCols" v-bind="$attrs">
      <slot></slot>
      <WrapCol v-if="inline" contentWidth="auto">
        <n-button size="small" type="primary" @click="handleSearch">查询</n-button>
        <n-button size="small" class="ml-4" @click="handleReset">重置</n-button>
      </WrapCol>
    </WrapRow>
    <n-flex v-if="!inline" size="small" class="mt-2">
      <n-button size="small" type="primary" @click="handleSearch">查询</n-button>
      <n-button size="small" @click="handleReset">重置</n-button>
    </n-flex>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
defineOptions({
  name: 'SearchPanel'
})

const emits = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
}>()
const { inline = false, cols = 3 } = defineProps<{
  formModel?: any
  inline?: boolean
  cols?: number
}>()
const computedCols = computed(() => {
  return inline ? 0 : cols
})

const handleSearch = () => {
  console.log('handleSearch')
  emits('search')
}
const handleReset = () => {
  console.log('handleReset')
  emits('search')
}
</script>

<style scoped>

</style>
