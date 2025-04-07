<template>
  <n-checkbox-group v-model:value="value" name="radiogroup" v-bind="$attrs">
    <n-space>
      <n-checkbox v-for="option in props.options" :key="option.value" v-bind="option">
      </n-checkbox>
    </n-space>
  </n-checkbox-group>
</template>

<script setup lang="ts">
import type { CheckboxGroupProps, CheckboxProps } from 'naive-ui'
import type { IOption } from '../types'

const value = defineModel<CheckboxGroupProps['value']>('value', { required: true })

const props = defineProps<{
  options: Array<IOption & CheckboxProps>
}>()

</script>

<style scoped></style>
