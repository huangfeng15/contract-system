# 数据库设计详细文档

## 一、数据库概述

### 1.1 数据库选择
- **数据库类型**: SQLite 3.x
- **加密方式**: SQLCipher
- **文件位置**: `{userData}/contracts.db`
- **备份策略**: 每日自动备份，保留7天

### 1.2 设计原则
- **混合模式设计**: 核心字段固定化，扩展字段使用JSON格式
- **查询性能优化**: 常用查询字段建立固定列和索引
- **数据清洗机制**: 导入后统一清洗日期、金额等特殊字段
- **数据完整性**: 外键约束和检查约束
- **字段分类管理**: 区分核心字段和扩展字段

## 二、表结构设计

### 2.1 项目表 (projects)
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectCode TEXT UNIQUE NOT NULL,           -- 项目编号
  projectName TEXT NOT NULL,                  -- 项目名称
  projectAlias TEXT,                          -- 项目别名（逗号分隔）
  description TEXT,                           -- 项目描述
  status TEXT DEFAULT 'active',               -- 项目状态
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 约束
  CHECK (status IN ('active', 'inactive', 'archived')),
  CHECK (length(projectCode) <= 50),
  CHECK (length(projectName) <= 200)
);

-- 索引
CREATE INDEX idx_projects_code ON projects(projectCode);
CREATE INDEX idx_projects_name ON projects(projectName);
CREATE INDEX idx_projects_status ON projects(status);
```

### 2.2 字段配置表 (fieldConfigs)
```sql
CREATE TABLE fieldConfigs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fieldName TEXT NOT NULL,                    -- 字段名称
  fieldAlias TEXT,                           -- 字段别名（逗号分隔）
  fieldType TEXT NOT NULL,                   -- 字段类型（contract/procurement）
  dataType TEXT NOT NULL,                    -- 数据类型
  fieldCategory TEXT DEFAULT 'extended',     -- 字段分类（core/extended）
  isVisible BOOLEAN DEFAULT 1,               -- 是否显示
  displayOrder INTEGER DEFAULT 0,            -- 显示顺序
  isRequired BOOLEAN DEFAULT 0,              -- 是否必填
  defaultValue TEXT,                         -- 默认值
  validationRule TEXT,                       -- 验证规则（JSON）
  cleaningRule TEXT,                         -- 数据清洗规则（JSON）
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 约束
  CHECK (fieldType IN ('contract', 'procurement')),
  CHECK (dataType IN ('text', 'number', 'date', 'boolean', 'json')),
  CHECK (fieldCategory IN ('core', 'extended')),
  CHECK (displayOrder >= 0),
  UNIQUE(fieldName, fieldType)
);

