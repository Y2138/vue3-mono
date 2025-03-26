<template>
  <n-checkbox-group v-model:value="value" name="radiogroup" v-bind="$attrs">
    <n-space>
      <n-checkbox
        v-for="option in props.options"
        :key="option.value"
        v-bind="option">
      </n-checkbox>
    </n-space>
  </n-checkbox-group>
</template>

<script setup lang="ts">
import { IOption } from '../types';
import type { CheckboxProps } from 'naive-ui'

const value = defineModel<CheckboxProps['value']>('value', { required: true })

const props = defineProps<{
  options: Array<IOption & CheckboxProps>
}>()

</script>

<style scoped>

</style>
