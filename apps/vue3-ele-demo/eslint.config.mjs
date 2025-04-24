import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
// import pluginPrettier from 'eslint-plugin-prettier/recommended';
import eslintConfigPrettier from "eslint-config-prettier";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules',
      'dist',
      'public'
    ]
  },
  {files: ["**/*.{js,mjs,cjs,ts,vue}"]},
  /* 配置全局变量 */
  {languageOptions: { globals: globals.browser }},
  /* js插件的推荐规则 */
  pluginJs.configs.recommended,
  /* ts插件的推荐规则 */
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,vue}'],
    rules: {
      // 配置自定义ts规则
      // "no-unused-vars": 0,
      "@typescript-eslint/no-unused-vars": 2,
    },
  },
  /* vue插件的推荐规则 */
  ...pluginVue.configs["flat/essential"],
  /* 对vue文件启用ts解析，并配置单独规则 */
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        /* 启用jsx */
        ecmaFeatures: {
          jsx: true,
        }
      }
    },
    rules: {
      // 可以在这里追加vue规则
      'vue/no-unused-vars': 'error'
    }
  },
  /* 通用配置  */
  {
    rules: {
      'arrow-body-style': ['off'],
      'prefer-arrow-callback': 'off'
    }
  },
  /* prettier配置，会忽略所有与prettier冲突的插件 */
  eslintConfigPrettier,
  /* prettier插件配置，会合并根目录下的 prettier.config.js */
  // pluginPrettier,
];