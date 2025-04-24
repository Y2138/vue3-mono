import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { DefaultApolloClient, provideApolloClient } from '@vue/apollo-composable';
import { type App } from 'vue';

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
});

const authLink = setContext((_, { headers, operationName }) => {
  // 定义不需要认证的 GraphQL 操作名称列表
  const nonAuthOperations = ['Login', 'Register'];

  // 检查当前操作是否在非认证列表中
  if (nonAuthOperations.includes(operationName || '')) {
    return {
      headers,
    };
  }

  // 获取存储的 token
  const token = localStorage.getItem('token');
  // 如果 token 存在，将其添加到 headers
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

const cache = new InMemoryCache();

// 使用 ApolloLink.from 链接 authLink 和 httpLink
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache,
});

// 为组件外部使用提供一个工具函数
export function useApolloOutsideSetup() {
  return provideApolloClient(apolloClient);
}

export function setupApollo(app: App) {
  app.provide(DefaultApolloClient, apolloClient);
}