-- 索引
CREATE INDEX idx_fieldConfigs_type ON fieldConfigs(fieldType);
CREATE INDEX idx_fieldConfigs_category ON fieldConfigs(fieldCategory);
CREATE INDEX idx_fieldConfigs_order ON fieldConfigs(displayOrder);
CREATE INDEX idx_fieldConfigs_visible ON fieldConfigs(isVisible);
```

### 2.3 合同数据表 (contracts) - 混合模式设计
```sql
CREATE TABLE contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER,                         -- 项目ID

  -- 核心业务字段（固定列，便于查询和索引）
  contractSequence TEXT,                     -- 合同序号
  contractNumber TEXT,                       -- 合同编号
  contractName TEXT,                         -- 合同名称
  contractHandler TEXT,                      -- 合同签订经办人
  partyA TEXT,                              -- 甲方
  partyB TEXT,                              -- 乙方
  partyBContact TEXT,                       -- 乙方负责人及联系方式
  contractContact TEXT,                     -- 合同文本内乙方联系人及方式
  contractAmount DECIMAL(15,2),             -- 含税签约合同价（元）
  signDate DATE,                            -- 签订日期
  contractPeriod TEXT,                      -- 合同工期/服务期限
  guaranteeReturnDate DATE,                 -- 履约担保退回时间

  -- 文件信息（融入工作表信息）
  filePath TEXT NOT NULL,                   -- 文件路径
  fileName TEXT NOT NULL,                   -- 文件名
  fileSize INTEGER,                         -- 文件大小
  fileHash TEXT,                            -- 文件哈希值
  sheetName TEXT NOT NULL,                  -- 工作表名称

  -- 扩展字段（JSON存储非核心字段）
  extendedFields TEXT,                      -- 扩展字段数据（JSON）

  -- 处理状态
  status TEXT DEFAULT 'pending',            -- 处理状态
  totalRows INTEGER DEFAULT 0,              -- 总行数
  processedRows INTEGER DEFAULT 0,          -- 已处理行数
  errorRows INTEGER DEFAULT 0,              -- 错误行数
  matchScore REAL DEFAULT 0,                -- 项目匹配分数
  isVerified BOOLEAN DEFAULT 0,             -- 是否已验证
  hasErrors BOOLEAN DEFAULT 0,              -- 是否有错误
  errorInfo TEXT,                           -- 错误信息（JSON）
  processingLog TEXT,                       -- 处理日志（JSON）
  cleaningLog TEXT,                         -- 数据清洗日志（JSON）

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 外键约束
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL,

  -- 约束
  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CHECK (totalRows >= 0),
  CHECK (processedRows >= 0),
  CHECK (errorRows >= 0),
  CHECK (matchScore >= 0 AND matchScore <= 1),
  CHECK (contractAmount >= 0),
  CHECK (extendedFields IS NULL OR json_valid(extendedFields))
);

-- 核心字段索引（优化查询性能）
CREATE INDEX idx_contracts_project ON contracts(projectId);
CREATE INDEX idx_contracts_sequence ON contracts(contractSequence);
CREATE INDEX idx_contracts_number ON contracts(contractNumber);
CREATE INDEX idx_contracts_name ON contracts(contractName);
CREATE INDEX idx_contracts_amount ON contracts(contractAmount);
CREATE INDEX idx_contracts_signDate ON contracts(signDate);
CREATE INDEX idx_contracts_partyA ON contracts(partyA);
CREATE INDEX idx_contracts_partyB ON contracts(partyB);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_verified ON contracts(isVerified);
CREATE INDEX idx_contracts_file ON contracts(fileName);
CREATE INDEX idx_contracts_created ON contracts(createdAt);
```

### 2.4 采购数据表 (procurements) - 混合模式设计
```sql
CREATE TABLE procurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  projectId INTEGER,                         -- 项目ID

  -- 核心业务字段（固定列，便于查询和索引）
  procurementNumber TEXT,                    -- 招采编号
  procurementName TEXT,                      -- 采购名称
  procurer TEXT,                            -- 采购人
  planCompleteDate DATE,                    -- 采购计划完成日期
  demandApprovalDate DATE,                  -- 采购需求书审批完成日期（OA）
  procurementHandler TEXT,                  -- 招采经办人
  demandDepartment TEXT,                    -- 需求部门
  demandContact TEXT,                       -- 需求部门经办人及联系方式
  budgetAmount DECIMAL(15,2),               -- 预算金额（元）
  controlPrice DECIMAL(15,2),               -- 采购控制价（元）
  winningPrice DECIMAL(15,2),               -- 中标价（元）
  procurementPlatform TEXT,                 -- 采购平台
  procurementMethod TEXT,                   -- 采购方式
  evaluationMethod TEXT,                    -- 评标方法
  awardMethod TEXT,                         -- 定标方法
  bidOpeningDate DATE,                      -- 开标日期
  evaluationCommittee TEXT,                 -- 评标委员会成员
  awardCommittee TEXT,                      -- 定标委员会成员
  resultPublishDate DATE,                   -- 平台中标结果公示完成日期（阳光采购平台）
  noticeIssueDate DATE,                     -- 中标通知书发放日期
  winner TEXT,                              -- 中标人
  winnerContact TEXT,                       -- 中标人联系人及方式

  -- 文件信息（融入工作表信息）
  filePath TEXT NOT NULL,                   -- 文件路径
  fileName TEXT NOT NULL,                   -- 文件名
  fileSize INTEGER,                         -- 文件大小
  fileHash TEXT,                            -- 文件哈希值
  sheetName TEXT NOT NULL,                  -- 工作表名称

  -- 扩展字段（JSON存储非核心字段）
  extendedFields TEXT,                      -- 扩展字段数据（JSON）

  -- 处理状态
  status TEXT DEFAULT 'pending',            -- 处理状态
  totalRows INTEGER DEFAULT 0,              -- 总行数
  processedRows INTEGER DEFAULT 0,          -- 已处理行数
  errorRows INTEGER DEFAULT 0,              -- 错误行数
  matchScore REAL DEFAULT 0,                -- 项目匹配分数
  isVerified BOOLEAN DEFAULT 0,             -- 是否已验证
  hasErrors BOOLEAN DEFAULT 0,              -- 是否有错误
  errorInfo TEXT,                           -- 错误信息（JSON）
  processingLog TEXT,                       -- 处理日志（JSON）
  cleaningLog TEXT,                         -- 数据清洗日志（JSON）

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 外键约束
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL,

  -- 约束
  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CHECK (totalRows >= 0),
  CHECK (processedRows >= 0),
  CHECK (errorRows >= 0),
  CHECK (matchScore >= 0 AND matchScore <= 1),
  CHECK (budgetAmount >= 0),
  CHECK (controlPrice >= 0),
  CHECK (winningPrice >= 0),
  CHECK (extendedFields IS NULL OR json_valid(extendedFields))
);

