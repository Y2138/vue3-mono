// 自动生成的类型导出文件（精简模式）
// 只包含接口类型定义，不包含编码/解码逻辑  
// 自动解决 protobufPackage 命名冲突
// 请勿手动修改
// PROTO SOURCE: /Users/staff/Documents/my-tools/vue3-mono/protosusers.proto

// Common types
export type {
  Timestamp,
  PaginationRequest,
  PaginationResponse,
  ResponseStatus,
  ErrorDetail
} from './common';

// Health types
export type {
  HealthCheckRequest,
  HealthCheckResponse,
  Health
} from './health';

// Rbac types
export type {
  Permission,
  Role,
  GetPermissionRequest,
  GetPermissionsRequest,
  GetPermissionsResponse,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  GetRoleRequest,
  GetRolesRequest,
  GetRolesResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRolePermissionsRequest,
  RemoveRolePermissionsRequest,
  CheckPermissionRequest,
  CheckPermissionResponse,
  PermissionService,
  RoleService
} from './rbac';

// Users types
export type {
  User,
  LoginRequest,
  AuthResponse,
  GetUserRequest,
  CreateUserRequest,
  UpdateUserRequest,
  GetUsersRequest,
  GetUsersResponse,
  RegisterRequest,
  CreateSuperAdminRequest,
  UserService
} from './users';