<template>
  <n-form ref="formRef" :model="formModel">
    <template
      v-for="item in formConfigs"
      :key="item.valueKey">
      <d-form-item
        v-model:form-model="formModel"
        :selectOptions="selectOptions"
        v-bind="item"
        :path="item.valueKey"
        :rule="item.rule">
      </d-form-item>
    </template>
  </n-form>
</template>

<script setup lang="ts">
import DFormItem from './item.vue'
import type { IFormConfig, IOption } from './types'
const { formModel, selectOptions } = defineProps<{
  formModel: Record<string, any>
  formConfigs: IFormConfig[]
  selectOptions: Record<string, IOption[]>
}>()
</script>

<style scoped>

</style>
