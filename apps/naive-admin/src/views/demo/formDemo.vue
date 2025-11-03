<template>
  <n-card title="这是一个表单页">
    <d-form-root v-model:formModel="formModel" :formConfigs="formConfigs" :select-options="selections" show-label label-placement="left" label-width="auto" :disabled="isDisabled" @submit="handleSubmit" class="max-w-[560px]"> </d-form-root>
    <n-button @click="test">改变禁用状态</n-button>
  </n-card>
</template>

<script setup lang="ts">
import { IFormConfig } from '@/components/dForm/types'
import { ref } from 'vue'
import DFormRoot from '@/components/dForm/root.vue'

const isDisabled = ref(false)
const test = () => {
  isDisabled.value = !isDisabled.value
}
const handleSubmit = (val: any) => {
  console.log('2502===> ', val)
}

const formModel = ref({
  text1: '',
  number1: null,
  date1: null,
  select1: null,
  daterange1: null
})
const selections = {
  select1: [
    { label: '选项1', value: 1 },
    { label: '选项2', value: 2 },
    { label: '选项3', value: 3 }
  ]
}
const formConfigs: IFormConfig[] = [
  {
    valueKey: 'text1',
    comp: 'n-input',
    label: '输入框1',
    rules: [
      {
        required: true,
        message: '该项必填'
      }
    ],
    props: {
      placeholder: '请输入第一个选项'
    }
  },
  {
    valueKey: 'number1',
    comp: 'n-input-number',
    label: '数字输入框',
    rules: [
      {
        required: true,
        type: 'number',
        message: '请输入数字'
      }
    ],
    props: {
      placeholder: '请填写数字'
    }
  },
  {
    valueKey: 'date1',
    comp: 'd-date-picker',
    label: '日期1',
    rules: [
      {
        required: true
      }
    ],
    props: {
      placeholder: '请选择日期'
    }
  },
  {
    valueKey: 'select1',
    comp: 'n-select',
    label: '选择框1',
    optionsKey: 'select1',
    rules: [
      {
        required: true
      }
    ]
  },
  {
    valueKey: 'daterange1',
    comp: 'd-date-picker',
    label: '日期范围选择',
    rules: [
      {
        required: true
      }
    ],
    props: {
      type: 'daterange'
    }
  }
]
</script>

<style scoped></style>
