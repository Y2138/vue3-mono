/**
 * 用户状态管理模块
 * 基于简化API适配器 + 双协议支持
 * 提供用户认证、信息管理、透明协议切换
 */

import { defineStore } from 'pinia';
import { ref, computed, watchEffect, readonly } from 'vue';
import { userApi } from '@/request/api/users';
import type { User } from '@/shared/users';

// ========================================
// 🔐 用户状态管理 Store
// ========================================

export const useUserStore = defineStore('user', () => {
  // ========================================
  // 📊 状态定义
  // ========================================
  
  // 用户信息
  const userInfo = ref<User | null>(null);
  const authToken = ref<string | null>(null);
  
  // 加载状态
  const isLoading = ref(false);
  const isLoginLoading = ref(false);
  const isUserInfoLoading = ref(false);
  
  // 错误状态
  const loginError = ref<string | null>(null);
  const userError = ref<string | null>(null);
  
  // 登录状态
  const isLoggedIn = computed(() => {
    return !!(authToken.value && userInfo.value);
  });
  
  // 用户角色和权限（从用户信息中提取）
  const userRoles = computed(() => {
    return userInfo.value?.roleIds || [];
  });
  
  const userPermissions = computed(() => {
    // 注意：这里只返回角色ID，实际权限需要从权限管理模块获取
    return userRoles.value;
  });
  
  // 用户基本信息
  const userProfile = computed(() => {
    if (!userInfo.value) return null;
    
    return {
      id: userInfo.value.phone, // 使用phone作为用户ID
      username: userInfo.value.username,
      phone: userInfo.value.phone,
      isActive: userInfo.value.isActive,
      createdAt: userInfo.value.createdAt,
      updatedAt: userInfo.value.updatedAt,
      roleIds: userInfo.value.roleIds
    };
  });

  // ========================================
  // 🔄 数据初始化和持久化
  // ========================================
  
  /**
   * 从本地存储恢复状态
   */
  function restoreFromStorage() {
    try {
      // 恢复token
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        authToken.value = storedToken;
      }
      
      // 恢复用户信息
      const storedUserInfo = localStorage.getItem('user_info');
      if (storedUserInfo) {
        userInfo.value = JSON.parse(storedUserInfo);
      }
    } catch (error) {
      console.error('[User Store] Restore from storage failed:', error);
      clearStorage(); // 清除无效数据
    }
  }
  
  /**
   * 清除本地存储
   */
  function clearStorage() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  }
  
  /**
   * 监听状态变化并同步到本地存储
   */
  watchEffect(() => {
    if (authToken.value) {
      localStorage.setItem('auth_token', authToken.value);
    } else {
      localStorage.removeItem('auth_token');
    }
  });
  
  watchEffect(() => {
    if (userInfo.value) {
      localStorage.setItem('user_info', JSON.stringify(userInfo.value));
    } else {
      localStorage.removeItem('user_info');
    }
  });

  // ========================================
  // 🔐 用户认证相关方法
  // ========================================
  
  /**
   * 用户登录
   * @param phone 手机号
   * @param password 密码
   * @returns Promise<boolean> 登录是否成功
   */
  async function login(phone: string, password: string): Promise<boolean> {
    try {
      isLoginLoading.value = true;
      loginError.value = null;
      
      const [authResponse, error] = await userApi.login(phone, password);
      
      if (error) {
        loginError.value = error;
        return false;
      }
      
      if (authResponse && authResponse.user) {
        userInfo.value = authResponse.user;
        authToken.value = authResponse.token;
        
        // 刷新权限缓存
        await refreshUserPermissions();
        
        return true;
      }
      
      loginError.value = '登录失败，请重试';
      return false;
    } catch (error) {
      console.error('[User Store] Login failed:', error);
      loginError.value = '登录过程中发生错误';
      return false;
    } finally {
      isLoginLoading.value = false;
    }
  }
  
  /**
   * 用户登出
   */
  async function logout(): Promise<void> {
    try {
      isLoading.value = true;
      
      // 调用登出API
      await userApi.logout();
      
      // 清除状态
      userInfo.value = null;
      authToken.value = null;
      loginError.value = null;
      userError.value = null;
      
      // 清除存储
      clearStorage();
      
    } catch (error) {
      console.error('[User Store] Logout failed:', error);
      // 即使API调用失败，也要清除本地状态
      userInfo.value = null;
      authToken.value = null;
      clearStorage();
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 检查登录状态
   */
  function checkLoginStatus(): boolean {
    return isLoggedIn.value && !!authToken.value;
  }

  // ========================================
  // 👤 用户信息管理
  // ========================================
  
  /**
   * 获取用户信息
   * @param userId 用户ID（可选，默认获取当前用户）
   * @param forceRefresh 是否强制刷新
   */
  async function fetchUserInfo(userId?: string, forceRefresh = false): Promise<boolean> {
    try {
      isUserInfoLoading.value = true;
      userError.value = null;
      
      // 如果有缓存且不强制刷新，则直接返回
      if (!forceRefresh && userInfo.value && !userId) {
        return true;
      }
      
      const [user, error] = await userApi.getUserInfo(userId);
      
      if (error) {
        userError.value = error;
        return false;
      }
      
      if (user) {
        // 如果是当前用户，更新状态
        if (!userId || userId === userInfo.value?.phone) {
          userInfo.value = user;
        }
        return true;
      }
      
      userError.value = '获取用户信息失败';
      return false;
    } catch (error) {
      console.error('[User Store] Fetch user info failed:', error);
      userError.value = '获取用户信息时发生错误';
      return false;
    } finally {
      isUserInfoLoading.value = false;
    }
  }
  
  /**
   * 更新用户信息
   * @param updateData 更新数据
   */
  async function updateUserInfo(updateData: Partial<User>): Promise<boolean> {
    try {
      isLoading.value = true;
      userError.value = null;
      
      if (!userInfo.value?.phone) {
        userError.value = '用户未登录';
        return false;
      }
      
      const [updatedUser, error] = await userApi.updateUser(
        userInfo.value.phone,
        updateData
      );
      
      if (error) {
        userError.value = error;
        return false;
      }
      
      if (updatedUser) {
        userInfo.value = updatedUser;
        return true;
      }
      
      userError.value = '更新用户信息失败';
      return false;
    } catch (error) {
      console.error('[User Store] Update user info failed:', error);
      userError.value = '更新用户信息时发生错误';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ========================================
  // 🔒 权限相关方法
  // ========================================
  
  /**
   * 刷新用户权限信息
   */
  async function refreshUserPermissions(): Promise<boolean> {
    if (!userInfo.value?.phone) return false;
    
    try {
      // 重新获取包含权限的用户信息
      return await fetchUserInfo(undefined, true);
    } catch (error) {
      console.error('[User Store] Refresh permissions failed:', error);
      return false;
    }
  }
  
  /**
   * 检查用户是否有指定权限
   * @param permission 权限标识
   * @returns boolean
   */
  function hasPermission(permission: string): boolean {
    return userPermissions.value.includes(permission);
  }
  
  /**
   * 检查用户是否有指定角色
   * @param roleCode 角色代码
   * @returns boolean
   */
  function hasRole(roleCode: string): boolean {
    return userRoles.value.includes(roleCode);
  }
  
  /**
   * 检查用户是否有任意一个权限
   * @param permissions 权限列表
   * @returns boolean
   */
  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => hasPermission(permission));
  }
  
  /**
   * 检查用户是否有所有权限
   * @param permissions 权限列表
   * @returns boolean
   */
  function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => hasPermission(permission));
  }

  // ========================================
  // 🛠️ 工具方法
  // ========================================
  
  /**
   * 重置错误状态
   */
  function clearErrors() {
    loginError.value = null;
    userError.value = null;
  }
  
  /**
   * 获取用户显示名称
   */
  function getDisplayName(): string {
    if (!userInfo.value) return '未登录';
    
    return userInfo.value.username || 
           userInfo.value.phone || 
           '用户';
  }
  
  /**
   * 检查用户状态是否正常
   */
  function isUserActive(): boolean {
    return userInfo.value?.isActive === true;
  }

  // ========================================
  // 🔄 初始化
  // ========================================
  
  // 恢复状态
  restoreFromStorage();
  
  // 如果有token但没有用户信息，尝试获取
  if (authToken.value && !userInfo.value) {
    fetchUserInfo();
  }

  // ========================================
  // 📤 导出
  // ========================================
  
  return {
    // 状态
    userInfo: readonly(userInfo),
    authToken: readonly(authToken),
    isLoading: readonly(isLoading),
    isLoginLoading: readonly(isLoginLoading),
    isUserInfoLoading: readonly(isUserInfoLoading),
    loginError: readonly(loginError),
    userError: readonly(userError),
    
    // 计算属性
    isLoggedIn,
    userRoles,
    userPermissions,
    userProfile,
    
    // 认证方法
    login,
    logout,
    checkLoginStatus,
    
    // 用户信息方法
    fetchUserInfo,
    updateUserInfo,
    
    // 权限方法
    refreshUserPermissions,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    
    // 工具方法
    clearErrors,
    getDisplayName,
    isUserActive,
  };
}); 