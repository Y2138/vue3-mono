import { ref, Ref } from 'vue';
import { apolloClient } from '@/plugins/apollo';
import type { DocumentNode } from 'graphql';
import { gql } from '@apollo/client/core';

/**
 * GraphQL查询钩子
 * @param document GraphQL查询文档
 * @param options 查询选项
 */
export function useQuery<T = any>(
  document: DocumentNode | string, 
  options: {
    variables?: any;
    fetchPolicy?: 'cache-first' | 'network-only' | 'cache-only' | 'no-cache';
    skip?: boolean;
    immediate?: boolean;
  } = {}
) {
  const result = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // 如果传入的是字符串，转换为DocumentNode
  const query = typeof document === 'string' ? gql(document) : document;

  // 查询方法
  const execute = async (variables?: any) => {
    // 合并变量
    const finalVariables = variables 
      ? { ...options.variables, ...variables } 
      : options.variables;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apolloClient.query({
        query,
        variables: finalVariables,
        fetchPolicy: options.fetchPolicy || 'cache-first'
      });
      
      result.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err as Error;
      throw error.value;
    } finally {
      loading.value = false;
    }
  };
  
  // 如果immediate为true且不跳过查询，立即执行查询
  if (options.immediate !== false && !options.skip) {
    setTimeout(() => {
      execute();
    }, 0);
  }
  
  return {
    result,
    loading,
    error,
    execute
  };
}

/**
 * GraphQL变更钩子
 * @param document GraphQL变更文档
 * @param options 变更选项
 */
export function useMutation<T = any>(
  document: DocumentNode | string,
  options: {
    variables?: any;
    refetchQueries?: string[];
    onCompleted?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const result = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  // 如果传入的是字符串，转换为DocumentNode
  const mutation = typeof document === 'string' ? gql(document) : document;
  
  // 变更方法
  const execute = async (variables?: any): Promise<T> => {
    // 合并变量
    const finalVariables = variables 
      ? { ...options.variables, ...variables } 
      : options.variables;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apolloClient.mutate({
        mutation,
        variables: finalVariables
      });
      
      result.value = response.data;
      
      if (options.onCompleted && result.value) {
        options.onCompleted(result.value);
      }
      
      return result.value;
    } catch (err) {
      error.value = err as Error;
      
      if (options.onError) {
        options.onError(err as Error);
      }
      
      throw error.value;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    result,
    loading,
    error,
    execute
  };
}

/**
 * GraphQL懒加载查询钩子
 * @param document GraphQL查询文档
 * @param options 查询选项
 */
export function useLazyQuery<T = any>(
  document: DocumentNode | string,
  options: {
    variables?: any;
    fetchPolicy?: 'cache-first' | 'network-only' | 'cache-only' | 'no-cache';
  } = {}
) {
  const result = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  // 如果传入的是字符串，转换为DocumentNode
  const query = typeof document === 'string' ? gql(document) : document;
  
  // 查询方法
  const execute = async (variables?: any) => {
    // 合并变量
    const finalVariables = variables 
      ? { ...options.variables, ...variables } 
      : options.variables;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await apolloClient.query({
        query,
        variables: finalVariables,
        fetchPolicy: options.fetchPolicy || 'cache-first'
      });
      
      result.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err as Error;
      throw error.value;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    result,
    loading,
    error,
    execute
  };
} 