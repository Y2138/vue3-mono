import { useQuery, useMutation } from '@/hooks/useGraphQL';
import type { LoginParams, LoginResponse, RegisterParams } from '@/types/user';

/**
 * 登录接口
 * @param data 登录参数
 */
export const api_login = async (data: LoginParams): Promise<LoginResponse> => {
  const { execute } = useMutation<{ login: LoginResponse }>(`
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        token
        user {
          phone
          username
          isActive
          createdAt
          updatedAt
          roles {
            id
            name
            description
            isActive
            createdAt
            updatedAt
          }
        }
      }
    }
  `);

  try {
    const result = await execute({ input: data });
    
    if (result?.login) {
      // 登录成功后存储token
      localStorage.setItem('token', result.login.token);
      return result.login;
    }
    throw new Error('登录失败');
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
};

/**
 * 注册接口
 * @param data 注册参数
 */
export const api_register = async (data: RegisterParams): Promise<LoginResponse> => {
  const { execute } = useMutation<{ register: LoginResponse }>(`
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        token
        user {
          phone
          username
          isActive
          createdAt
          updatedAt
          roles {
            id
            name
          }
        }
      }
    }
  `);

  try {
    const result = await execute({ input: data });
    
    if (result?.register) {
      // 注册成功后存储token
      localStorage.setItem('token', result.register.token);
      return result.register;
    }
    throw new Error('注册失败');
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
};

/**
 * 获取当前用户信息
 */
export const api_getCurrentUser = async () => {
  const { execute } = useQuery(`
    query GetCurrentUser {
      getCurrentUser {
        phone
        username
        isActive
        createdAt
        updatedAt
        roles {
          id
          name
          description
          isActive
        }
      }
    }
  `, { immediate: false });

  try {
    const result = await execute();
    
    if (result?.getCurrentUser) {
      return result.getCurrentUser;
    }
    throw new Error('获取用户信息失败');
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
};

/**
 * 退出登录
 */
export const api_logout = async () => {
  const { execute } = useMutation(`
    mutation Logout {
      logout
    }
  `);

  try {
    const result = await execute();
    
    // 无论后端返回什么，都清除本地token
    localStorage.removeItem('token');
    
    return result?.logout;
  } catch (error) {
    console.error('退出登录失败:', error);
    // 即使报错也清除本地token
    localStorage.removeItem('token');
    throw error;
  }
}; 