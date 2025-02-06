<template>
  <n-date-picker
    v-if="props.type?.includes('range')"
    v-model:formatted-value="value"
    :type="props.type"
    v-bind="mergedProps"
    @update:formatted-value="handleChange">
  </n-date-picker>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import type { DatePickerProps } from 'naive-ui'

const props = defineProps<{
  type: DatePickerProps['type'],
  value: string | [string, string]
}>()
const attrs = useAttrs()
const emits = defineEmits<{
  'update:value': [value: string | [string, string]]
}>()
const handleChange = (value: [string, string]) => {
  emits('update:value', value)
}

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
    ...attrs
  }
})
</script>

<style scoped>

</style>
