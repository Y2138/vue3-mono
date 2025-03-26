<template>
  <n-date-picker
    v-model:formatted-value="curValue"
    v-bind="mergedProps">
  </n-date-picker>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DatePickerProps } from 'naive-ui'

const curValue = defineModel<string | [string, string] | null>('value', {
  required: true
})

const props = withDefaults(defineProps<{
  type?: DatePickerProps['type'],
  // value: string | [string, string]
}>(), {
  type: 'date'
})

// 定义通用的属性字段
const defaultProps: DatePickerProps = {
  closeOnSelect: true,
  clearable: true,
}

const defaultValueFormatConfig: Record<NonNullable<DatePickerProps['type']>, DatePickerProps['valueFormat']> = {
  date: 'yyyy-MM-dd',
  daterange: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  datetimerange: 'yyyy-MM-dd HH:mm:ss',
  month: 'yyyy-MM',
  monthrange: 'yyyy-MM',
  quarter: 'yyyy-QQQ',
  quarterrange: 'yyyy-QQQ',
  year: 'yyyy',
  yearrange: 'yyyy',
  week: 'yyyy-ww'
}
const mergedProps = computed(() => {
  return {
    ...defaultProps,
    valueFormat: defaultValueFormatConfig[props.type || 'date'],
    ...props,
  }
})
</script>

<style scoped>

</style>
