<template>
  <n-form ref="formRef" v-bind="unref(nFormProps)" :model="formModel">
    <template v-for="item in formConfigs" :key="item.valueKey">
      <d-form-item v-model:form-model="formModel" :selectOptions="selectOptions" v-bind="item" :path="item.valueKey" :rule="item.rule"> </d-form-item>
    </template>
  </n-form>
</template>

<script setup lang="ts">
import DFormItem from './item.vue'
import type { DFormRootProp } from './types'
import { unref, withDefaults } from 'vue'

defineOptions({
  name: 'DFormRoot'
})

const formModel = defineModel<Record<string, unknown>>('formModel', { required: true })

const props = withDefaults(defineProps<DFormRootProp>(), {
  showFeedback: true,
  showLabel: true,
  showRequireMark: true,
  labelAlign: 'right',
  labelPlacement: 'left'
})

const { formConfigs, selectOptions, ...nFormProps } = props
</script>
