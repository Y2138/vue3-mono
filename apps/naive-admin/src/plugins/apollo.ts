import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { type App } from 'vue';

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
});

const cache = new InMemoryCache();

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
});

export function setupApollo(app: App) {
  app.provide(DefaultApolloClient, apolloClient);
} 