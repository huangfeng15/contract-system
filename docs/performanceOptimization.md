# 性能优化指南

## 一、性能优化策略

### 1.1 优化目标
- **应用启动时间**: ≤ 3秒
- **页面切换响应**: ≤ 200ms
- **数据加载时间**: ≤ 1秒
- **Excel解析速度**: ≥ 1000行/秒
- **内存使用**: ≤ 500MB（正常使用）
- **数据库查询**: ≤ 100ms（常用查询）

### 1.2 性能监控指标
```typescript
interface IPerformanceMetrics {
  appStartTime: number;        // 应用启动时间
  pageLoadTime: number;        // 页面加载时间
  apiResponseTime: number;     // API响应时间
  memoryUsage: number;         // 内存使用量
  cpuUsage: number;           // CPU使用率
  databaseQueryTime: number;   // 数据库查询时间
  fileProcessingTime: number;  // 文件处理时间
}
```

## 二、前端性能优化

### 2.1 Vue组件优化
```typescript
// 使用 defineAsyncComponent 进行组件懒加载
const ContractDetailDialog = defineAsyncComponent(
  () => import('@/components/contract/ContractDetailDialog.vue')
);

// 使用 shallowRef 优化大数据渲染
const contractList = shallowRef<IContract[]>([]);

// 使用 computed 缓存计算结果
const filteredContracts = computed(() => {
  if (!searchKeyword.value) return contractList.value;
  return contractList.value.filter(contract => 
    contract.contractNumber?.includes(searchKeyword.value)
  );
});

// 使用 watchEffect 优化副作用
watchEffect(() => {
  if (currentPage.value > 1 && filteredContracts.value.length === 0) {
    currentPage.value = 1;
  }
});
```

### 2.2 虚拟滚动优化
```typescript
// src/renderer/components/common/VirtualTable.vue
<template>
  <div class="virtual-table" ref="containerRef">
    <div 
      class="virtual-list" 
      :style="{ height: `${totalHeight}px` }"
    >
      <div 
        class="virtual-item"
        v-for="item in visibleItems"
        :key="item.id"
        :style="{ 
          transform: `translateY(${item.top}px)`,
          height: `${itemHeight}px`
        }"
      >
        <slot :item="item.data" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
}>();

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);

const visibleItems = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const end = Math.min(
    start + Math.ceil(props.containerHeight / props.itemHeight) + 1,
    props.items.length
  );
  
  return props.items.slice(start, end).map((item, index) => ({
    id: item.id,
    data: item,
    top: (start + index) * props.itemHeight
  }));
});

const totalHeight = computed(() => props.items.length * props.itemHeight);
</script>
```

### 2.3 数据分页优化
```typescript
// src/renderer/composables/usePagination.ts
export function usePagination<T>(
  fetchFn: (params: IPaginationParams) => Promise<IPaginatedResponse<T>>,
  options: IPaginationOptions = {}
) {
  const {
    pageSize = 20,
    enableCache = true,
    cacheTimeout = 5 * 60 * 1000 // 5分钟
  } = options;
  
  const currentPage = ref(1);
  const total = ref(0);
  const items = ref<T[]>([]);
  const loading = ref(false);
  const cache = new Map<string, ICacheItem<T>>();
  
  const loadData = async (page: number = currentPage.value) => {
    const cacheKey = `page_${page}_${pageSize}`;
    
    // 检查缓存
    if (enableCache && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cacheTimeout) {
        items.value = cached.data.items;
        total.value = cached.data.total;
        return;
      }
    }
    
    loading.value = true;
    try {
      const response = await fetchFn({ page, pageSize });
      items.value = response.items;
      total.value = response.total;
      currentPage.value = page;
      
      // 更新缓存
      if (enableCache) {
        cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }
    } finally {
      loading.value = false;
    }
  };
  
  return {
    currentPage,
    total,
    items,
    loading,
    loadData,
    clearCache: () => cache.clear()
  };
}
```

## 三、后端性能优化

