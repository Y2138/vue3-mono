/**
 * 角色类型定义
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户信息类型定义
 */
export interface UserInfo {
  phone: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  phone: string;
  password: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  token: string;
  user: UserInfo;
}

/**
 * 注册请求参数
 */
export interface RegisterParams {
  phone: string;
  username: string;
  password: string;
} 