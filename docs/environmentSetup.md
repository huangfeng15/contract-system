# 环境配置与部署文档

## 一、开发环境要求

### 1.1 系统要求
- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 2.30.0 或更高版本
- **内存**: 最少 8GB RAM（推荐 16GB）
- **存储**: 最少 10GB 可用空间

### 1.2 开发工具推荐
- **IDE**: Visual Studio Code
- **浏览器**: Chrome 100+ (用于调试)
- **数据库工具**: DB Browser for SQLite
- **API测试**: Postman 或 Insomnia

## 二、项目初始化

### 2.1 克隆项目
```bash
git clone <repository-url>
cd contract-management-system
```

### 2.2 安装依赖
```bash
# 安装项目依赖
npm install

# 验证安装
npm run check-env
```

### 2.3 环境变量配置
创建 `.env` 文件：
```bash
# 数据库配置
DB_ENCRYPTION_KEY=your-32-character-encryption-key
DB_MAX_CONNECTIONS=10
DB_TIMEOUT=30000
DB_BACKUP_INTERVAL=86400000

# 文件处理配置
MAX_FILE_SIZE=52428800
ALLOWED_EXTENSIONS=.xlsx,.xls
UPLOAD_PATH=./uploads

# 分页配置
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# UI配置
UI_THEME=light
UI_LANGUAGE=zh-CN
TABLE_HEIGHT=auto

# 开发环境配置
NODE_ENV=development
LOG_LEVEL=debug
```

### 2.4 开发环境配置文件
创建 `.env.development`：
```bash
# 开发环境特定配置
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_DEV_TOOLS=true
HOT_RELOAD=true
```

## 三、开发命令

### 3.1 基础命令
```bash
# 开发模式启动
npm run dev

# 构建项目
npm run build

# 运行测试
npm run test

# 运行端到端测试
npm run test:e2e

# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

### 3.2 数据库命令
```bash
# 初始化数据库
npm run db:init

# 运行迁移
npm run db:migrate

# 重置数据库
npm run db:reset

# 备份数据库
npm run db:backup

# 恢复数据库
npm run db:restore
```

## 四、构建与打包

### 4.1 开发构建
```bash
# 开发构建（包含调试信息）
npm run build:dev

# 生产构建
npm run build:prod

# 构建并打包
npm run dist
```

### 4.2 平台特定打包
```bash
# Windows 打包
npm run dist:win

# macOS 打包
npm run dist:mac

# Linux 打包
npm run dist:linux

# 全平台打包
npm run dist:all
```

## 五、部署配置

### 5.1 生产环境变量
创建 `.env.production`：
```bash
NODE_ENV=production
LOG_LEVEL=info
DB_ENCRYPTION_KEY=production-encryption-key
ENABLE_DEV_TOOLS=false
AUTO_UPDATE=true
```

### 5.2 安装包配置
```javascript
// electron-builder.config.js
module.exports = {
  appId: 'com.company.contract-management',
  productName: '采购合同管理系统',
  directories: {
    output: 'dist'
  },
  files: [
    'dist-electron/**/*',
    'dist/**/*',
    'node_modules/**/*',
    '!node_modules/**/test/**/*',
    '!node_modules/**/*.md'
  ],
  win: {
    target: 'nsis',
    icon: 'build/icon.ico',
    requestedExecutionLevel: 'asInvoker'
  },
  mac: {
    target: 'dmg',
    icon: 'build/icon.icns',
    category: 'public.app-category.business'
  },
  linux: {
    target: 'AppImage',
    icon: 'build/icon.png',
    category: 'Office'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};
```

## 六、故障排除

### 6.1 常见问题
1. **Node.js 版本不兼容**
   ```bash
   # 使用 nvm 切换版本
   nvm install 18
   nvm use 18
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Electron 启动失败**
   ```bash
   # 重新构建 native 模块
   npm run electron:rebuild
   ```

### 6.2 调试配置
VSCode 调试配置 `.vscode/launch.json`：
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
      "outputCapture": "std"
    }
  ]
}
```

## 七、性能监控

### 7.1 开发性能监控
```bash
# 启动性能分析
npm run dev:profile

# 内存使用分析
npm run analyze:memory

# 包大小分析
npm run analyze:bundle
```

### 7.2 生产性能监控
- 应用启动时间监控
- 内存使用监控
- 数据库查询性能监控
- 文件处理性能监控

## 八、安全配置

### 8.1 开发环境安全
- 禁用 Node.js 集成
- 启用上下文隔离
- 启用沙箱模式
- 禁用实验性功能

### 8.2 生产环境安全
- 代码签名配置
- 自动更新安全验证
- 数据库加密
- 文件访问权限控制