### 3.1 数据库查询优化
```typescript
// src/main/services/contractService.ts
export class ContractService {
  // 使用索引优化查询
  async getContractList(params: IContractListParams): Promise<IPaginatedResponse<IContract>> {
    const { page = 1, pageSize = 20, keyword, projectId } = params;
    const offset = (page - 1) * pageSize;
    
    // 构建优化的查询
    let query = `
      SELECT 
        c.*,
        p.projectName,
        w.fileName
      FROM contracts c
      LEFT JOIN projects p ON c.projectId = p.id
      LEFT JOIN worksheets w ON c.worksheetId = w.id
    `;
    
    const conditions: string[] = [];
    const values: any[] = [];
    
    if (keyword) {
      conditions.push(`(
        c.contractNumber LIKE ? OR 
        json_extract(c.data, '$.contractName') LIKE ? OR
        p.projectName LIKE ?
      )`);
      const searchTerm = `%${keyword}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (projectId) {
      conditions.push('c.projectId = ?');
      values.push(projectId);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // 添加排序和分页
    query += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    values.push(pageSize, offset);
    
    const items = await this.db.all(query, values);
    
    // 获取总数（使用相同的WHERE条件）
    let countQuery = 'SELECT COUNT(*) as total FROM contracts c';
    if (projectId) {
      countQuery += ' LEFT JOIN projects p ON c.projectId = p.id';
    }
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await this.db.get(countQuery, values.slice(0, -2));
    
    return {
      items,
      total: countResult.total,
      page,
      pageSize,
      totalPages: Math.ceil(countResult.total / pageSize)
    };
  }
  
  // 批量操作优化
  async batchUpdateProjects(updates: IBatchUpdateRequest[]): Promise<void> {
    const transaction = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE contracts 
        SET projectId = ?, isVerified = ?, updatedAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      for (const update of updates) {
        stmt.run(update.projectId, update.isVerified, update.contractId);
      }
    });
    
    transaction();
  }
}
```

### 3.2 Excel处理优化
```typescript
// src/main/services/excelService.ts
export class ExcelService {
  // 流式处理大文件
  async parseExcelStream(filePath: string, options: IParseOptions): Promise<IParseResult> {
    const workbook = XLSX.readFile(filePath, { 
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    const results: IParseResult[] = [];
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // 分批处理数据
      const batchSize = 1000;
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      for (let startRow = range.s.r + 1; startRow <= range.e.r; startRow += batchSize) {
        const endRow = Math.min(startRow + batchSize - 1, range.e.r);
        
        const batchData = this.processBatch(worksheet, startRow, endRow, range.e.c);
        
        // 异步处理批次数据
        await this.processBatchAsync(batchData, sheetName);
        
        // 释放内存
        if (global.gc) {
          global.gc();
        }
      }
    }
    
    return results;
  }
  
  private async processBatchAsync(data: any[], sheetName: string): Promise<void> {
    return new Promise((resolve) => {
      setImmediate(() => {
        // 处理数据
        this.processData(data, sheetName);
        resolve();
      });
    });
  }
}
```

### 3.3 内存管理优化
```typescript
// src/main/utils/memoryManager.ts
export class MemoryManager {
  private static readonly MAX_MEMORY_USAGE = 500 * 1024 * 1024; // 500MB
  private static readonly GC_THRESHOLD = 0.8; // 80%
  
  public static monitorMemory(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      const usagePercent = usage.heapUsed / this.MAX_MEMORY_USAGE;
      
      if (usagePercent > this.GC_THRESHOLD) {
        logger.warn('High memory usage detected', {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          usagePercent: usagePercent * 100
        });
        
        // 强制垃圾回收
        if (global.gc) {
          global.gc();
        }
      }
    }, 30000); // 每30秒检查一次
  }
  
  public static clearCache(): void {
    // 清理各种缓存
    if (global.gc) {
      global.gc();
    }
  }
}
```

## 四、数据库性能优化

### 4.1 索引策略
```sql
-- 合同查询优化索引
CREATE INDEX idx_contracts_search ON contracts(contractNumber, projectId, createdAt);
CREATE INDEX idx_contracts_project_verified ON contracts(projectId, isVerified);
CREATE INDEX idx_contracts_worksheet ON contracts(worksheetId);

-- 项目查询优化索引
CREATE INDEX idx_projects_search ON projects(projectName, projectCode);
CREATE INDEX idx_projects_status_created ON projects(status, createdAt);

