/**
 * API 服务层
 * 封装所有与后端的数据交互，当前使用 Mock 数据
 * 后续可以轻松替换为实际的 Kibana/ES API 调用
 */

import {
  generateClusterHealth,
  generateClusterStats,
  generateNodeStats,
  getNodeList,
  generateIndexList,
  generateIndexStats,
  generateIndexSettings,
  generateIndexMapping,
  generateMonitoringOverview,
  generateTimeSeries,
  generateMultipleTimeSeries,
  generateNodeTimeSeries,
  generateIndexTimeSeries,
} from './mockData';
import { getStorageData, setStorageData } from '@/utils/storage';
import type {
  ClusterHealth,
  ClusterStats,
  NodeStats,
  IndexInfo,
  IndexStats,
  IndexSettings,
  IndexMapping,
  MonitoringOverview,
  TimeSeriesDataPoint,
} from '@/types';

// 存储键名
const STORAGE_KEYS = {
  CLUSTER_HEALTH: 'cluster_health',
  CLUSTER_STATS: 'cluster_stats',
  NODE_STATS: 'node_stats',
  INDEX_LIST: 'index_list',
};

// 模拟网络延迟
const simulateDelay = (ms: number = 200) => 
  new Promise(resolve => setTimeout(resolve, ms));

// ==================== 集群 API ====================

/** 获取集群健康状态 */
export async function fetchClusterHealth(): Promise<ClusterHealth> {
  await simulateDelay();
  
  // 尝试从存储获取，如果没有则生成新数据
  let data = getStorageData<ClusterHealth | null>(STORAGE_KEYS.CLUSTER_HEALTH, null);
  if (!data) {
    data = generateClusterHealth();
    setStorageData(STORAGE_KEYS.CLUSTER_HEALTH, data);
  }
  
  return data;
}

/** 获取集群统计信息 */
export async function fetchClusterStats(): Promise<ClusterStats> {
  await simulateDelay();
  
  let data = getStorageData<ClusterStats | null>(STORAGE_KEYS.CLUSTER_STATS, null);
  if (!data) {
    data = generateClusterStats();
    setStorageData(STORAGE_KEYS.CLUSTER_STATS, data);
  }
  
  // 更新时间戳
  data.timestamp = Date.now();
  return data;
}

// ==================== 节点 API ====================

/** 获取所有节点统计信息 */
export async function fetchNodeStats(): Promise<Record<string, NodeStats>> {
  await simulateDelay();
  
  let data = getStorageData<Record<string, NodeStats> | null>(STORAGE_KEYS.NODE_STATS, null);
  if (!data) {
    data = generateNodeStats();
    setStorageData(STORAGE_KEYS.NODE_STATS, data);
  }
  
  return data;
}

/** 获取单个节点统计信息 */
export async function fetchNodeStatsById(nodeId: string): Promise<NodeStats | null> {
  const allNodes = await fetchNodeStats();
  return allNodes[nodeId] || null;
}

/** 获取节点列表（简化版） */
export async function fetchNodeList() {
  await simulateDelay(100);
  return getNodeList();
}

// ==================== 索引 API ====================

/** 获取索引列表 */
export async function fetchIndexList(): Promise<IndexInfo[]> {
  await simulateDelay();
  
  let data = getStorageData<IndexInfo[] | null>(STORAGE_KEYS.INDEX_LIST, null);
  if (!data) {
    data = generateIndexList();
    setStorageData(STORAGE_KEYS.INDEX_LIST, data);
  }
  
  return data;
}

/** 获取索引统计信息 */
export async function fetchIndexStats(indexName: string): Promise<IndexStats> {
  await simulateDelay();
  return generateIndexStats(indexName);
}

/** 获取索引设置 */
export async function fetchIndexSettings(indexName: string): Promise<IndexSettings> {
  await simulateDelay(100);
  return generateIndexSettings(indexName);
}

/** 获取索引映射 */
export async function fetchIndexMapping(indexName: string): Promise<IndexMapping> {
  await simulateDelay(100);
  return generateIndexMapping(indexName);
}

// ==================== 监控 API ====================

/** 获取监控概览数据 */
export async function fetchMonitoringOverview(): Promise<MonitoringOverview> {
  await simulateDelay();
  return generateMonitoringOverview();
}

/** 获取时间序列监控数据 */
export async function fetchTimeSeries(
  metric: string,
  startTime?: number,
  endTime?: number,
  interval?: number
): Promise<TimeSeriesDataPoint[]> {
  await simulateDelay(100);
  return generateTimeSeries(metric, startTime, endTime, interval);
}

/** 获取多个指标的时间序列数据 */
export async function fetchMultipleTimeSeries(
  metrics: string[],
  startTime?: number,
  endTime?: number,
  interval?: number
): Promise<Record<string, TimeSeriesDataPoint[]>> {
  await simulateDelay(150);
  return generateMultipleTimeSeries(metrics, startTime, endTime, interval);
}

/** 获取节点级别的时间序列数据 */
export async function fetchNodeTimeSeries(
  nodeId: string,
  metrics: string[],
  startTime?: number,
  endTime?: number
): Promise<Record<string, TimeSeriesDataPoint[]>> {
  await simulateDelay(150);
  return generateNodeTimeSeries(nodeId, metrics, startTime, endTime);
}

/** 获取索引级别的时间序列数据 */
export async function fetchIndexTimeSeries(
  indexName: string,
  metrics: string[],
  startTime?: number,
  endTime?: number
): Promise<Record<string, TimeSeriesDataPoint[]>> {
  await simulateDelay(150);
  return generateIndexTimeSeries(indexName, metrics, startTime, endTime);
}

// ==================== 刷新数据 ====================

/** 刷新所有数据（重新生成 Mock 数据） */
export function refreshAllData(): void {
  setStorageData(STORAGE_KEYS.CLUSTER_HEALTH, generateClusterHealth());
  setStorageData(STORAGE_KEYS.CLUSTER_STATS, generateClusterStats());
  setStorageData(STORAGE_KEYS.NODE_STATS, generateNodeStats());
  setStorageData(STORAGE_KEYS.INDEX_LIST, generateIndexList());
}


// ==================== 告警 API ====================

import {
  mockAlertRules,
  mockAlertRecords,
  mockNotificationChannels,
  generateAlertStatistics,
} from './alertMockData';
import type {
  AlertRule,
  AlertRecord,
  NotificationChannel,
  AlertStatistics,
} from '@/types';

/** 获取告警规则列表 */
export async function fetchAlertRules(): Promise<AlertRule[]> {
  await simulateDelay();
  return [...mockAlertRules];
}

/** 获取告警记录列表 */
export async function fetchAlertRecords(): Promise<AlertRecord[]> {
  await simulateDelay();
  return [...mockAlertRecords];
}

/** 获取通知渠道列表 */
export async function fetchNotificationChannels(): Promise<NotificationChannel[]> {
  await simulateDelay();
  return [...mockNotificationChannels];
}

/** 获取告警统计 */
export async function fetchAlertStatistics(): Promise<AlertStatistics> {
  await simulateDelay();
  return generateAlertStatistics();
}
