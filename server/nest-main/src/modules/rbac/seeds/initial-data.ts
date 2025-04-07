import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

// 基础资源类型
export const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  SYSTEM: 'system',
} as const;

// 基础操作类型
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

// 初始权限列表
export const initialPermissions: Partial<Permission>[] = [
  // 用户管理权限
  {
    name: '查看用户',
    resource: RESOURCES.USERS,
    action: ACTIONS.READ,
    description: '允许查看用户列表和用户详情',
  },
  {
    name: '创建用户',
    resource: RESOURCES.USERS,
    action: ACTIONS.CREATE,
    description: '允许创建新用户',
  },
  {
    name: '更新用户',
    resource: RESOURCES.USERS,
    action: ACTIONS.UPDATE,
    description: '允许更新用户信息',
  },
  {
    name: '删除用户',
    resource: RESOURCES.USERS,
    action: ACTIONS.DELETE,
    description: '允许删除用户',
  },

  // 角色管理权限
  {
    name: '查看角色',
    resource: RESOURCES.ROLES,
    action: ACTIONS.READ,
    description: '允许查看角色列表和角色详情',
  },
  {
    name: '创建角色',
    resource: RESOURCES.ROLES,
    action: ACTIONS.CREATE,
    description: '允许创建新角色',
  },
  {
    name: '更新角色',
    resource: RESOURCES.ROLES,
    action: ACTIONS.UPDATE,
    description: '允许更新角色信息和权限',
  },
  {
    name: '删除角色',
    resource: RESOURCES.ROLES,
    action: ACTIONS.DELETE,
    description: '允许删除角色',
  },

  // 权限管理权限
  {
    name: '查看权限',
    resource: RESOURCES.PERMISSIONS,
    action: ACTIONS.READ,
    description: '允许查看权限列表和权限详情',
  },
  {
    name: '创建权限',
    resource: RESOURCES.PERMISSIONS,
    action: ACTIONS.CREATE,
    description: '允许创建新权限',
  },
  {
    name: '更新权限',
    resource: RESOURCES.PERMISSIONS,
    action: ACTIONS.UPDATE,
    description: '允许更新权限信息',
  },
  {
    name: '删除权限',
    resource: RESOURCES.PERMISSIONS,
    action: ACTIONS.DELETE,
    description: '允许删除权限',
  },

  // 系统管理权限
  {
    name: '系统管理',
    resource: RESOURCES.SYSTEM,
    action: ACTIONS.MANAGE,
    description: '系统管理权限，包含所有系统级操作',
  },
];

// 初始角色列表
export const initialRoles: Partial<Role>[] = [
  {
    name: '超级管理员',
    description: '系统超级管理员，拥有所有权限',
    isActive: true,
  },
  {
    name: '管理员',
    description: '系统管理员，拥有大部分管理权限',
    isActive: true,
  },
  {
    name: '普通用户',
    description: '普通用户，拥有基本操作权限',
    isActive: true,
  },
]; 