/**
 * 告警模块 Mock 数据
 */

import type {
  AlertRule,
  AlertRecord,
  NotificationChannel,
  AlertStatistics,
  AlertSeverity,
  AlertStatus,
  AlertMetricType,
} from '@/types';

// ==================== Mock 告警规则 ====================

export const mockAlertRules: AlertRule[] = [
  {
    id: 'rule-001',
    name: 'CPU 使用率过高',
    description: '当节点 CPU 使用率超过 80% 持续 5 分钟时触发告警',
    enabled: true,
    metric: 'node_cpu',
    operator: 'gt',
    threshold: 80,
    duration: 300,
    severity: 'warning',
    targets: [],
    notificationChannels: ['channel-001', 'channel-002'],
    cooldown: 600,
    createdAt: Date.now() - 7 * 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'rule-002',
    name: 'JVM 堆内存告警',
    description: '当 JVM 堆内存使用率超过 85% 时触发告警',
    enabled: true,
    metric: 'node_heap',
    operator: 'gt',
    threshold: 85,
    duration: 180,
    severity: 'critical',
    targets: [],
    notificationChannels: ['channel-001', 'channel-002', 'channel-003'],
    cooldown: 300,
    createdAt: Date.now() - 7 * 86400000,
    updatedAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'rule-003',
    name: '磁盘空间不足',
    description: '当磁盘使用率超过 85% 时触发告警',
    enabled: true,
    metric: 'node_disk',
    operator: 'gt',
    threshold: 85,
    duration: 60,
    severity: 'critical',
    targets: [],
    notificationChannels: ['channel-001'],
    cooldown: 1800,
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'rule-004',
    name: '集群健康状态异常',
    description: '当集群状态变为 yellow 或 red 时触发告警',
    enabled: true,
    metric: 'cluster_health',
    operator: 'neq',
    threshold: 0, // 0 表示 green
    duration: 60,
    severity: 'critical',
    targets: [],
    notificationChannels: ['channel-001', 'channel-002', 'channel-003'],
    cooldown: 300,
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now() - 10 * 86400000,
  },
  {
    id: 'rule-005',
    name: '未分配分片告警',
    description: '当存在未分配分片时触发告警',
    enabled: true,
    metric: 'unassigned_shards',
    operator: 'gt',
    threshold: 0,
    duration: 120,
    severity: 'warning',
    targets: [],
    notificationChannels: ['channel-001'],
    cooldown: 600,
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'rule-006',
    name: '搜索延迟过高',
    description: '当平均搜索延迟超过 500ms 时触发告警',
    enabled: true,
    metric: 'search_latency',
    operator: 'gt',
    threshold: 500,
    duration: 300,
    severity: 'warning',
    targets: [],
    notificationChannels: ['channel-002'],
    cooldown: 600,
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'rule-007',
    name: '线程池拒绝告警',
    description: '当线程池拒绝数大于 0 时触发告警',
    enabled: false,
    metric: 'thread_pool_rejected',
    operator: 'gt',
    threshold: 0,
    duration: 60,
    severity: 'warning',
    targets: [],
    notificationChannels: ['channel-001'],
    cooldown: 300,
    createdAt: Date.now() - 1 * 86400000,
    updatedAt: Date.now() - 1 * 86400000,
  },
];

// ==================== Mock 告警记录 ====================

export const mockAlertRecords: AlertRecord[] = [
  {
    id: 'alert-001',
    ruleId: 'rule-002',
    ruleName: 'JVM 堆内存告警',
    metric: 'node_heap',
    severity: 'critical',
    status: 'firing',
    message: '节点 es-node-01 JVM 堆内存使用率达到 89%，超过阈值 85%',
    value: 89,
    threshold: 85,
    target: 'es-node-01',
    firedAt: Date.now() - 1800000,
    notificationsSent: [
      { channelId: 'channel-001', channelType: 'email', sentAt: Date.now() - 1795000, success: true },
      { channelId: 'channel-002', channelType: 'dingtalk', sentAt: Date.now() - 1794000, success: true },
    ],
  },
  {
    id: 'alert-002',
    ruleId: 'rule-001',
    ruleName: 'CPU 使用率过高',
    metric: 'node_cpu',
    severity: 'warning',
    status: 'resolved',
    message: '节点 es-node-02 CPU 使用率达到 82%，超过阈值 80%',
    value: 82,
    threshold: 80,
    target: 'es-node-02',
    firedAt: Date.now() - 7200000,
    resolvedAt: Date.now() - 3600000,
    notificationsSent: [
      { channelId: 'channel-001', channelType: 'email', sentAt: Date.now() - 7195000, success: true },
    ],
  },
  {
    id: 'alert-003',
    ruleId: 'rule-006',
    ruleName: '搜索延迟过高',
    metric: 'search_latency',
    severity: 'warning',
    status: 'acknowledged',
    message: '集群平均搜索延迟达到 650ms，超过阈值 500ms',
    value: 650,
    threshold: 500,
    firedAt: Date.now() - 14400000,
    acknowledgedAt: Date.now() - 10800000,
    acknowledgedBy: 'admin',
    notificationsSent: [
      { channelId: 'channel-002', channelType: 'dingtalk', sentAt: Date.now() - 14395000, success: true },
    ],
  },
  {
    id: 'alert-004',
    ruleId: 'rule-003',
    ruleName: '磁盘空间不足',
    metric: 'node_disk',
    severity: 'critical',
    status: 'resolved',
    message: '节点 es-node-03 磁盘使用率达到 87%，超过阈值 85%',
    value: 87,
    threshold: 85,
    target: 'es-node-03',
    firedAt: Date.now() - 86400000,
    resolvedAt: Date.now() - 72000000,
    notificationsSent: [
      { channelId: 'channel-001', channelType: 'email', sentAt: Date.now() - 86395000, success: true },
    ],
  },
  {
    id: 'alert-005',
    ruleId: 'rule-001',
    ruleName: 'CPU 使用率过高',
    metric: 'node_cpu',
    severity: 'warning',
    status: 'firing',
    message: '节点 es-node-01 CPU 使用率达到 85%，超过阈值 80%',
    value: 85,
    threshold: 80,
    target: 'es-node-01',
    firedAt: Date.now() - 600000,
    notificationsSent: [
      { channelId: 'channel-001', channelType: 'email', sentAt: Date.now() - 595000, success: true },
      { channelId: 'channel-002', channelType: 'dingtalk', sentAt: Date.now() - 594000, success: false, error: '网络超时' },
    ],
  },
];

