// apollo.config.ts
export default {
  client: {
    service: {
      name: 'naive-admin',
      // GraphQL API 的 URL
      url: 'http://localhost:3000/graphql',
    },
    // 通过扩展名选择需要处理的文件
    includes: [
      'src/**/*.vue',
      'src/**/*.ts',
    ],
  },
}