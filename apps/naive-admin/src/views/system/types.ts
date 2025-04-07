import type { Ref } from 'vue';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionInput {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionInput extends Partial<CreatePermissionInput> {
  id: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds: string[];
}

export interface UpdateRoleInput extends Partial<Omit<CreateRoleInput, 'permissionIds'>> {
  id: string;
}

export interface UsePermissionReturn {
  permissions: Ref<Permission[]>;
  roles: Ref<Role[]>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  
  // 权限操作
  createPermission: (input: CreatePermissionInput) => Promise<Permission>;
  updatePermission: (input: UpdatePermissionInput) => Promise<Permission>;
  deletePermission: (id: string) => Promise<boolean>;
  
  // 角色操作
  createRole: (input: CreateRoleInput) => Promise<Role>;
  updateRole: (input: UpdateRoleInput) => Promise<Role>;
  deleteRole: (id: string) => Promise<boolean>;
  addPermissionsToRole: (roleId: string, permissionIds: string[]) => Promise<Role>;
  removePermissionsFromRole: (roleId: string, permissionIds: string[]) => Promise<Role>;
} 