// ==================== Mock 通知渠道 ====================

export const mockNotificationChannels: NotificationChannel[] = [
  {
    id: 'channel-001',
    name: '运维邮件组',
    type: 'email',
    enabled: true,
    config: {
      type: 'email',
      recipients: ['ops@example.com', 'admin@example.com'],
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      useTls: true,
    },
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 7 * 86400000,
  },
  {
    id: 'channel-002',
    name: '钉钉告警群',
    type: 'dingtalk',
    enabled: true,
    config: {
      type: 'dingtalk',
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
      secret: 'SEC***',
      atAll: false,
    },
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'channel-003',
    name: '站内通知',
    type: 'internal',
    enabled: true,
    config: {
      type: 'internal',
      broadcast: true,
    },
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now() - 15 * 86400000,
  },
  {
    id: 'channel-004',
    name: '监控 Webhook',
    type: 'webhook',
    enabled: false,
    config: {
      type: 'webhook',
      url: 'https://monitor.example.com/api/alerts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now() - 10 * 86400000,
  },
];

// ==================== 生成告警统计 ====================

export function generateAlertStatistics(): AlertStatistics {
  const records = mockAlertRecords;
  
  const bySeverity = {
    critical: records.filter(r => r.severity === 'critical').length,
    warning: records.filter(r => r.severity === 'warning').length,
    info: records.filter(r => r.severity === 'info').length,
  };
  
  const byMetric: Record<AlertMetricType, number> = {
    cluster_health: 0,
    node_cpu: 0,
    node_heap: 0,
    node_disk: 0,
    node_memory: 0,
    index_docs: 0,
    index_size: 0,
    search_latency: 0,
    indexing_latency: 0,
    gc_time: 0,
    thread_pool_rejected: 0,
    circuit_breaker_tripped: 0,
    unassigned_shards: 0,
  };
  
  records.forEach(r => {
    byMetric[r.metric] = (byMetric[r.metric] || 0) + 1;
  });
  
  // 生成最近 24 小时的趋势数据
  const recentTrend = [];
  const now = Date.now();
  for (let i = 23; i >= 0; i--) {
    const timestamp = now - i * 3600000;
    const count = Math.floor(Math.random() * 3);
    recentTrend.push({ timestamp, count });
  }
  
  return {
    total: records.length,
    firing: records.filter(r => r.status === 'firing').length,
    resolved: records.filter(r => r.status === 'resolved').length,
    acknowledged: records.filter(r => r.status === 'acknowledged').length,
    bySeverity,
    byMetric,
    recentTrend,
  };
}

// ==================== 指标名称映射 ====================

export const ALERT_METRIC_NAMES: Record<AlertMetricType, string> = {
  cluster_health: '集群健康状态',
  node_cpu: 'CPU 使用率',
  node_heap: 'JVM 堆内存',
  node_disk: '磁盘使用率',
  node_memory: '系统内存',
  index_docs: '索引文档数',
  index_size: '索引大小',
  search_latency: '搜索延迟',
  indexing_latency: '索引延迟',
  gc_time: 'GC 时间',
  thread_pool_rejected: '线程池拒绝',
  circuit_breaker_tripped: '断路器触发',
  unassigned_shards: '未分配分片',
};

export const ALERT_OPERATOR_NAMES: Record<string, string> = {
  gt: '大于',
  gte: '大于等于',
  lt: '小于',
  lte: '小于等于',
  eq: '等于',
  neq: '不等于',
};

export const ALERT_SEVERITY_NAMES: Record<AlertSeverity, string> = {
  critical: '严重',
  warning: '警告',
  info: '信息',
};

export const ALERT_STATUS_NAMES: Record<AlertStatus, string> = {
  firing: '触发中',
  resolved: '已恢复',
  acknowledged: '已确认',
};

export const NOTIFICATION_CHANNEL_TYPE_NAMES: Record<string, string> = {
  email: '邮件',
  dingtalk: '钉钉',
  webhook: 'Webhook',
  sms: '短信',
  internal: '站内信',
};