-- JSON字段索引（SQLite 3.38+）
CREATE INDEX idx_contracts_data_name ON contracts(json_extract(data, '$.contractName'));
CREATE INDEX idx_contracts_data_amount ON contracts(json_extract(data, '$.amount'));
```

### 4.2 查询优化
```typescript
// 使用预编译语句
export class DatabaseOptimizer {
  private preparedStatements = new Map<string, any>();
  
  public prepareStatement(key: string, sql: string): void {
    this.preparedStatements.set(key, this.db.prepare(sql));
  }
  
  public executeStatement(key: string, params: any[]): any {
    const stmt = this.preparedStatements.get(key);
    if (!stmt) {
      throw new Error(`Prepared statement not found: ${key}`);
    }
    return stmt.all(...params);
  }
  
  // 初始化常用查询
  public initializeStatements(): void {
    this.prepareStatement('getContractsByProject', `
      SELECT * FROM contracts WHERE projectId = ? ORDER BY createdAt DESC LIMIT ?
    `);
    
    this.prepareStatement('searchContracts', `
      SELECT * FROM contracts 
      WHERE contractNumber LIKE ? OR json_extract(data, '$.contractName') LIKE ?
      ORDER BY createdAt DESC LIMIT ? OFFSET ?
    `);
  }
}
```

## 五、缓存策略

### 5.1 多级缓存
```typescript
// src/renderer/utils/cacheManager.ts
export class CacheManager {
  private memoryCache = new Map<string, ICacheItem>();
  private readonly maxMemoryItems = 1000;
  private readonly defaultTTL = 5 * 60 * 1000; // 5分钟
  
  // 内存缓存
  public set(key: string, value: any, ttl: number = this.defaultTTL): void {
    // 清理过期项
    this.cleanup();
    
    // 限制缓存大小
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttl,
      accessCount: 0
    });
  }
  
  public get(key: string): any {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    
    item.accessCount++;
    return item.value;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }
}
```

### 5.2 智能预加载
```typescript
// src/renderer/composables/usePreloader.ts
export function usePreloader() {
  const preloadQueue = ref<string[]>([]);
  const preloadedData = new Map<string, any>();
  
  const preloadData = async (keys: string[]): Promise<void> => {
    const unloadedKeys = keys.filter(key => !preloadedData.has(key));
    
    if (unloadedKeys.length === 0) return;
    
    // 批量预加载
    const promises = unloadedKeys.map(async (key) => {
      try {
        const data = await fetchData(key);
        preloadedData.set(key, data);
      } catch (error) {
        console.warn(`Preload failed for ${key}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  };
  
  return {
    preloadData,
    getPreloadedData: (key: string) => preloadedData.get(key),
    clearPreloadedData: () => preloadedData.clear()
  };
}
```

## 六、性能监控

### 6.1 性能指标收集
```typescript
// src/main/utils/performanceMonitor.ts
export class PerformanceMonitor {
  private metrics: IPerformanceMetrics[] = [];
  
  public startTiming(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        memoryUsage: process.memoryUsage().heapUsed
      });
    };
  }
  
  public recordMetric(metric: IPerformanceMetric): void {
    this.metrics.push(metric);
    
    // 保持最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
    
    // 检查性能阈值
    this.checkThresholds(metric);
  }
  
  private checkThresholds(metric: IPerformanceMetric): void {
    const thresholds = {
      'database.query': 100,
      'excel.parse': 5000,
      'api.response': 1000
    };
    
    const threshold = thresholds[metric.operation];
    if (threshold && metric.duration > threshold) {
      logger.warn('Performance threshold exceeded', {
        operation: metric.operation,
        duration: metric.duration,
        threshold
      });
    }
  }
}
```

### 6.2 性能报告
```typescript
// 生成性能报告
export function generatePerformanceReport(): IPerformanceReport {
  const metrics = PerformanceMonitor.getMetrics();
  
  return {
    timestamp: Date.now(),
    summary: {
      totalOperations: metrics.length,
      averageResponseTime: calculateAverage(metrics.map(m => m.duration)),
      slowestOperations: metrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      memoryTrend: calculateMemoryTrend(metrics)
    },
    recommendations: generateRecommendations(metrics)
  };
}
```
