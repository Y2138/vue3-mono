import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserInfo } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref<UserInfo | null>(null);
  // token
  const token = ref<string>('');
  // 登录状态
  const isLogin = ref<boolean>(false);

  // 设置用户信息
  function setUserInfo(info: UserInfo) {
    userInfo.value = info;
    isLogin.value = true;
    // 存储到localStorage中，方便下次访问时读取
    localStorage.setItem('userInfo', JSON.stringify(info));
  }

  // 设置token
  function setToken(tokenValue: string) {
    token.value = tokenValue;
    // 存储到localStorage中，方便下次访问时读取
    localStorage.setItem('token', tokenValue);
  }

  // 获取token
  function getToken(): string {
    if (!token.value) {
      // 如果内存中没有，则从localStorage中获取
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        token.value = storedToken;
      }
    }
    return token.value;
  }

  // 获取用户信息
  function getUserInfo(): UserInfo | null {
    if (!userInfo.value) {
      // 如果内存中没有，则从localStorage中获取
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          userInfo.value = JSON.parse(storedUserInfo);
          isLogin.value = true;
        } catch (e) {
          console.error('解析用户信息失败', e);
        }
      }
    }
    return userInfo.value;
  }

  // 退出登录
  function logout() {
    userInfo.value = null;
    token.value = '';
    isLogin.value = false;
    // 清除localStorage中的用户信息和token
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
  }

  return {
    userInfo,
    token,
    isLogin,
    setUserInfo,
    setToken,
    getToken,
    getUserInfo,
    logout
  };
}); 