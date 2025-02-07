<template>
  <n-form-item
    v-if="showComp"
    :path="props.valueKey"
    :rule="props.rule">
    <span v-if="props.isTxt">
      {{ formModel[props.textKey || props.valueKey] || '' }}
    </span>
    <component
      v-else
      :is="componentsName[props.comp || 'NInput']"
      v-model="formModel[props.valueKey]"
      :options="curOptions"
      :placeholder="placeholder"
      v-bind="props.props || {}">
    </component>
  </n-form-item>
</template>

<script setup lang="ts">
import { computed, useAttrs, shallowReactive } from 'vue'
import type { IFormConfig, IOption } from './types'
import DDatePicker from './components/dDatePicker.vue'
import { NInput } from 'naive-ui'

const componentsName = shallowReactive<Record<string, any>>({
  NInput,
  DDatePicker
})


const props = defineProps<IFormConfig & {
  selectOptions: Record<string, IOption[]>
}>()
const formModel = defineModel<Record<string, any>>('formModel', { required: true })

// placeholder
const attrs = useAttrs()
const placeholder = computed(() => {
  if (props.props && 'placeholder' in props.props) return props.props.placeholder;
  return attrs.placeholder || `${(['d-select', 'd-date-picker'].includes(props.comp || '') ? '请选择' : '请填写') + props.label}`;
})

// 组件筛选项
const curOptions = computed(() => {
  const { optionsKey } = props
  const { options } = props.props || {}
  if (optionsKey) {
    return props.selectOptions[optionsKey] || options || []
  }
  return options || [];
})
// 判断当前组件是否展示
const showComp = computed(() => {
  if (!formModel.value) return false
  let unRefFormModel = formModel.value
  console.log('formModel===>', unRefFormModel)
  if (props.visibleLinks && props.visibleLinks.length) {
    if (typeof props.visibleLinks === 'function') {
      return props.visibleLinks(formModel)
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
</script>

<style scoped>

</style>
