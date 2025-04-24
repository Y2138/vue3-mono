<template>
  <div class="dForm-container" :style="{ gap: gap }">
    <div
      v-for="config in configs"
      :key="config.valueKey"
      class="dForm-item"
      :style="{ width: config.width ? config.width : itemWidth }"
    >
      <label
        class="dForm-label"
        :style="{ width: config.labelWidth ? config.labelWidth : labelWidth }"
        >{{ config.label }}</label
      >
      <div class="flex-1">
        <slot :name="config.valueKey" :config="config">
          <FormItem v-bind="config" :showValid="showValid">
            <template
              v-for="slotName in config.innerSlots"
              :key="slotName"
              v-slot:[`${slotName}`]
            >
              <slot :name="`${config.valueKey}_${slotName}`"></slot>
            </template>
          </FormItem>
        </slot>
      </div>
    </div>
    <div class="dForm-item"></div>
  </div>
</template>

<script setup lang="ts">
import {
  type FormItemProps,
  FormModelContextKey,
  type FormModelContext,
} from './types'
import { provide, defineProps, computed } from 'vue'
import FormItem from './item.vue'
import useReqOptions from './hooks/useReqOptions'

const {
  configs,
  cols = 2,
  gap = '4px',
  labelWidth = '100px',
  showValid = true,
  optionsApi = '',
  extraOptions = {},
} = defineProps<{
  configs: FormItemProps[]
  cols?: number
  gap?: number | string
  labelWidth?: string
  showValid?: boolean
  optionsApi?: string,
  extraOptions?: Record<string, any[]>
}>()

const selectOptions = useReqOptions(optionsApi, extraOptions);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const [model] = defineModel<Record<string, any>>({
  required: true,
})
// 更新数据
const updateModel: FormModelContext[1] = (valueKey, newVal) => {
  console.log('rootModel update==>', valueKey, newVal)
  model.value[valueKey] = newVal
}
const rootConfig = {
  showValid,
}
// 注入数据
provide<FormModelContext>(FormModelContextKey, [model, updateModel, selectOptions, rootConfig])

/* 样式计算 */
const itemWidth = computed(() => {
  return `calc(${(100 / cols).toFixed(2)}% - ${typeof gap === 'number' ? gap + 'px' : gap})`
})
</script>

<style scoped langs="scss">
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.dForm-item {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px 0;
  .dForm-label {
	text-align: right;
	padding-right: 10px;
  }
}
.dForm-container {
  display: flex;
  margin: 20px 0;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  .label {
    flex-shrink: 0;
  }
}
.flex-1 {
  flex: 1;
}
</style>
