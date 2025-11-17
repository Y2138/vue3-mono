import { Role, UserRole, RoleResource } from '@prisma/client';

export interface CreateRoleDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface RoleWithRelations extends Role {
  user_roles: (UserRole & {
    user: {
      phone: string;
      username: string;
    };
  })[];
  role_resources: (RoleResource & {
    resource: {
      id: string;
      name: string;
      type: string;
      url: string;
    };
  })[];
}

export interface AssignResourcesDto {
  resourceIds: string[];
}

export interface RolePermissionTreeNode {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  resourceUrl: string;
  isAssigned: boolean;
  isIndeterminate: boolean;
  children: RolePermissionTreeNode[];
  level: number;
  parentId?: string;
}

export interface CreateRoleResponse {
  success: boolean;
  data?: Role;
  message?: string;
}

export interface UpdateRoleResponse {
  success: boolean;
  data?: Role;
  message?: string;
}

export interface DeleteRoleResponse {
  success: boolean;
  message?: string;
}

export interface GetRoleResponse {
  success: boolean;
  data?: RoleWithRelations;
  message?: string;
}

export interface GetRolesResponse {
  success: boolean;
  data?: Role[];
  total?: number;
  message?: string;
}

export interface AssignPermissionsResponse {
  success: boolean;
  message?: string;
}

export interface GetRolePermissionsResponse {
  success: boolean;
  data?: {
    role: Role;
    permissionTree: RolePermissionTreeNode[];
    permissions: string[];
  };
  message?: string;
}

export interface CheckUserRoleResponse {
  success: boolean;
  data?: {
    hasRole: boolean;
    userRoles: Role[];
  };
  message?: string;
}