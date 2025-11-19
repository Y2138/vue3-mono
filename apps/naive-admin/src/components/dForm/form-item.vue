<template>
  <n-form-item v-if="showComp" ref="nFormRef" :label="props.label" :path="props.valueKey" :rule="mergedRule">
    <span v-if="props.isText">
      {{ formModel[props.textKey || props.valueKey] || '' }}
    </span>
    <component v-else :is="componentsName[props.comp || 'NInput']" v-model:value="formModel[props.valueKey]" :options="curOptions" :placeholder="placeholder" v-bind="props.props || {}"> </component>
  </n-form-item>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, shallowReactive } from 'vue'
import type { IFormConfig, IOption } from './types'
import DDatePicker from './components/dDatePicker.vue'
import DRadio from './components/dRadio.vue'
import DCheckbox from './components/dCheckbox.vue'
import { NAutoComplete, NInput, NInputNumber, NSelect, NCascader, NMention, NTreeSelect } from 'naive-ui'
import type { FormInst, FormItemRule } from 'naive-ui'

defineOptions({
  name: 'DFormItem'
})

const componentsName = shallowReactive<Record<string, any>>({
  'n-input': NInput,
  'n-input-number': NInputNumber,
  'n-select': NSelect,
  'd-date-picker': DDatePicker,
  'd-radio': DRadio,
  'd-checkbox': DCheckbox,
  'n-auto-complete': NAutoComplete,
  'n-cascader': NCascader,
  'n-mention': NMention,
  'n-tree-select': NTreeSelect
})

const props = defineProps<
  IFormConfig & {
    selectOptions: Record<string, IOption[]>
  }
>()
const formModel = defineModel<Record<string, unknown>>('formModel', { required: true })

// placeholder
const attrs = useAttrs()
const placeholder = computed(() => {
  if (props.props && 'placeholder' in props.props) return props.props.placeholder
  return attrs.placeholder || `${(['d-select', 'd-date-picker'].includes(props.comp || '') ? '请选择' : '请填写') + props.label}`
})

const defaultRule: FormItemRule = {
  required: true,
  trigger: ['blur', 'change']
}
const mergedRule = computed(() => {
  if (props.required) {
    return [defaultRule, ...(Array.isArray(props.rules) ? props.rules : [props.rules])] as FormItemRule[]
  }
  return props.rules
})

// 组件筛选项
const curOptions = computed(() => {
  const { optionsKey } = props
  if (props.props && 'options' in props.props) {
    return props.props.options || []
  }
  if (optionsKey) {
    return props.selectOptions[optionsKey] || []
  }
  return []
})
// 判断当前组件是否展示
const showComp = computed(() => {
  if (!formModel.value) return false
  let unRefFormModel = formModel.value
  console.log('formModel===>', unRefFormModel)
  if (props.visibleLinks && props.visibleLinks.length) {
    if (typeof props.visibleLinks === 'function') {
      return props.visibleLinks(unRefFormModel)
    }
    return props.visibleLinks.some((link) => {
      let valid = true
      for (const key of Object.keys(link)) {
        if (!link[key].includes(unRefFormModel[key])) {
          valid = false
          break
        }
      }
      return valid
    })
  }
  return true
})

const nFormRef = ref<FormInst | null>(null)
defineExpose({
  validate: nFormRef.value?.validate
})
</script>

<style scoped></style>