-- 核心字段索引（优化查询性能）
CREATE INDEX idx_procurements_project ON procurements(projectId);
CREATE INDEX idx_procurements_number ON procurements(procurementNumber);
CREATE INDEX idx_procurements_name ON procurements(procurementName);
CREATE INDEX idx_procurements_procurer ON procurements(procurer);
CREATE INDEX idx_procurements_budgetAmount ON procurements(budgetAmount);
CREATE INDEX idx_procurements_controlPrice ON procurements(controlPrice);
CREATE INDEX idx_procurements_winningPrice ON procurements(winningPrice);
CREATE INDEX idx_procurements_planDate ON procurements(planCompleteDate);
CREATE INDEX idx_procurements_bidDate ON procurements(bidOpeningDate);
CREATE INDEX idx_procurements_status ON procurements(status);
CREATE INDEX idx_procurements_verified ON procurements(isVerified);
CREATE INDEX idx_procurements_file ON procurements(fileName);
CREATE INDEX idx_procurements_created ON procurements(createdAt);
```

### 2.5 数据清洗规则表 (dataCleaningRules)
```sql
CREATE TABLE dataCleaningRules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fieldName TEXT NOT NULL,                   -- 字段名称
  fieldType TEXT NOT NULL,                   -- 字段类型（contract/procurement）
  dataType TEXT NOT NULL,                    -- 数据类型（date/number/text）
  cleaningType TEXT NOT NULL,                -- 清洗类型（date_format/number_format/text_clean）
  ruleConfig TEXT NOT NULL,                  -- 清洗规则配置（JSON）
  isActive BOOLEAN DEFAULT 1,                -- 是否启用
  priority INTEGER DEFAULT 0,                -- 执行优先级
  description TEXT,                          -- 规则描述
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 约束
  CHECK (fieldType IN ('contract', 'procurement')),
  CHECK (dataType IN ('date', 'number', 'text')),
  CHECK (cleaningType IN ('date_format', 'number_format', 'text_clean', 'remove_chars', 'trim_spaces')),
  CHECK (json_valid(ruleConfig)),
  CHECK (priority >= 0),
  UNIQUE(fieldName, fieldType, cleaningType)
);

