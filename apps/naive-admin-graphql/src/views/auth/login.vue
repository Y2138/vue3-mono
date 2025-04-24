<template>
  <div class="login-container">
    <n-card class="login-card" title="系统登录" :bordered="false">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="left"
        @keyup.enter="handleSubmit"
      >
        <n-form-item path="phone" label="手机号">
          <n-input
            v-model:value="formValue.phone"
            placeholder="请输入手机号"
            clearable
          >
            <template #prefix>
              <Icon icon="ion:call-outline" width="20" height="20" />
            </template>
          </n-input>
        </n-form-item>
        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="formValue.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
            clearable
          >
            <template #prefix>
              <Icon icon="ion:lock-closed-outline" width="20" height="20" />
            </template>
          </n-input>
        </n-form-item>
        <n-space vertical size="large">
          <n-button
            type="primary"
            block
            @click="handleSubmit"
            :loading="loading"
          >
            登录
          </n-button>
          <n-button text class="text-center" @click="router.push('/register')">
            还没有账号？去注册
          </n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject } from 'vue';
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router';
import { api_login } from '@/views/auth/graphql/auth';
import { useUserStore } from '@/store/modules/user';
import { DefaultApolloClient } from '@vue/apollo-composable';

const apolloClient = inject(DefaultApolloClient);
console.log(apolloClient);

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const formRef = ref();

const formValue = reactive({
  phone: '',
  password: ''
});

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

const handleSubmit = () => {
  formRef.value.validate(async (errors: any) => {
    if (!errors) {
      loading.value = true;
      try {
        const { user, token } = await api_login({
          phone: formValue.phone,
          password: formValue.password
        });
        console.log(user, token);
        
        if (user && token) {
          window.$message.success('登录成功');
          // 保存用户信息和token
          userStore.setUserInfo(user);
          userStore.setToken(token);
          // 跳转到首页
          router.push('/');
        }
      } catch (error) {
        console.error('登录失败', error);
        window.$message.error('登录失败，请检查手机号和密码');
      } finally {
        loading.value = false;
      }
    } else {
      window.$message.error('请检查表单填写是否正确');
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
</style> 