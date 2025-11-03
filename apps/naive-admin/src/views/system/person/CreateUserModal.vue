<template>
  <n-modal v-model:show="visible" preset="dialog" title="新增人员" class="w-120">
    <d-form-root ref="formRef" class="pt-4" v-model:formModel="formModel" :formConfigs="formConfigs" :selectOptions="{}" label-placement="left" label-width="80" :disabled="loading" />

    <n-alert v-if="passwordTip" type="info" class="mb-4">
      {{ passwordTip }}
    </n-alert>

    <template #action>
      <div class="flex justify-end space-x-2">
        <n-button @click="handleCancel" :disabled="loading"> 取消 </n-button>
        <n-button type="primary" @click="handleSubmit" :loading="loading"> 确定 </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, useTemplateRef } from 'vue'
import { NModal, NButton, NAlert, useMessage } from 'naive-ui'
import { createUserForm, type UserInfo } from '@/request/api/users'
import DFormRoot from '@/components/dForm/root.vue'
import type { IFormConfig, DFormRootInst } from '@/components/dForm/types'

// Props
interface Props {
  visible: boolean
}

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success', user: UserInfo): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const message = useMessage()
const formRef = useTemplateRef<DFormRootInst>('formRef')
const loading = ref(false)

// 表单数据
const formModel = ref<Record<string, unknown>>({
  phone: '',
  username: ''
})

// 密码提示
const passwordTip = computed(() => {
  if (formModel.value.phone && typeof formModel.value.phone === 'string' && formModel.value.phone.length >= 6) {
    const lastSix = formModel.value.phone.slice(-6)
    return `系统将自动生成默认密码：Aa${lastSix}（手机号后6位）`
  }
  return ''
})

// dForm 表单配置
const formConfigs: IFormConfig[] = [
  {
    valueKey: 'phone',
    comp: 'n-input',
    label: '手机号',
    required: true,
    rules: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      {
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的手机号格式',
        trigger: 'blur'
      }
    ],
    props: {
      placeholder: '请输入手机号',
      clearable: true
    }
  },
  {
    valueKey: 'username',
    comp: 'n-input',
    label: '用户名',
    required: true,
    rules: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '用户名长度应在2-20个字符之间', trigger: 'blur' }
    ],
    props: {
      placeholder: '请输入用户名',
      clearable: true
    }
  }
]

// 重置表单
const resetForm = () => {
  formModel.value = {
    phone: '',
    username: ''
  }
  formRef.value?.restoreValidation()
}

// 监听弹窗显示状态，重置表单
watch(visible, (newVisible) => {
  if (newVisible) {
    resetForm()
  }
})

// 处理取消
const handleCancel = () => {
  visible.value = false
}

// 处理提交
const handleSubmit = async () => {
  try {
    // 表单验证
    const validateResult = await formRef.value?.validate()
    if (validateResult?.warnings) {
      return
    }

    loading.value = true

    const phone = formModel.value.phone as string
    const username = formModel.value.username as string

    // 调用创建用户接口（服务端会处理重复性检查）
    const [result, error] = await createUserForm({ phone, username })
    console.log('error ==>', error)
    if (error) {
      // 服务端已经处理了详细的错误信息
      message.error(error.message || '新增人员失败')
      return
    }

    if (result?.data) {
      message.success('新增人员成功')
      emit('success', result.data)
      visible.value = false
    } else {
      message.error('新增人员失败：返回数据异常')
    }
  } catch (error) {
    console.error('新增人员失败:', error)
    message.error('表单验证失败，请检查输入信息')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.n-form-item-label) {
  font-weight: 500;
}

:deep(.n-input) {
  --n-border-radius: 6px;
}

:deep(.n-button) {
  --n-border-radius: 6px;
}
</style>
