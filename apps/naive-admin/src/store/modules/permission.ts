/**
 * 权限状态管理模块
 * 基于简化API适配器 + 双协议支持
 * 提供权限检查、角色管理、菜单权限控制
 */

import { defineStore } from 'pinia';
import { ref, computed, watchEffect, readonly } from 'vue';
import { 
  getPermissions,
  getRoles,
  checkPermission as checkUserPermission,
  checkPermissions as checkUserMultiplePermissions,
  assignRoles,
  revokeRoles,
  type Permission,
  type Role,
  type GetPermissionsParams,
  type GetRolesParams
} from '@/request/api/rbac';
import { useUserStore } from './user';

// ========================================
// 🔒 权限状态管理 Store
// ========================================

export const usePermissionStore = defineStore('permission', () => {
  // ========================================
  // 📊 状态定义
  // ========================================
  
  // 权限和角色数据
  const permissions = ref<Permission[]>([]);
  const roles = ref<Role[]>([]);
  const userPermissions = ref<string[]>([]);
  const userRoles = ref<string[]>([]);
  
  // 加载状态
  const isLoading = ref(false);
  const isPermissionsLoading = ref(false);
  const isRolesLoading = ref(false);
  const isCheckingPermission = ref(false);
  
  // 错误状态
  const permissionError = ref<string | null>(null);
  const roleError = ref<string | null>(null);
  
  // 缓存控制
  const lastUpdateTime = ref<number>(0);
  const cacheExpireTime = 10 * 60 * 1000; // 10分钟
  
  // 计算属性 - 权限映射表
  const permissionMap = computed(() => {
    const map = new Map<string, Permission>();
    permissions.value.forEach(permission => {
      map.set(permission.code, permission);
    });
    return map;
  });
  
  // 计算属性 - 角色映射表  
  const roleMap = computed(() => {
    const map = new Map<string, Role>();
    roles.value.forEach(role => {
      map.set(role.code, role);
    });
    return map;
  });
  
  // 计算属性 - 用户权限集合
  const userPermissionSet = computed(() => {
    return new Set(userPermissions.value);
  });
  
  // 计算属性 - 用户角色集合
  const userRoleSet = computed(() => {
    return new Set(userRoles.value);
  });
  
  // 计算属性 - 是否有管理员权限
  const isAdmin = computed(() => {
    return userRoleSet.value.has('admin') || userRoleSet.value.has('super_admin');
  });

  // ========================================
  // 🔄 数据获取和缓存管理
  // ========================================
  
  /**
   * 检查缓存是否有效
   */
  function isCacheValid(): boolean {
    return Date.now() - lastUpdateTime.value < cacheExpireTime;
  }
  
  /**
   * 获取所有权限列表
   * @param forceRefresh 是否强制刷新
   */
  async function fetchPermissions(forceRefresh = false): Promise<boolean> {
    try {
      if (!forceRefresh && permissions.value.length > 0 && isCacheValid()) {
        return true;
      }
      
      isPermissionsLoading.value = true;
      permissionError.value = null;
      
      const [permissionList, error] = await getPermissions({
        page: 1,
        pageSize: 1000 // 获取所有权限
      });
      
      if (error) {
        permissionError.value = error;
        return false;
      }
      
      if (permissionList) {
        permissions.value = permissionList;
        lastUpdateTime.value = Date.now();
        return true;
      }
      
      permissionError.value = '获取权限列表失败';
      return false;
    } catch (error) {
      console.error('[Permission Store] Fetch permissions failed:', error);
      permissionError.value = '获取权限时发生错误';
      return false;
    } finally {
      isPermissionsLoading.value = false;
    }
  }
  
  /**
   * 获取所有角色列表
   * @param forceRefresh 是否强制刷新
   */
  async function fetchRoles(forceRefresh = false): Promise<boolean> {
    try {
      if (!forceRefresh && roles.value.length > 0 && isCacheValid()) {
        return true;
      }
      
      isRolesLoading.value = true;
      roleError.value = null;
      
      const [roleList, error] = await rbacApi.getRoles({
        page: 1,
        pageSize: 1000, // 获取所有角色
        includePermissions: true
      });
      
      if (error) {
        roleError.value = error;
        return false;
      }
      
      if (roleList) {
        roles.value = roleList;
        lastUpdateTime.value = Date.now();
        return true;
      }
      
      roleError.value = '获取角色列表失败';
      return false;
    } catch (error) {
      console.error('[Permission Store] Fetch roles failed:', error);
      roleError.value = '获取角色时发生错误';
      return false;
    } finally {
      isRolesLoading.value = false;
    }
  }
  
  /**
   * 刷新用户权限信息
   */
  async function refreshUserPermissions(userId?: string): Promise<boolean> {
    const userStore = useUserStore();
    const targetUserId = userId || userStore.userProfile?.id;
    
    if (!targetUserId) {
      return false;
    }
    
    try {
      isLoading.value = true;
      
      // 并行获取权限和角色信息
      const [permissionsSuccess, rolesSuccess] = await Promise.all([
        fetchPermissions(true),
        fetchRoles(true)
      ]);
      
      if (!permissionsSuccess || !rolesSuccess) {
        return false;
      }
      
      // 从用户信息中提取权限和角色
      await updateUserPermissionsFromUserInfo();
      
      return true;
    } catch (error) {
      console.error('[Permission Store] Refresh user permissions failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 从用户信息更新用户权限
   */
  async function updateUserPermissionsFromUserInfo(): Promise<void> {
    const userStore = useUserStore();
    const currentUser = userStore.userInfo;
    
    if (!currentUser) {
      userPermissions.value = [];
      userRoles.value = [];
      return;
    }
    
    // 从用户的roleIds获取角色信息
    const userRoleIds = currentUser.roleIds || [];
    const userRolesList = roles.value.filter(role => userRoleIds.includes(role.id));
    
    // 提取角色代码
    userRoles.value = userRolesList.map(role => role.code);
    
    // 从角色中提取权限
    const permissionSet = new Set<string>();
    userRolesList.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(permission => {
          permissionSet.add(permission);
        });
      }
    });
    
    userPermissions.value = Array.from(permissionSet);
  }

  // ========================================
  // 🔐 权限检查方法
  // ========================================
  
  /**
   * 检查用户是否有指定权限
   * @param permission 权限代码
   * @param resource 资源（可选）
   * @returns Promise<boolean>
   */
  async function checkPermission(permission: string, resource?: string): Promise<boolean> {
    try {
      const userStore = useUserStore();
      const userId = userStore.userProfile?.id;
      
      if (!userId) {
        return false;
      }
      
      // 管理员直接返回true
      if (isAdmin.value) {
        return true;
      }
      
      // 先检查本地缓存
      if (userPermissionSet.value.has(permission)) {
        return true;
      }
      
      // 如果本地没有，调用远程检查
      isCheckingPermission.value = true;
      
      const [hasPermission, error] = await rbacApi.checkPermission(
        userId,
        permission,
        resource
      );
      
      if (error) {
        console.warn('[Permission Store] Remote permission check failed:', error);
        return false;
      }
      
      return hasPermission;
    } catch (error) {
      console.error('[Permission Store] Check permission failed:', error);
      return false;
    } finally {
      isCheckingPermission.value = false;
    }
  }
  
  /**
   * 检查用户是否有指定角色
   * @param roleCode 角色代码
   * @returns boolean
   */
  function hasRole(roleCode: string): boolean {
    return userRoleSet.value.has(roleCode);
  }
  
  /**
   * 检查用户是否有任意一个权限
   * @param permissionCodes 权限代码列表
   * @returns Promise<boolean>
   */
  async function hasAnyPermission(permissionCodes: string[]): Promise<boolean> {
    // 管理员直接返回true
    if (isAdmin.value) {
      return true;
    }
    
    // 检查本地缓存
    const hasLocalPermission = permissionCodes.some(code => 
      userPermissionSet.value.has(code)
    );
    
    if (hasLocalPermission) {
      return true;
    }
    
    // 远程检查
    const checks = permissionCodes.map(code => checkPermission(code));
    const results = await Promise.all(checks);
    
    return results.some(result => result);
  }
  
  /**
   * 检查用户是否有所有权限
   * @param permissionCodes 权限代码列表
   * @returns Promise<boolean>
   */
  async function hasAllPermissions(permissionCodes: string[]): Promise<boolean> {
    // 管理员直接返回true
    if (isAdmin.value) {
      return true;
    }
    
    // 检查本地缓存
    const hasAllLocalPermissions = permissionCodes.every(code => 
      userPermissionSet.value.has(code)
    );
    
    if (hasAllLocalPermissions) {
      return true;
    }
    
    // 远程检查
    const checks = permissionCodes.map(code => checkPermission(code));
    const results = await Promise.all(checks);
    
    return results.every(result => result);
  }
  
  /**
   * 批量检查权限
   * @param permissionCodes 权限代码列表
   * @returns Promise<Record<string, boolean>>
   */
  async function checkMultiplePermissions(
    permissionCodes: string[]
  ): Promise<Record<string, boolean>> {
    const userStore = useUserStore();
    const userId = userStore.userProfile?.id;
    
    if (!userId) {
      return permissionCodes.reduce((acc, code) => {
        acc[code] = false;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // 管理员所有权限都为true
    if (isAdmin.value) {
      return permissionCodes.reduce((acc, code) => {
        acc[code] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // 使用rbacApi的批量检查功能
    return await rbacApi.checkMultiplePermissions(userId, permissionCodes);
  }

  // ========================================
  // 🎭 角色管理方法
  // ========================================
  
  /**
   * 为用户分配角色
   * @param userId 用户ID
   * @param roleIds 角色ID列表
   */
  async function assignUserRoles(userId: string, roleIds: string[]): Promise<boolean> {
    try {
      isLoading.value = true;
      
      const [success, error] = await rbacApi.assignUserRoles(userId, roleIds);
      
      if (error) {
        roleError.value = error;
        return false;
      }
      
      // 如果是当前用户，刷新权限
      const userStore = useUserStore();
      if (userId === userStore.userProfile?.id) {
        await refreshUserPermissions();
      }
      
      return success;
    } catch (error) {
      console.error('[Permission Store] Assign roles failed:', error);
      roleError.value = '分配角色时发生错误';
      return false;
    } finally {
      isLoading.value = false;
    }
  }
  
  /**
   * 撤销用户角色
   * @param userId 用户ID
   * @param roleIds 角色ID列表
   */
  async function revokeUserRoles(userId: string, roleIds: string[]): Promise<boolean> {
    try {
      isLoading.value = true;
      
      const [success, error] = await rbacApi.revokeUserRoles(userId, roleIds);
      
      if (error) {
        roleError.value = error;
        return false;
      }
      
      // 如果是当前用户，刷新权限
      const userStore = useUserStore();
      if (userId === userStore.userProfile?.id) {
        await refreshUserPermissions();
      }
      
      return success;
    } catch (error) {
      console.error('[Permission Store] Revoke roles failed:', error);
      roleError.value = '撤销角色时发生错误';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // ========================================
  // 🛠️ 工具方法
  // ========================================
  
  /**
   * 重置错误状态
   */
  function clearErrors() {
    permissionError.value = null;
    roleError.value = null;
  }
  
  /**
   * 清除缓存
   */
  function clearCache() {
    permissions.value = [];
    roles.value = [];
    userPermissions.value = [];
    userRoles.value = [];
    lastUpdateTime.value = 0;
  }
  
  /**
   * 获取权限详情
   * @param permissionCode 权限代码
   */
  function getPermissionDetail(permissionCode: string): Permission | null {
    return permissionMap.value.get(permissionCode) || null;
  }
  
  /**
   * 获取角色详情
   * @param roleCode 角色代码
   */
  function getRoleDetail(roleCode: string): Role | null {
    return roleMap.value.get(roleCode) || null;
  }
  
  /**
   * 获取用户所有权限详情
   */
  function getUserPermissionDetails(): Permission[] {
    return userPermissions.value
      .map(code => getPermissionDetail(code))
      .filter(permission => permission !== null) as Permission[];
  }
  
  /**
   * 获取用户所有角色详情
   */
  function getUserRoleDetails(): Role[] {
    return userRoles.value
      .map(code => getRoleDetail(code))
      .filter(role => role !== null) as Role[];
  }

  // ========================================
  // 🔄 响应式监听
  // ========================================
  
  // 监听用户信息变化，自动更新权限
  const userStore = useUserStore();
  watchEffect(() => {
    if (userStore.userInfo) {
      updateUserPermissionsFromUserInfo();
    } else {
      userPermissions.value = [];
      userRoles.value = [];
    }
  });

  // ========================================
  // 🚀 初始化
  // ========================================
  
  /**
   * 初始化权限数据
   */
  async function initialize(): Promise<void> {
    try {
      isLoading.value = true;
      
      // 如果用户已登录，获取权限数据
      if (userStore.isLoggedIn) {
        await Promise.all([
          fetchPermissions(),
          fetchRoles()
        ]);
        
        await updateUserPermissionsFromUserInfo();
      }
    } catch (error) {
      console.error('[Permission Store] Initialize failed:', error);
    } finally {
      isLoading.value = false;
    }
  }
  
  // 自动初始化
  initialize();

  // ========================================
  // 📤 导出
  // ========================================
  
  return {
    // 状态
    permissions: readonly(permissions),
    roles: readonly(roles),
    userPermissions: readonly(userPermissions),
    userRoles: readonly(userRoles),
    isLoading: readonly(isLoading),
    isPermissionsLoading: readonly(isPermissionsLoading),
    isRolesLoading: readonly(isRolesLoading),
    isCheckingPermission: readonly(isCheckingPermission),
    permissionError: readonly(permissionError),
    roleError: readonly(roleError),
    
    // 计算属性
    permissionMap,
    roleMap,
    userPermissionSet,
    userRoleSet,
    isAdmin,
    
    // 数据获取方法
    fetchPermissions,
    fetchRoles,
    refreshUserPermissions,
    
    // 权限检查方法
    checkPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    checkMultiplePermissions,
    
    // 角色管理方法
    assignUserRoles,
    revokeUserRoles,
    
    // 工具方法
    clearErrors,
    clearCache,
    getPermissionDetail,
    getRoleDetail,
    getUserPermissionDetails,
    getUserRoleDetails,
    initialize,
  };
});
