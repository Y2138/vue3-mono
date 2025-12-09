<template>
  <n-card size="small">
    <slot name="top"></slot>
    <WrapRow v-if="inline" :cols="computedCols" v-bind="attrs">
      <slot>
        <WrapCol></WrapCol>
      </slot>
      <WrapCol contentWidth="auto">
        <slot name="btn-affix"></slot>
        <n-button size="small" type="primary" @click="handleSearch">查询</n-button>
        <n-button size="small" class="ml-4" @click="handleReset">重置</n-button>
        <slot name="btn-suffix"></slot>
      </WrapCol>
    </WrapRow>
    <template v-if="!inline">
      <div class="flex flex-wrap items-center ml-[-0.5rem]">
        <WrapRow :labelWidth="props.labelWidth" :cols="computedCols" v-bind="attrs">
          <slot></slot>
        </WrapRow>
      </div>
      <div class="mt-2">
        <slot name="btn-affix"></slot>
        <n-button type="primary" :disabled="props.searchLoading" @click="handleSearch">查询</n-button>
        <n-button class="ml-2" :disabled="props.searchLoading" @click="handleReset">重置</n-button>
        <slot name="btn-suffix"></slot>
      </div>
    </template>
    <slot name="bottom"></slot>
  </n-card>
</template>

<script setup lang="ts">
import { computed, useAttrs, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
interface SearchPanelProps {
  formModel?: any
  inline?: boolean
  cols?: number
  labelWidth?: string | number
  searchOnUpdate?: boolean
  searchLoading?: boolean
}

defineOptions({
  name: 'SearchPanel',
  inheritAttrs: false
})

const attrs = useAttrs()

const emits = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
}>()

const props = withDefaults(defineProps<SearchPanelProps>(), {
  inline: false,
  cols: 4,
  searchOnUpdate: false
})
const computedCols = computed(() => {
  return props.inline ? 0 : props.cols
})
const debounceSearch = useDebounceFn(() => {
  emits('search')
}, 350)

watch(
  () => props.formModel,
  () => {
    // console.log('2501 formUpdate: ', props)
    if (props.searchOnUpdate) {
      debounceSearch()
    }
  },
  {
    deep: true
  }
)

const handleSearch = () => {
  // console.log('handleSearch')
  emits('search')
}
const handleReset = () => {
  // console.log('handleReset')
  emits('reset')
}
</script>
