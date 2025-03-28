<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NForm, NFormItem, NInput, NUpload } from 'naive-ui'
import type { ColumnItem } from '@/types/column'
import { api_uploadFile } from '@/request/api/common'

const props = defineProps<{
  data?: ColumnItem
}>()

const formRef = ref()
const formData = ref({
  columnName: '',
  columnIntro: '',
  pcBanner: '',
  h5Banner: ''
})

const rules = {
  columnName: {
    required: true,
    message: '请输入专栏名称',
    trigger: ['blur', 'input']
  }
}

// 自定义上传
const customRequest = async ({ file, onFinish, onError }: any) => {
  try {
    const formData = new FormData()
    formData.append('file', file.file)
    const res = await api_uploadFile(formData)
    onFinish()
    return res.data.url
  } catch (error) {
    onError()
  }
}

// 处理PC端图片上传
const handlePcUploadFinish = ({ file }: any) => {
  formData.value.pcBanner = file.url
}

// 处理H5端图片上传
const handleH5UploadFinish = ({ file }: any) => {
  formData.value.h5Banner = file.url
}

// 验证图片大小和尺寸
const beforeUpload = (file: File) => {
  // 验证文件大小（5MB）
  if (file.size > 5 * 1024 * 1024) {
    window.$message.error('图片大小不能超过5MB')
    return false
  }

  // 验证图片尺寸
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      // PC端图片尺寸要求：1200 * 50
      if (img.width !== 1200 || img.height !== 50) {
        window.$message.error('PC端图片尺寸必须为1200*50')
        reject()
      } else {
        resolve(true)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject()
    }
  })
}

const validate = () => {
  return formRef.value?.validate()
}

defineExpose({
  formData,
  validate
})

onMounted(() => {
  if (props.data) {
    formData.value = { ...props.data }
  }
})
</script>

<template>
  <NForm ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100"
    require-mark-placement="right-hanging">
    <NFormItem label="专栏名称" path="columnName">
      <NInput v-model:value="formData.columnName" placeholder="请输入专栏名称" maxlength="20" show-count />
    </NFormItem>
    <NFormItem label="专栏简介" path="columnIntro">
      <NInput v-model:value="formData.columnIntro" type="textarea" placeholder="请输入专栏简介" maxlength="200" show-count />
    </NFormItem>
    <NFormItem label="PC端头图" path="pcBanner">
      <NUpload accept="image/*" :custom-request="customRequest" :before-upload="beforeUpload"
        @finish="handlePcUploadFinish">
        <NButton>上传图片</NButton>
      </NUpload>
      <template #help>
        <span class="text-gray-400">建议尺寸：1200*50px，大小不超过5MB</span>
      </template>
    </NFormItem>
    <NFormItem label="H5端头图" path="h5Banner">
      <NUpload accept="image/*" :custom-request="customRequest" :before-upload="beforeUpload"
        @finish="handleH5UploadFinish">
        <NButton>上传图片</NButton>
      </NUpload>
      <template #help>
        <span class="text-gray-400">建议尺寸：200*50px，大小不超过5MB</span>
      </template>
    </NFormItem>
  </NForm>
</template>