-- 索引
CREATE INDEX idx_cleaningRules_field ON dataCleaningRules(fieldName, fieldType);
CREATE INDEX idx_cleaningRules_type ON dataCleaningRules(cleaningType);
CREATE INDEX idx_cleaningRules_active ON dataCleaningRules(isActive);
CREATE INDEX idx_cleaningRules_priority ON dataCleaningRules(priority);
```

### 2.6 系统配置表 (systemConfigs)
```sql
CREATE TABLE systemConfigs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  configKey TEXT UNIQUE NOT NULL,            -- 配置键
  configValue TEXT,                          -- 配置值
  configType TEXT DEFAULT 'string',          -- 配置类型
  description TEXT,                          -- 配置描述
  isSystem BOOLEAN DEFAULT 0,                -- 是否系统配置
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 约束
  CHECK (configType IN ('string', 'number', 'boolean', 'json'))
);

-- 索引
CREATE INDEX idx_systemConfigs_key ON systemConfigs(configKey);
CREATE INDEX idx_systemConfigs_system ON systemConfigs(isSystem);
```

## 三、数据关系图

```
projects (1) ←→ (N) contracts
projects (1) ←→ (N) procurements
fieldConfigs (独立表，配置字段定义)
dataCleaningRules (独立表，配置数据清洗规则)
systemConfigs (独立表，系统配置)
```

## 四、数据清洗机制

### 4.1 清洗规则配置
数据导入后，系统会根据 `dataCleaningRules` 表中的配置对以下类型的数据进行统一清洗：

#### 4.1.1 日期字段清洗
- **目标字段**: signDate, guaranteeReturnDate, planCompleteDate, demandApprovalDate, bidOpeningDate, resultPublishDate, noticeIssueDate
- **清洗规则**:
  - 识别多种日期格式：YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, 中文日期等
  - 处理跨行符号和空字符
  - 统一转换为 YYYY-MM-DD 格式存储

#### 4.1.2 金额字段清洗
- **目标字段**: contractAmount, budgetAmount, controlPrice, winningPrice
- **清洗规则**:
  - 移除货币符号（¥, $, 元等）
  - 移除千分位分隔符（,）
  - 处理中文数字转换
  - 统一转换为数值类型存储

#### 4.1.3 文本字段清洗
- **目标字段**: 所有文本字段
- **清洗规则**:
  - 移除前后空白字符
  - 处理跨行符号（\n, \r\n）
  - 统一空字符处理（NULL, 空字符串, "无"等转为NULL）

### 4.2 清洗执行流程
1. **数据导入**: 原始数据导入到对应表的核心字段
2. **清洗识别**: 根据字段类型和数据类型匹配清洗规则
3. **规则执行**: 按优先级顺序执行清洗规则
4. **结果记录**: 清洗结果记录到 `cleaningLog` 字段
5. **错误处理**: 清洗失败的数据标记错误状态

## 五、数据迁移脚本

### 5.1 初始化脚本
```sql
-- 插入合同核心字段配置
INSERT INTO fieldConfigs (fieldName, fieldAlias, fieldType, dataType, fieldCategory, isVisible, displayOrder, isRequired) VALUES
('contractSequence', '合同序号', 'contract', 'text', 'core', 1, 1, 0),
('contractNumber', '合同编号,合同号', 'contract', 'text', 'core', 1, 2, 1),
('contractName', '合同名称,项目名称', 'contract', 'text', 'core', 1, 3, 1),
('contractHandler', '合同签订经办人,经办人', 'contract', 'text', 'core', 1, 4, 0),
('partyA', '甲方,发包方', 'contract', 'text', 'core', 1, 5, 1),
('partyB', '乙方,承包方', 'contract', 'text', 'core', 1, 6, 1),
('partyBContact', '乙方负责人及联系方式,乙方联系方式', 'contract', 'text', 'core', 1, 7, 0),
('contractContact', '合同文本内乙方联系人及方式,合同联系人', 'contract', 'text', 'core', 1, 8, 0),
('contractAmount', '含税签约合同价（元）,合同金额,总金额', 'contract', 'number', 'core', 1, 9, 1),
('signDate', '签订日期,签约日期', 'contract', 'date', 'core', 1, 10, 1),
('contractPeriod', '合同工期/服务期限,工期,服务期限', 'contract', 'text', 'core', 1, 11, 0),
('guaranteeReturnDate', '履约担保退回时间,担保退回日期', 'contract', 'date', 'core', 1, 12, 0);

