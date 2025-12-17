<template>
  <n-card size="small">
    <slot name="top"></slot>
    <WrapRow v-if="inline" class="ml--2" :cols="computedCols" v-bind="attrs">
      <slot> </slot>
      <WrapCol contentWidth="auto">
        <slot name="btn-affix"></slot>
        <n-button type="primary" @click="handleSearch">查询</n-button>
        <n-button class="ml-2" @click="handleReset">重置</n-button>
        <slot name="btn-suffix"></slot>
      </WrapCol>
    </WrapRow>
    <template v-else>
      <div class="flex flex-wrap items-center ml-[-0.5rem]">
        <WrapRow :labelWidth="props.labelWidth" :cols="computedCols" v-bind="attrs">
          <slot></slot>
        </WrapRow>
      </div>
      <div class="mt-2 flex items-center">
        <slot name="btn-affix"></slot>
        <n-button type="primary" :loading="props.searchLoading" @click="handleSearch">查询</n-button>
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
