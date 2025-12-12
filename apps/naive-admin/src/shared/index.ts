// 自动生成的类型导出文件（精简模式）
// 只包含接口类型定义，不包含编码/解码逻辑
// 自动解决 protobufPackage 命名冲突
// 请勿手动修改
// PROTO SOURCE: /Users/staff/Documents/my-tools/vue3-mono/protosresource.proto

// Common types
export type {
  PaginationRequest,
  PaginationResponse,
  ResponseStatus,
  EmptyRequest,
  ErrorDetail,
  EnumItem,
  EnumItemList,
  EnumResponse,
  EnumResponse_EnumsEntry
} from './common';

// Health types
export type {
  HealthCheckRequest,
  HealthCheckResponse,
  Health
} from './health';

// Resource types
export type {
  Resource,
  ResourceTree,
  CreateResourceRequest,
  UpdateResourceRequest,
  GetResourceRequest,
  GetResourcesRequest,
  ResourceListResponse,
  ResourceResponse,
  ResourceTreeResponse,
  ResourceService
} from './resource';

// Role types
export type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  GetRoleRequest,
  GetRolesRequest,
  GetRolesResponse,
  DeleteRoleRequest,
  AssignPermissionsToRoleRequest,
  RemoveRolePermissionsRequest,
  RoleService
} from './role';

// Users types
export type {
  User,
  LoginRequest,
  AuthResponse,
  GetUserRequest,
  CreateUserRequest,
  UpdateUserRequest,
  DeleteUserRequest,
  UpdateUserStatusRequest,
  CreateUserFormRequest,
  GetUsersRequest,
  GetUsersResponse,
  RegisterRequest,
  CreateSuperAdminRequest,
  GetUserEnumsRequest,
  GetUserEnumsResponse,
  UserService
} from './users';