-- 插入采购核心字段配置
INSERT INTO fieldConfigs (fieldName, fieldAlias, fieldType, dataType, fieldCategory, isVisible, displayOrder, isRequired) VALUES
('procurementNumber', '招采编号,采购编号', 'procurement', 'text', 'core', 1, 1, 1),
('procurementName', '采购名称,项目名称', 'procurement', 'text', 'core', 1, 2, 1),
('procurer', '采购人', 'procurement', 'text', 'core', 1, 3, 1),
('planCompleteDate', '采购计划完成日期,计划完成日期', 'procurement', 'date', 'core', 1, 4, 0),
('demandApprovalDate', '采购需求书审批完成日期（OA）,需求审批日期', 'procurement', 'date', 'core', 1, 5, 0),
('procurementHandler', '招采经办人,采购经办人', 'procurement', 'text', 'core', 1, 6, 0),
('demandDepartment', '需求部门', 'procurement', 'text', 'core', 1, 7, 0),
('demandContact', '需求部门经办人及联系方式,需求部门联系方式', 'procurement', 'text', 'core', 1, 8, 0),
('budgetAmount', '预算金额（元）,预算金额', 'procurement', 'number', 'core', 1, 9, 0),
('controlPrice', '采购控制价（元）,控制价', 'procurement', 'number', 'core', 1, 10, 0),
('winningPrice', '中标价（元）,中标价', 'procurement', 'number', 'core', 1, 11, 0),
('procurementPlatform', '采购平台', 'procurement', 'text', 'core', 1, 12, 0),
('procurementMethod', '采购方式', 'procurement', 'text', 'core', 1, 13, 0),
('evaluationMethod', '评标方法', 'procurement', 'text', 'core', 1, 14, 0),
('awardMethod', '定标方法', 'procurement', 'text', 'core', 1, 15, 0),
('bidOpeningDate', '开标日期', 'procurement', 'date', 'core', 1, 16, 0),
('evaluationCommittee', '评标委员会成员', 'procurement', 'text', 'core', 1, 17, 0),
('awardCommittee', '定标委员会成员', 'procurement', 'text', 'core', 1, 18, 0),
('resultPublishDate', '平台中标结果公示完成日期（阳光采购平台）,结果公示日期', 'procurement', 'date', 'core', 1, 19, 0),
('noticeIssueDate', '中标通知书发放日期,通知书发放日期', 'procurement', 'date', 'core', 1, 20, 0),
('winner', '中标人', 'procurement', 'text', 'core', 1, 21, 0),
('winnerContact', '中标人联系人及方式,中标人联系方式', 'procurement', 'text', 'core', 1, 22, 0);

