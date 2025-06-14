module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:security/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'vue',
    'security'
  ],
  rules: {
    // 禁止硬编码规则
    'no-magic-numbers': ['error', { 
      ignore: [0, 1, -1],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true
    }],
    'security/detect-hardcoded-secrets': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    
    // Vue 规则
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/prop-name-casing': ['error', 'camelCase'],
    'vue/attribute-hyphenation': ['error', 'never'],
    
    // TypeScript 规则
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // 命名规范
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variableLike',
        format: ['camelCase']
      },
      {
        selector: 'typeLike',
        format: ['PascalCase']
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      }
    ],
    
    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },
  overrides: [
    {
      files: ['src/main/**/*.ts'],
      env: {
        node: true,
        browser: false
      }
    },
    {
      files: ['src/renderer/**/*.{ts,vue}'],
      env: {
        node: false,
        browser: true
      }
    }
  ]
}
