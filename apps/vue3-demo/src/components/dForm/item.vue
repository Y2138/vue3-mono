<template>
  <div class="flex-column">
    <template v-if="showComp">
      <div class="flex-row-center">
        <slot name="formPrefix"></slot>
        <span v-if="props.isTxt">{{ textDesc }}</span>
        <component
          v-else
          :is="componentsName[props.comp || 'ElInput']"
          class="d-form-item"
          :class="{ 'is-error': props.showValid && validMsg }"
          :style="{ width: props.width || '100%' }"
          v-model="bindValue"
          :options="curOptions"
          :placeholder="placeholder"
          v-bind="props.props"
          @change="handleChange"
          @blur="handleBlur"
          @input="handleInput"
        >
          <!-- 支持自定义插槽 -->
          <template
            v-for="iSlot in (props.innerSlots || [])"
            :key="iSlot"
            v-slot:[`${iSlot}`]
          >
            <slot :name="iSlot"></slot>
          </template>
        </component>
        <slot name="formSuffix"></slot>
      </div>
      <p v-if="!props.isTxt && props.showValid && validMsg" class="is-error">{{ validMsg }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, shallowReactive, ref, watch, useAttrs, defineEmits } from 'vue'
import type { FormItemProps, FormModelContext } from './types'
import { FormModelContextKey, FORMVALIDREGEXPS } from './types'
import { selComps } from './constant'
import { ElInput, ElSelect } from 'element-plus'
import SimpleSelect from './simpleSelect.vue'
import SimpleDateTimePicker from './simpleDateTimePicker.vue'

const componentsName = shallowReactive<Record<string, any>>({
  ElSelect,
  ElInput,
  SimpleSelect,
	SimpleDateTimePicker
})
const attrs = useAttrs()
const props = defineProps<FormItemProps>()
const emit = defineEmits(['input'])

// formModel 是父组件提供的当前表单数据
const [formModel, updateFormModel, selectOptions, rootConfig] =
  inject<FormModelContext>(FormModelContextKey)!

const bindValue = ref('')
watch(
  () => formModel.value[props.valueKey],
  (newVal) => {
    bindValue.value = newVal as string
  },
  {
    immediate: true
  }
)
// 仅展示文本
const textDesc = computed(() => {
  const _key = props.textKey || props.valueKey
  return formModel.value[_key]
})

const placeholder = computed(() => {
  if (props.props && props.props.placeholder) return props.props.placeholder;
  return attrs.placeholder || `${(selComps.includes(props.comp || '') ? '请选择' : '请填写') + props.label}`;
})

type modelValueType = string | number // | string[] | number[] | string[][] | number[][]
const handleChange = (val: modelValueType) => {
  console.log('comp bind value change===>', val)
  updateFormModel(props.valueKey, val)
  if (props.checkTrigger?.includes('change')) {
    checkValid();
  }
}
const handleBlur = () => {
  if (props.checkTrigger?.includes('blur')) {
    checkValid();
  }
}
const handleInput = (val: string | number) => {
  emit('input', val)
  if (props.checkTrigger?.includes('blur')) {
    checkValid();
  }
}
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

// 校验信息
const validMsg = ref('')
const checkValid = () => {
  if (!props.rule && !props.required) validMsg.value = ''
  if (props.required && !bindValue.value) return validMsg.value = '该项必填'
	if (props.rule) {
    let ruleReg: RegExp = typeof props.rule === 'string' ? FORMVALIDREGEXPS[props.rule] : props.rule
    if (!ruleReg.test(bindValue.value)) {
      validMsg.value = props.validTips || '不符合规则'
    }
  }
  validMsg.value = ''
}

const curOptions = computed(() => {
  const { optionsKey } = props
  const { options } = props.props || {}
  if (optionsKey) {
    return selectOptions.value[optionsKey as string] || []
  }
  return options || [];
})
</script>

<style scoped lang="scss">
.d-form-item {
	width: 100%;
  flex: 1;
}
.flex-column {
  display: flex;
  flex-direction: column;
	align-items: flex-start;
}
.flex-row-center {
  display: flex;
	align-items: center;
  width: 100%;
}
p {
	&.is-error{
		color: red;
		font-size: 13px;
		margin: 5px 0 0 0;
	}
}
.is-error {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px red;
  }
}
</style>
