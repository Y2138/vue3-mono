<template>
  <n-form ref="dRootFormRef" v-bind="unref(nFormProps)" :model="formModel">
    <n-flex justify="space-between">
      <template v-for="item in formConfigs" :key="item.valueKey">
        <d-form-item v-model:form-model="formModel" style="width: 48%" :selectOptions="selectOptions" v-bind="item" :path="item.valueKey" :rule="item.rules"> </d-form-item>
      </template>
    </n-flex>
  </n-form>
</template>

<script setup lang="ts">
import DFormItem from './form-item.vue'
import type { DFormRootProp } from './types'
import { unref, withDefaults, useTemplateRef } from 'vue'
import type { FormInst } from 'naive-ui'

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

const formRef = useTemplateRef<FormInst>('dRootFormRef')

defineExpose({
  validate: () => formRef.value?.validate(),
  restoreValidation: () => formRef.value?.restoreValidation()
})
</script>
