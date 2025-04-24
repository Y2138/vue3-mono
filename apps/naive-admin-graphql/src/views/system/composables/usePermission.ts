import { computed, ref } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useMessage } from 'naive-ui';
import type { CreatePermissionInput, CreateRoleInput, Permission, Role, UpdatePermissionInput, UpdateRoleInput, UsePermissionReturn } from '../types';
import type { DocumentNode } from 'graphql';
import type { UseQueryOptions } from '@vue/apollo-composable';

// GraphQL 查询导入
import {
  GET_HEALTH,
  GET_PERMISSIONS,
  CREATE_PERMISSION,
  UPDATE_PERMISSION,
  DELETE_PERMISSION,
} from '../graphql/permission';

import {
  GET_ROLES,
  CREATE_ROLE,
  UPDATE_ROLE,
  DELETE_ROLE,
  ADD_PERMISSIONS_TO_ROLE,
  REMOVE_PERMISSIONS_FROM_ROLE,
} from '../graphql/role';

interface PermissionsData {
  permissions: Permission[];
}

interface RolesData {
  roles: Role[];
}

export function usePermission(): UsePermissionReturn {
  const permissions = ref<Permission[]>([]);
  const roles = ref<Role[]>([]);
  const error = ref<Error | null>(null);
  const message = useMessage();

  // useQuery<{
  //   health: string;
  // }>(GET_HEALTH as DocumentNode, {}, {
  //   fetchPolicy: 'network-only',
  //   onResult: ({ data }) => {
  //     console.log(data);
  //   },
  //   onError: (err: Error) => {
  //     console.log(err);
  //   },
  // });

  // 查询权限列表
  const { 
    loading: permissionsLoading, 
    refetch: refetchPermissions,
    onResult,
    onError,
  } = useQuery<PermissionsData>(
    GET_PERMISSIONS as DocumentNode,
    {},
    {
      fetchPolicy: 'network-only'
    } as UseQueryOptions<PermissionsData>
  );

  // 监听权限查询结果
  onResult(({ data }) => {
    if (data?.permissions) {
      permissions.value = data.permissions;
    }
  });

  // 监听权限查询错误
  onError((err) => {
    error.value = err;
    message.error('获取权限列表失败');
  });

  // 查询角色列表
  const { 
    loading: rolesLoading, 
    refetch: refetchRoles,
    onResult: onRolesResult,
    onError: onRolesError
  } = useQuery<RolesData>(
    GET_ROLES as DocumentNode,
    {},
    {
      fetchPolicy: 'network-only'
    } as UseQueryOptions<RolesData>
  );

  // 监听角色查询结果
  onRolesResult(({ data }) => {
    if (data?.roles) {
      roles.value = data.roles;
    }
  });

  // 监听角色查询错误
  onRolesError((err) => {
    error.value = err;
    message.error('获取角色列表失败');
  });

  // 监听加载状态
  const isLoading = computed(() => permissionsLoading.value || rolesLoading.value);

  // 权限操作
  const { mutate: createPermissionMutation } = useMutation<{
    createPermission: Permission;
  }, {
    input: CreatePermissionInput;
  }>(CREATE_PERMISSION as DocumentNode);

  const { mutate: updatePermissionMutation } = useMutation<{
    updatePermission: Permission;
  }, {
    input: UpdatePermissionInput;
  }>(UPDATE_PERMISSION as DocumentNode);

  const { mutate: deletePermissionMutation } = useMutation<{
    deletePermission: boolean;
  }, {
    id: string;
  }>(DELETE_PERMISSION as DocumentNode);

  const createPermission = async (input: CreatePermissionInput): Promise<Permission> => {
    try {
      const result = await createPermissionMutation({ input });
      if (!result?.data?.createPermission) throw new Error('创建权限失败');
      await refetchPermissions();
      message.success('创建权限成功');
      return result.data.createPermission;
    } catch (err) {
      message.error('创建权限失败');
      throw err;
    }
  };

  const updatePermission = async (input: UpdatePermissionInput): Promise<Permission> => {
    try {
      const result = await updatePermissionMutation({ input });
      if (!result?.data?.updatePermission) throw new Error('更新权限失败');
      await refetchPermissions();
      message.success('更新权限成功');
      return result.data.updatePermission;
    } catch (err) {
      message.error('更新权限失败');
      throw err;
    }
  };

  const deletePermission = async (id: string): Promise<boolean> => {
    try {
      const result = await deletePermissionMutation({ id });
      if (!result?.data?.deletePermission) throw new Error('删除权限失败');
      await refetchPermissions();
      message.success('删除权限成功');
      return result.data.deletePermission;
    } catch (err) {
      message.error('删除权限失败');
      throw err;
    }
  };

  // 角色操作
  const { mutate: createRoleMutation } = useMutation<{
    createRole: Role;
  }, {
    input: CreateRoleInput;
  }>(CREATE_ROLE as DocumentNode);

  const { mutate: updateRoleMutation } = useMutation<{
    updateRole: Role;
  }, {
    input: UpdateRoleInput;
  }>(UPDATE_ROLE as DocumentNode);

  const { mutate: deleteRoleMutation } = useMutation<{
    deleteRole: boolean;
  }, {
    id: string;
  }>(DELETE_ROLE as DocumentNode);

  const { mutate: addPermissionsToRoleMutation } = useMutation<{
    addPermissionsToRole: Role;
  }, {
    roleId: string;
    permissionIds: string[];
  }>(ADD_PERMISSIONS_TO_ROLE as DocumentNode);

  const { mutate: removePermissionsFromRoleMutation } = useMutation<{
    removePermissionsFromRole: Role;
  }, {
    roleId: string;
    permissionIds: string[];
  }>(REMOVE_PERMISSIONS_FROM_ROLE as DocumentNode);

  const createRole = async (input: CreateRoleInput): Promise<Role> => {
    try {
      const result = await createRoleMutation({ input });
      if (!result?.data?.createRole) throw new Error('创建角色失败');
      await refetchRoles();
      message.success('创建角色成功');
      return result.data.createRole;
    } catch (err) {
      message.error('创建角色失败');
      throw err;
    }
  };

  const updateRole = async (input: UpdateRoleInput): Promise<Role> => {
    try {
      const result = await updateRoleMutation({ input });
      if (!result?.data?.updateRole) throw new Error('更新角色失败');
      await refetchRoles();
      message.success('更新角色成功');
      return result.data.updateRole;
    } catch (err) {
      message.error('更新角色失败');
      throw err;
    }
  };

  const deleteRole = async (id: string): Promise<boolean> => {
    try {
      const result = await deleteRoleMutation({ id });
      if (!result?.data?.deleteRole) throw new Error('删除角色失败');
      await refetchRoles();
      message.success('删除角色成功');
      return result.data.deleteRole;
    } catch (err) {
      message.error('删除角色失败');
      throw err;
    }
  };

  const addPermissionsToRole = async (roleId: string, permissionIds: string[]): Promise<Role> => {
    try {
      const result = await addPermissionsToRoleMutation({ roleId, permissionIds });
      if (!result?.data?.addPermissionsToRole) throw new Error('添加权限失败');
      await refetchRoles();
      message.success('添加权限成功');
      return result.data.addPermissionsToRole;
    } catch (err) {
      message.error('添加权限失败');
      throw err;
    }
  };

  const removePermissionsFromRole = async (roleId: string, permissionIds: string[]): Promise<Role> => {
    try {
      const result = await removePermissionsFromRoleMutation({ roleId, permissionIds });
      if (!result?.data?.removePermissionsFromRole) throw new Error('移除权限失败');
      await refetchRoles();
      message.success('移除权限成功');
      return result.data.removePermissionsFromRole;
    } catch (err) {
      message.error('移除权限失败');
      throw err;
    }
  };

  return {
    permissions,
    roles,
    isLoading,
    error,
    createPermission,
    updatePermission,
    deletePermission,
    createRole,
    updateRole,
    deleteRole,
    addPermissionsToRole,
    removePermissionsFromRole,
  };
} 