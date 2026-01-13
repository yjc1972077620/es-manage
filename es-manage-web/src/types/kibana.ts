/**
 * Kibana Monitoring API 数据类型定义
 * 对应后端 es-manage-service 返回的数据结构
 */

// ==================== 集群状态 ====================

/** 集群状态 - 对应 ClusterStatusDTO */
export interface KibanaClusterStatus {
  /** 集群健康状态: green/yellow/red */
  status: 'green' | 'yellow' | 'red';
  /** 索引总数 */
  indicesCount: number;
  /** 文档总数 */
  documentCount: number;
  /** 数据大小（字节） */
  dataSize: number;
  /** 节点总数 */
  nodesCount: number;
  /** 集群运行时间（毫秒） */
  upTime: number;
  /** ES 版本列表 */
  version: string[];
  /** 已用内存（字节） */
  memUsed: number;
  /** 最大内存（字节） */
  memMax: number;
  /** 未分配分片数 */
  unassignedShards: number;
  /** 总分片数 */
  totalShards: number;
}

// ==================== 指标相关 ====================

/** 指标摘要 - 对应 MetricSummaryDTO */
export interface KibanaMetricSummary {
  /** 最小值 */
  minVal: number;
  /** 最大值 */
  maxVal: number;
  /** 最新值 */
  lastVal: number;
  /** 趋势: 1=上升, -1=下降, 0=持平 */
  slope: number;
}

/** 指标元信息 - 对应 MetricInfoDTO */
export interface KibanaMetricInfo {
  /** 应用名称 */
  app: string;
  /** 字段路径 */
  field: string;
  /** 聚合方式 */
  metricAgg: string;
  /** 标签名称 */
  label: string;
  /** 图表标题 */
  title?: string;
  /** 描述 */
  description: string;
  /** 单位 */
  units: string;
  /** 格式化模式 */
  format: string;
  /** 是否有计算 */
  hasCalculation: boolean;
  /** 是否是导数 */
  isDerivative: boolean;
}

/** 节点指标 - 对应 NodeMetricDTO */
export interface KibanaNodeMetric {
  /** 指标元信息 */
  metric: KibanaMetricInfo;
  /** 指标摘要 */
  summary: KibanaMetricSummary;
}

// ==================== 时序数据 ====================

/** 时间范围 */
export interface KibanaTimeRange {
  /** 开始时间戳（毫秒） */
  min: number;
  /** 结束时间戳（毫秒） */
  max: number;
}

/** 时序数据 - 对应 TimeSeriesDataDTO */
export interface KibanaTimeSeriesData {
  /** 时间桶大小 */
  bucket_size: string;
  /** 时间范围 */
  timeRange: KibanaTimeRange;
  /** 指标元信息 */
  metric: KibanaMetricInfo;
  /** 数据点列表: [[timestamp, value], ...] */
  data: [number, number | null][];
}

// ==================== 节点相关 ====================

/** 节点信息 - 对应 NodeInfoDTO */
export interface KibanaNodeInfo {
  /** 节点名称 */
  name: string;
  /** 节点 UUID */
  uuid: string;
  /** 是否在线 */
  isOnline: boolean;
  /** 分片数量 */
  shardCount: number;
  /** 传输地址 */
  transport_address: string;
  /** 节点类型: master/node */
  type: string;
  /** 节点类型标签（中文） */
  nodeTypeLabel: string;
  /** 节点类型图标类名 */
  nodeTypeClass: string;
  /** 节点角色列表 */
  roles: string[];
  /** 解析器标识 */
  resolver: string;
  /** Cgroup CPU 限制 */
  node_cgroup_throttled?: KibanaNodeMetric;
  /** CPU 使用率 */
  node_cpu_utilization?: KibanaNodeMetric;
  /** 系统负载（1分钟） */
  node_load_average?: KibanaNodeMetric;
  /** JVM 堆内存使用率 */
  node_jvm_mem_percent?: KibanaNodeMetric;
  /** 磁盘可用空间 */
  node_free_space?: KibanaNodeMetric;
}

/** 节点列表响应 - 对应 NodesResponseDTO */
export interface KibanaNodesResponse {
  /** 集群状态 */
  clusterStatus: KibanaClusterStatus;
  /** 节点列表 */
  nodes: KibanaNodeInfo[];
  /** 节点总数 */
  totalNodeCount: number;
}

/** 节点摘要 - 对应 NodeSummaryDTO */
export interface KibanaNodeSummary {
  /** 解析器标识 */
  resolver: string;
  /** 节点 ID 列表 */
  node_ids: string[];
  /** 传输地址 */
  transport_address: string;
  /** 节点名称 */
  name: string;
  /** 节点类型: master/node */
  type: string;
  /** 节点类型标签（中文） */
  nodeTypeLabel: string;
  /** 节点类型图标类名 */
  nodeTypeClass: string;
  /** 总分片数 */
  totalShards: number;
  /** 索引数量 */
  indexCount: number;
  /** 文档数量 */
  documents: number;
  /** 数据大小（字节） */
  dataSize: number;
  /** 可用磁盘空间（字节） */
  freeSpace: number;
  /** 总磁盘空间（字节） */
  totalSpace: number;
  /** 已用堆内存百分比 */
  usedHeap: number;
  /** 状态描述 */
  status: string;
  /** 是否在线 */
  isOnline: boolean;
}

/** 节点详情 - 对应 NodeDetailDTO */
export interface KibanaNodeDetail {
  /** 节点摘要信息 */
  nodeSummary: KibanaNodeSummary;
  /** 指标时序数据 */
  metrics: Record<string, KibanaTimeSeriesData[]>;
}

// ==================== 索引相关 ====================

/** 索引信息 - 对应 IndexInfoDTO */
export interface KibanaIndexInfo {
  /** 索引名称 */
  name: string;
  /** 健康状态: green/yellow/red */
  status: 'green' | 'yellow' | 'red';
  /** 文档数量 */
  doc_count: number;
  /** 数据大小（字节） */
  data_size: number;
  /** 索引速率（文档/秒） */
  index_rate: number;
  /** 搜索速率（查询/秒） */
  search_rate: number;
  /** 未分配分片数 */
  unassigned_shards: number;
  /** 状态排序值 */
  status_sort: number;
}

/** 索引列表响应 - 对应 IndicesResponseDTO */
export interface KibanaIndicesResponse {
  /** 集群状态 */
  clusterStatus: KibanaClusterStatus;
  /** 索引列表 */
  indices: KibanaIndexInfo[];
}

// ==================== 集群概览 ====================

/** 集群概览指标 */
export interface KibanaClusterMetrics {
  /** 集群搜索请求速率 */
  cluster_search_request_rate?: KibanaTimeSeriesData[];
  /** 集群查询延迟 */
  cluster_query_latency?: KibanaTimeSeriesData[];
  /** 集群索引请求速率 */
  cluster_index_request_rate?: KibanaTimeSeriesData[];
  /** 集群索引延迟 */
  cluster_index_latency?: KibanaTimeSeriesData[];
}

/** 集群概览 - 对应 ClusterOverviewDTO */
export interface KibanaClusterOverview {
  /** 集群状态 */
  clusterStatus: KibanaClusterStatus;
  /** 指标时序数据 */
  metrics: KibanaClusterMetrics;
  /** 日志信息 */
  logs: {
    enabled: boolean;
    logs: unknown[];
    reason: Record<string, unknown>;
    limit: number;
  };
  /** 分片活动 */
  shardActivity: unknown[];
}
