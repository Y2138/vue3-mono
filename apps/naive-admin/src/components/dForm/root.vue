<template>
  <n-form ref="formRef" v-bind="unref(nFormProps)" :model="formModel">
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
import type { FormProps } from 'naive-ui'
import { toRefs, unref, withDefaults } from 'vue'

defineOptions({
  name: 'DFormRoot'
})

const formModel = defineModel<Record<string, unknown>>('formModel', { required: true })

type NFormProps = Omit<FormProps, 'model' | 'theme' | 'themeOverrides' | 'builtinThemeOverrides'>

const props = withDefaults(defineProps<{
  formConfigs: IFormConfig[]
  selectOptions: Record<string, IOption[]>
} & NFormProps>(), {
  showFeedback: true,
  showLabel: true,
  showRequireMark: true,
  labelAlign: 'right',
  labelPlacement: 'left'
})
const { formConfigs, selectOptions, ...nFormProps } = props
</script>

<style scoped>

</style>
