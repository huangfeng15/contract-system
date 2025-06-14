# 项目配置文件模板

## 一、项目配置文件

### 1.1 package.json
```json
{
  "name": "contract-management-system",
  "version": "1.0.0",
  "description": "采购合同管理系统",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build && electron-builder",
    "build:dev": "vue-tsc --noEmit && vite build --mode development",
    "build:prod": "vue-tsc --noEmit && vite build --mode production",
    "preview": "vite preview",
    "electron:dev": "electron .",
    "electron:build": "electron-builder",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "format": "prettier --write .",
    "type-check": "vue-tsc --noEmit",
    "db:init": "node scripts/initDatabase.js",
    "db:migrate": "node scripts/migrate.js",
    "db:reset": "node scripts/resetDatabase.js",
    "check-env": "node scripts/checkEnvironment.js"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.3.0",
    "@element-plus/icons-vue": "^2.1.0",
    "electron": "^25.0.0",
    "sqlite3": "^5.1.0",
    "better-sqlite3": "^8.14.0",
    "xlsx": "^0.18.0",
    "joi": "^17.9.0",
    "winston": "^3.9.0",
    "lodash-es": "^4.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@vitejs/plugin-vue": "^4.2.0",
    "@vue/tsconfig": "^0.4.0",
    "typescript": "^5.0.0",
    "vite": "^4.3.0",
    "vue-tsc": "^1.6.0",
    "electron-builder": "^24.0.0",
    "vitest": "^0.32.0",
    "playwright": "^1.35.0",
    "@playwright/test": "^1.35.0",
    "eslint": "^8.42.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "eslint-plugin-vue": "^9.14.0",
    "prettier": "^2.8.0",
    "unplugin-auto-import": "^0.16.0",
    "unplugin-vue-components": "^0.25.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### 1.2 tsconfig.json
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": [
    "env.d.ts",
    "src/**/*",
    "src/**/*.vue",
    "tests/**/*"
  ],
  "exclude": [
    "src/**/__tests__/*",
    "dist",
    "dist-electron",
    "node_modules"
  ],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/renderer/*"],
      "@main/*": ["./src/main/*"],
      "@shared/*": ["./src/shared/*"]
    },
    "types": [
      "node",
      "electron",
      "vite/client"
    ],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "preserveValueImports": true
  }
}
```

### 1.3 vite.config.ts
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: [
        'vue',
        'vue-router',
        'pinia'
      ],
      dts: true
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron']
    }
  },
  server: {
    port: 3000,
    strictPort: true
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false
  }
});
```

## 二、开发工具配置

### 2.1 ESLint配置 (.eslintrc.js)
```javascript
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
    'plugin:vue/vue3-recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'vue'
  ],
  rules: {
    // 硬编码检查规则
    'no-magic-numbers': ['error', {
      ignore: [0, 1, -1],
      ignoreArrayIndexes: true,
      enforceConst: true,
      detectObjects: false
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // TypeScript规则
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'error',
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    
    // 代码质量规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    
    // 命名规范
    'camelcase': ['error', { properties: 'never' }],
    'new-cap': ['error', { newIsCap: true, capIsNew: false }]
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
};
```

### 2.2 Prettier配置 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false,
  "htmlWhitespaceSensitivity": "ignore"
}
```

### 2.3 Vitest配置 (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'dist-electron/',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
});
```

### 2.4 Playwright配置 (playwright.config.ts)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

## 三、环境配置文件

### 3.1 开发环境 (.env.development)
```bash
# 应用配置
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_DEV_TOOLS=true
HOT_RELOAD=true

# 数据库配置
DB_ENCRYPTION_KEY=dev-encryption-key-32-characters
DB_MAX_CONNECTIONS=5
DB_TIMEOUT=10000
DB_BACKUP_INTERVAL=3600000

# 文件处理配置
MAX_FILE_SIZE=52428800
ALLOWED_EXTENSIONS=.xlsx,.xls,.csv
UPLOAD_PATH=./uploads

# 分页配置
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# UI配置
UI_THEME=light
UI_LANGUAGE=zh-CN
TABLE_HEIGHT=auto

# 性能配置
ENABLE_PERFORMANCE_MONITORING=true
CACHE_TIMEOUT=300000
VIRTUAL_SCROLL_THRESHOLD=100
```

### 3.2 生产环境 (.env.production)
```bash
# 应用配置
NODE_ENV=production
LOG_LEVEL=info
ENABLE_DEV_TOOLS=false
AUTO_UPDATE=true

# 数据库配置
DB_ENCRYPTION_KEY=production-encryption-key-32-chars
DB_MAX_CONNECTIONS=10
DB_TIMEOUT=30000
DB_BACKUP_INTERVAL=86400000

# 文件处理配置
MAX_FILE_SIZE=104857600
ALLOWED_EXTENSIONS=.xlsx,.xls
UPLOAD_PATH=./data/uploads

# 分页配置
DEFAULT_PAGE_SIZE=50
MAX_PAGE_SIZE=200

# UI配置
UI_THEME=light
UI_LANGUAGE=zh-CN
TABLE_HEIGHT=auto

# 性能配置
ENABLE_PERFORMANCE_MONITORING=false
CACHE_TIMEOUT=600000
VIRTUAL_SCROLL_THRESHOLD=200
```

## 四、构建配置

### 4.1 Electron Builder配置 (electron-builder.config.js)
```javascript
module.exports = {
  appId: 'com.company.contract-management',
  productName: '采购合同管理系统',
  copyright: 'Copyright © 2024 Company Name',
  directories: {
    output: 'release',
    buildResources: 'build'
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
    'node_modules/**/*',
    '!node_modules/**/test/**/*',
    '!node_modules/**/*.md',
    '!node_modules/**/*.map'
  ],
  extraResources: [
    {
      from: 'resources',
      to: 'resources'
    }
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      }
    ],
    icon: 'build/icon.ico',
    requestedExecutionLevel: 'asInvoker',
    artifactName: '${productName}-${version}-${arch}.${ext}'
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'build/icon.icns',
    category: 'public.app-category.business',
    artifactName: '${productName}-${version}-${arch}.${ext}'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      }
    ],
    icon: 'build/icon.png',
    category: 'Office',
    artifactName: '${productName}-${version}-${arch}.${ext}'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '采购合同管理系统',
    include: 'build/installer.nsh'
  },
  dmg: {
    title: '${productName} ${version}',
    icon: 'build/icon.icns',
    background: 'build/dmg-background.png',
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 130,
        y: 150,
        type: 'file'
      }
    ]
  },
  publish: {
    provider: 'github',
    owner: 'your-username',
    repo: 'contract-management-system'
  }
};
```

## 五、VSCode配置

### 5.1 工作区配置 (.vscode/settings.json)
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  "vetur.validation.template": false,
  "vetur.validation.script": false,
  "vetur.validation.style": false,
  "files.associations": {
    "*.vue": "vue"
  },
  "emmet.includeLanguages": {
    "vue-html": "html"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/dist-electron": true,
    "**/.git": true
  }
}
```

### 5.2 调试配置 (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": [".", "--remote-debugging-port=9222"],
      "outputCapture": "std",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/src/renderer",
      "timeout": 30000
    }
  ]
}
```

## 六、Git配置

### 6.1 .gitignore
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
dist-electron/
release/
*.tgz

# Environment files
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Database
*.db
*.sqlite
*.sqlite3

# Temporary files
tmp/
temp/
.tmp/

# Coverage
coverage/
.nyc_output/

# Playwright
test-results/
playwright-report/
```
