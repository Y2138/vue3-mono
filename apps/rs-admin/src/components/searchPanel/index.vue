<template>
  <n-card size="small">
    <slot name="top"></slot>
    <WrapRow :cols="computedCols" v-bind="$attrs">
      <slot></slot>
      <WrapCol v-if="inline" contentWidth="auto">
        <n-button size="small" type="primary" @click="handleSearch">查询</n-button>
        <n-button size="small" class="ml-4" @click="handleReset">重置</n-button>
      </WrapCol>
    </WrapRow>
    <n-flex v-if="!inline" size="small" class="mt-2 mx-2">
      <n-button type="primary" :disabled="props.searchLoading" @click="handleSearch">查询</n-button>
      <n-button :disabled="props.searchLoading" @click="handleReset">重置</n-button>
    </n-flex>
    <slot name="bottom"></slot>
  </n-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
interface SearchPanelProps {
  formModel?: any
  inline?: boolean
  cols?: number
  searchOnUpdate?: boolean
  searchLoading?: boolean
}

defineOptions({
  name: 'SearchPanel'
})

const emits = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
}>()

const props = withDefaults(
  defineProps<SearchPanelProps>(), {
    inline: false,
    cols: 3,
    searchOnUpdate: false
  }
)
const computedCols = computed(() => {
  return props.inline ? 0 : props.cols
})

watch(
  () => props.formModel,
  () => {
    console.log('2501 formUpdate: ', props)
    if (props.searchOnUpdate) {
      emits('search')
    }
  }, {
    deep: true
  }
)

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
