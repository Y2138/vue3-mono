<template>
  <n-radio-group v-model:value="value" name="radiogroup" v-bind="$attrs">
    <n-space>
      <n-radio
        v-for="option in props.options"
        :key="option.value"
        v-bind="option">
        {{ option.label }}
      </n-radio>
    </n-space>
  </n-radio-group>
</template>

<script setup lang="ts">
import { IOption } from '../types';
import type { RadioProps } from 'naive-ui'

const value = defineModel<string | number | boolean>('value', { required: true })

const props = defineProps<{
  options: Array<IOption & RadioProps>
}>()

</script>

<style scoped>

</style>