-- 插入数据清洗规则
INSERT INTO dataCleaningRules (fieldName, fieldType, dataType, cleaningType, ruleConfig, description, priority) VALUES
-- 日期字段清洗规则
('signDate', 'contract', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '签订日期格式统一', 1),
('guaranteeReturnDate', 'contract', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '担保退回日期格式统一', 1),
('planCompleteDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '计划完成日期格式统一', 1),
('demandApprovalDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '需求审批日期格式统一', 1),
('bidOpeningDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '开标日期格式统一', 1),
('resultPublishDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '结果公示日期格式统一', 1),
('noticeIssueDate', 'procurement', 'date', 'date_format', '{"formats": ["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "YYYY年MM月DD日"], "output": "YYYY-MM-DD"}', '通知书发放日期格式统一', 1),

-- 金额字段清洗规则
('contractAmount', 'contract', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '合同金额格式统一', 1),
('budgetAmount', 'procurement', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '预算金额格式统一', 1),
('controlPrice', 'procurement', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '控制价格式统一', 1),
('winningPrice', 'procurement', 'number', 'number_format', '{"remove_chars": ["¥", "$", "元", ",", " "], "decimal_places": 2}', '中标价格式统一', 1);

-- 插入系统配置
INSERT INTO systemConfigs (configKey, configValue, configType, description, isSystem) VALUES
('app.version', '1.0.0', 'string', '应用版本', 1),
('db.version', '2', 'number', '数据库版本', 1),
('import.batchSize', '1000', 'number', '导入批次大小', 0),
('export.maxRows', '10000', 'number', '导出最大行数', 0),
('cleaning.enabled', 'true', 'boolean', '是否启用数据清洗', 0),
('cleaning.logLevel', 'info', 'string', '清洗日志级别', 0);
```

## 六、查询优化

### 6.1 常用查询索引
```sql
-- 合同查询优化（复合索引）
CREATE INDEX idx_contracts_composite ON contracts(projectId, isVerified, createdAt);
CREATE INDEX idx_contracts_amount_range ON contracts(contractAmount, signDate);
CREATE INDEX idx_contracts_party_search ON contracts(partyA, partyB);

-- 采购查询优化（复合索引）
CREATE INDEX idx_procurements_composite ON procurements(projectId, isVerified, createdAt);
CREATE INDEX idx_procurements_amount_range ON procurements(budgetAmount, winningPrice);
CREATE INDEX idx_procurements_date_range ON procurements(planCompleteDate, bidOpeningDate);

-- 项目关联查询优化
CREATE INDEX idx_projects_search ON projects(projectName, projectCode);

-- 字段配置查询优化
CREATE INDEX idx_fieldConfigs_composite ON fieldConfigs(fieldType, fieldCategory, displayOrder);
```

### 6.2 性能监控视图
```sql
-- 项目统计视图
CREATE VIEW project_stats AS
SELECT
  p.id,
  p.projectCode,
  p.projectName,
  COUNT(c.id) as contractCount,
  COUNT(pr.id) as procurementCount,
  COALESCE(SUM(c.contractAmount), 0) as totalContractAmount,
  COALESCE(SUM(pr.winningPrice), 0) as totalProcurementAmount,
  MAX(c.createdAt) as lastContractDate,
  MAX(pr.createdAt) as lastProcurementDate
FROM projects p
LEFT JOIN contracts c ON p.id = c.projectId AND c.isVerified = 1
LEFT JOIN procurements pr ON p.id = pr.projectId AND pr.isVerified = 1
GROUP BY p.id;

-- 数据清洗统计视图
CREATE VIEW cleaning_stats AS
SELECT
  fieldName,
  fieldType,
  cleaningType,
  COUNT(*) as ruleCount,
  SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeRuleCount
FROM dataCleaningRules
GROUP BY fieldName, fieldType, cleaningType;
```

## 七、备份与恢复

### 7.1 备份策略
- **自动备份**: 每日凌晨2点自动备份
- **手动备份**: 重要操作前手动备份
- **备份保留**: 保留最近7天的备份文件
- **备份验证**: 备份完成后验证文件完整性

### 7.2 恢复流程
1. 停止应用程序
2. 备份当前数据库
3. 恢复指定备份文件
4. 验证数据完整性
5. 重启应用程序

## 八、混合模式设计总结

### 8.1 设计优势
1. **查询性能优化**: 核心字段固定化，支持高效索引和查询
2. **灵活性保持**: 扩展字段JSON存储，支持动态字段管理
3. **数据清洗机制**: 统一的数据清洗规则，确保数据质量
4. **存储优化**: 避免冗余存储，融合文件信息到业务表
5. **维护简化**: 减少表数量，简化数据关系

### 8.2 核心字段说明
- **合同表**: 12个核心字段，涵盖合同管理的主要业务需求
- **采购表**: 22个核心字段，涵盖采购流程的完整信息
- **扩展字段**: 通过JSON存储，支持未来业务扩展

### 8.3 数据清洗保障
- **日期统一**: 多格式识别，统一YYYY-MM-DD格式
- **金额规范**: 移除符号，统一数值格式
- **文本清理**: 处理空字符、跨行符号等异常情况
