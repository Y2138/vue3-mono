<template>
  <div class="h-screen w-screen flex items-center justify-center bg-gray-100">
    <n-card class="w-[420px]!" title="注册账号" :bordered="false">
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="left"
        label-width="100"
        require-mark-placement="right-hanging"
        size="large"
      >
        <n-form-item label="手机号" path="phone">
          <n-input v-model:value="formModel.phone" placeholder="请输入手机号" />
        </n-form-item>
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formModel.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formModel.password"
            type="password"
            show-password-on="click"
            placeholder="请输入密码"
          />
        </n-form-item>
        <n-form-item label="确认密码" path="confirmPassword">
          <n-input
            v-model:value="formModel.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="请再次输入密码"
          />
        </n-form-item>
        <n-space vertical :size="24">
          <n-button type="primary" block secondary strong @click="handleRegister">
            注册
          </n-button>
          <n-button text class="text-center" @click="router.push('/login')">
            已有账号？去登录
          </n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { api_register } from '@/views/auth/graphql/auth'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const userStore = useUserStore()

interface FormModel {
  phone: string
  username: string
  password: string
  confirmPassword: string
}

const formModel = ref<FormModel>({
  phone: '',
  username: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不能少于 6 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value) => value === formModel.value.password,
      message: '两次输入的密码不一致',
      trigger: 'blur',
    },
  ],
}

const handleRegister = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return

    try {
      const res = await api_register({
        phone: formModel.value.phone,
        username: formModel.value.username,
        password: formModel.value.password,
      })

      if (res?.user) {
        message.success('注册成功')
        // 保存用户信息和token
        userStore.setUserInfo(res.user)
        userStore.setToken(res.token)
        router.push('/login')
      }
    } catch (error: any) {
      message.error(error.message || '注册失败')
    }
  })
}
</script> 