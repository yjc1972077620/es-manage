/**
 * Kibana 监控 API 服务
 * 对接后端 es-manage-service
 */

import axios, { AxiosResponse, AxiosError } from 'axios';
import type {
  KibanaClusterOverview,
  KibanaClusterStatus,
  KibanaNodesResponse,
  KibanaNodeDetail,
  KibanaIndicesResponse,
  KibanaNodeInfo,
  KibanaIndexInfo,
  KibanaTimeSeriesData,
} from '@/types/kibana';

// 重新导出类型供页面使用
export type {
  KibanaClusterOverview,
  KibanaClusterStatus,
  KibanaNodesResponse,
  KibanaNodeDetail,
  KibanaIndicesResponse,
  KibanaNodeInfo,
  KibanaIndexInfo,
  KibanaTimeSeriesData,
} from '@/types/kibana';

// 后端服务地址
const API_BASE_URL = 'http://localhost:8080/api/monitor';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    console.error('API Error:', error);
    throw error;
  }
);

// ==================== 监控概览类型 ====================

/** 监控概览响应 */
export interface MonitoringOverviewResponse {
  cluster: {
    name: string;
    uuid: string;
    status: string;
    version: string;
    upTime: number;
  };
  nodes: {
    total: number;
    successful: number;
    data: number;
    master: number;
  };
  indices: {
    total: number;
    docs: number;
    storeSizeBytes: number;
  };
  shards: {
    total: number;
    primaries: number;
    unassigned: number;
    relocating: number;
    initializing: number;
  };
  jvm: {
    heapUsedPercent: number;
    heapUsedBytes: number;
    heapMaxBytes: number;
  };
  os: {
    cpuPercent: number;
    memUsedPercent: number;
  };
  fs: {
    totalBytes: number;
    availableBytes: number;
    usedPercent: number;
  };
  timeSeries: Record<string, TimeSeriesPoint[]>;
}

/** 时序数据点 */
export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

// ==================== API 函数 ====================

/**
 * 获取监控概览（转换后的格式）
 * @param minutes 时间范围（分钟）
 */
export async function fetchMonitoringOverview(minutes: number = 60): Promise<MonitoringOverviewResponse> {
  return apiClient.get('/overview', {
    params: { minutes },
  });
}

/**
 * 获取集群概览（原始 Kibana 格式）
 * @param minutes 时间范围（分钟）
 */
export async function fetchClusterOverview(minutes: number = 60): Promise<KibanaClusterOverview> {
  return apiClient.get('/cluster/overview', {
    params: { minutes },
  });
}

/**
 * 获取集群状态
 */
export async function fetchClusterStatus(): Promise<KibanaClusterStatus> {
  return apiClient.get('/cluster/status');
}

/**
 * 获取节点列表
 * @param minutes 时间范围（分钟）
 * @param page 页码（从0开始）
 * @param pageSize 每页大小
 */
export async function fetchNodes(
  minutes: number = 60,
  page: number = 0,
  pageSize: number = 20
): Promise<KibanaNodesResponse> {
  return apiClient.get('/nodes', {
    params: { minutes, page, pageSize },
  });
}

/**
 * 获取节点详情
 * @param nodeId 节点 ID
 * @param minutes 时间范围（分钟）
 */
export async function fetchNodeDetail(
  nodeId: string,
  minutes: number = 60
): Promise<KibanaNodeDetail> {
  return apiClient.get(`/nodes/${nodeId}`, {
    params: { minutes },
  });
}

/**
 * 获取节点时序数据
 * @param nodeId 节点 ID
 * @param minutes 时间范围（分钟）
 */
export async function fetchNodeTimeSeries(
  nodeId: string,
  minutes: number = 60
): Promise<Record<string, TimeSeriesPoint[]>> {
  return apiClient.get(`/nodes/${nodeId}/timeseries`, {
    params: { minutes },
  });
}

/**
 * 获取索引列表
 * @param minutes 时间范围（分钟）
 * @param page 页码（从0开始）
 * @param pageSize 每页大小
 * @param queryText 搜索文本
 * @param showSystemIndices 是否显示系统索引
 */
export async function fetchIndices(
  minutes: number = 60,
  page: number = 0,
  pageSize: number = 20,
  queryText: string = '',
  showSystemIndices: boolean = false
): Promise<KibanaIndicesResponse> {
  return apiClient.get('/indices', {
    params: { minutes, page, pageSize, queryText, showSystemIndices },
  });
}

/** 索引详情响应 */
export interface IndexDetailResponse {
  indexSummary: {
    name: string;
    status: string;
    primaries: number;
    replicas: number;
    documents: number;
    /** 数据大小 - Kibana 返回的是对象 */
    dataSize: {
      primaries: number;
      total: number;
    };
    unassignedShards: number;
    totalShards: number;
  };
  metrics: Record<string, KibanaTimeSeriesData[]>;
  shards: Array<{
    index: string;
    shard: number;
    node: string;
    primary: boolean;
    relocatingNode: string | null;
    state: string;
  }>;
}

/**
 * 获取索引详情
 * @param indexName 索引名称
 * @param minutes 时间范围（分钟）
 */
export async function fetchIndexDetail(
  indexName: string,
  minutes: number = 60
): Promise<IndexDetailResponse> {
  return apiClient.get(`/indices/${encodeURIComponent(indexName)}`, {
    params: { minutes },
  });
}

/**
 * 获取索引时序数据
 * @param indexName 索引名称
 * @param minutes 时间范围（分钟）
 */
export async function fetchIndexTimeSeries(
  indexName: string,
  minutes: number = 60
): Promise<Record<string, TimeSeriesPoint[]>> {
  return apiClient.get(`/indices/${encodeURIComponent(indexName)}/timeseries`, {
    params: { minutes },
  });
}

// ==================== 数据转换工具函数 ====================

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化运行时间
 */
export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天 ${hours % 24}小时`;
  }
  if (hours > 0) {
    return `${hours}小时 ${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟`;
  }
  return `${seconds}秒`;
}

/**
 * 格式化数字
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toString();
}

/**
 * 将 Kibana 时序数据转换为图表数据
 */
export function convertTimeSeriesData(
  data: [number, number | null][]
): { timestamp: number; value: number }[] {
  return data
    .filter(([, value]) => value !== null)
    .map(([timestamp, value]) => ({
      timestamp,
      value: value as number,
    }));
}
