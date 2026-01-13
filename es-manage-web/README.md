# ES Monitor Web (Kiro)

Elasticsearch 监控平台 - 类似 Kibana 监控界面的 1:1 还原项目

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Ant Design 6
- React Router 7
- Recharts (图表)
- Lucide React (图标)
- Day.js (日期处理)

## 功能特性

### 监控功能
- **监控概览**: 集群整体健康状态、关键指标、资源使用趋势图
- **集群信息**: 集群详细统计、节点分布、分片状态、资源使用、性能趋势
- **节点管理**: 节点列表、节点详情页（CPU/内存/磁盘/JVM/线程池/断路器监控）
- **索引列表**: 索引列表、统计信息、健康状态筛选

### 管理功能
- **索引管理**: 创建索引、别名管理、Ingest 管道、索引模板

### 开发工具
- **控制台**: 类似 Kibana Dev Tools，执行 ES REST API 请求
- **分析器**: 测试分词器和分析器效果

### 通用功能
- **时间范围选择器**: 统一控制所有图表的时间范围（15分钟~7天）
- **自定义时间范围**: 支持精确到秒的自定义时间选择
- **自动刷新**: 可配置的自动刷新间隔

## 数据结构

基于 Elasticsearch 9.0 和 Metricbeat 的实际数据结构定义，包括：

- `ClusterHealth` - 集群健康状态
- `ClusterStats` - 集群统计信息
- `NodeStats` - 节点统计信息
- `IndexInfo` / `IndexStats` - 索引信息和统计
- `MetricbeatEvent` - Metricbeat 事件结构

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 目录结构

```
src/
├── components/       # 通用组件
│   ├── MetricChart.tsx      # 指标图表
│   ├── StatsCard.tsx        # 统计卡片
│   ├── StatusBadge.tsx      # 状态徽章
│   └── TimeRangeSelector.tsx # 时间范围选择器
├── constants/        # 常量配置
├── layouts/          # 布局组件
├── pages/            # 页面组件
│   ├── Overview/     # 监控概览
│   ├── Cluster/      # 集群信息
│   ├── Nodes/        # 节点列表
│   ├── NodeDetail/   # 节点详情
│   ├── Indices/      # 索引列表
│   ├── IndexDetail/  # 索引详情
│   ├── IndexManage/  # 索引管理
│   ├── DevTools/     # 开发者控制台
│   └── Analyzer/     # 分析器测试
├── services/         # API 服务层
├── types/            # TypeScript 类型定义
└── utils/            # 工具函数
```

## 后续扩展

当前使用 localStorage Mock 数据，后续只需修改 `src/services/api.ts` 中的 API 调用，
替换为实际的 Kibana/Elasticsearch API 即可无缝切换到真实数据。

### 接入真实 ES 集群

1. 修改 `src/services/api.ts` 中的 API 函数
2. 配置 ES 集群地址和认证信息
3. 处理 CORS 跨域问题（可通过代理或 ES 配置解决）

### 示例 API 替换

```typescript
// 原 Mock 实现
export async function fetchClusterHealth(): Promise<ClusterHealth> {
  await simulateDelay();
  return generateClusterHealth();
}

// 替换为真实 API
export async function fetchClusterHealth(): Promise<ClusterHealth> {
  const response = await axios.get(`${ES_BASE_URL}/_cluster/health`);
  return response.data;
}
```
