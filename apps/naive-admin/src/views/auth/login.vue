<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-[linear-gradient(135deg,_#667eea_0%,_#764ba2_100%)] bg-pattern">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="bg-pattern absolute inset-0 opacity-10"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="w-full max-w-md mx-auto">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Naive Admin</h1>
        <p class="text-blue-100">基于 Vue3 和 TypeScript 的后台管理系统</p>
      </div>

      <!-- 登录表单 -->
      <div class="login-card relative w-full max-w-md bg-white dark:bg-gray-800 dark:text-white rounded-2xl shadow-2xl p-8">
        <!-- 头部 -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center mb-4">
            <div class="mr-3 p-2 bg-primary-500 text-white rounded-xl">
              <Icon icon="mdi:shield-account" width="32" height="32" />
            </div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">管理系统</h1>
          </div>
          <p class="text-gray-600 dark:text-gray-300 text-sm">欢迎回来，请登录您的账户</p>
        </div>

        <!-- 登录表单 -->
        <n-form ref="formRef" :model="formData" :rules="formRules" size="large" :show-label="false" class="space-y-4">
          <!-- 手机号输入 -->
          <n-form-item path="phone" class="mb-4">
            <n-input v-model:value="formData.phone" placeholder="请输入手机号" :maxlength="11" clearable :input-props="{ autocomplete: 'username' }">
              <template #prefix>
                <Icon icon="mdi:phone" class="text-gray-400 w-5 h-5" />
              </template>
            </n-input>
          </n-form-item>

          <!-- 密码输入 -->
          <n-form-item path="password" class="mb-4">
            <n-input v-model:value="formData.password" type="password" placeholder="请输入密码" :maxlength="50" show-password-on="mousedown" :input-props="{ autocomplete: 'current-password' }" @keyup.enter="handleLogin">
              <template #prefix>
                <Icon icon="mdi:lock" class="text-gray-400 w-5 h-5" />
              </template>
            </n-input>
          </n-form-item>

          <!-- 记住我选项 -->
          <div class="flex items-center justify-between mb-6">
            <n-checkbox v-model:checked="formData.rememberMe"> 记住我 </n-checkbox>
            <n-button text type="primary" class="text-sm"> 忘记密码？ </n-button>
          </div>

          <!-- 登录按钮 -->
          <n-button type="primary" size="large" :loading="loginLoading" :disabled="!isFormValid" block class="login-button mb-6 h-12 text-base font-medium" @click="handleLogin">
            <template #icon>
              <Icon icon="mdi:login" />
            </template>
            {{ loginLoading ? '登录中...' : '登录' }}
          </n-button>
        </n-form>

        <!-- 底部信息 -->
        <div class="text-center">
          <p class="text-gray-600 dark:text-gray-300 pt-4 text-sm">
            还没有账号？
            <n-button text type="primary" @click="handleRegister"> 立即注册 </n-button>
          </p>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <n-alert v-if="errorMessage" type="error" :title="errorMessage" closable class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md animate-slide-down" @close="errorMessage = ''" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/store/modules/user'
import type { LoginParams } from '@/request/api/users'

// ========================================
// 🔧 组合式函数和状态
// ========================================

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// 表单引用
const formRef = ref<FormInst | null>(null)

// 表单数据
const formData = ref<LoginParams & { rememberMe: boolean }>({
  phone: '',
  password: '',
  rememberMe: false
})

// 加载状态
const loginLoading = ref(false)
const errorMessage = ref('')

// ========================================
// 📝 表单验证规则
// ========================================

const formRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号格式',
      trigger: ['blur', 'input']
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      min: 6,
      message: '密码长度不能少于6位',
      trigger: ['blur', 'input']
    }
  ]
}

// ========================================
// 💡 计算属性
// ========================================

// 表单是否有效
const isFormValid = computed(() => {
  return formData.value.phone.length >= 11 && formData.value.password.length >= 6 && /^1[3-9]\d{9}$/.test(formData.value.phone)
})

// ========================================
// 🎯 事件处理函数
// ========================================

/**
 * 处理登录
 */
const handleLogin = async () => {
  if (!formRef.value) return

  try {
    // 表单验证
    await formRef.value.validate()

    loginLoading.value = true
    errorMessage.value = ''

    // 调用登录API
    const success = await userStore.login(formData.value.phone, formData.value.password)

    if (!success) {
      throw new Error(userStore.loginError || '登录失败')
    }

    // 登录成功提示
    message.success('登录成功！')

    // 跳转到首页或之前访问的页面
    const redirect = router.currentRoute.value.query.redirect as string
    await router.push(redirect || '/home')
  } catch (error: any) {
    console.error('Login failed:', error)
    errorMessage.value = error.message || '登录失败，请检查用户名和密码'
  } finally {
    loginLoading.value = false
  }
}

/**
 * 处理注册跳转
 */
const handleRegister = () => {
  router.push('/register')
}

// ========================================
// 🔄 生命周期
// ========================================

onMounted(() => {
  // 如果已经登录，跳转到首页
  if (userStore.isLoggedIn) {
    router.push('/home')
    return
  }

  // 从本地存储恢复记住的用户名
  const rememberedPhone = localStorage.getItem('remembered_phone')
  if (rememberedPhone) {
    formData.value.phone = rememberedPhone
    formData.value.rememberMe = true
  }
})
</script>
