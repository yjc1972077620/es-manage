/**
 * 常量配置
 */

// 集群状态颜色映射
export const CLUSTER_STATUS_COLORS = {
  green: '#017D73',
  yellow: '#F5A700',
  red: '#BD271E',
} as const;

// 集群状态文本映射
export const CLUSTER_STATUS_TEXT = {
  green: '健康',
  yellow: '警告',
  red: '异常',
} as const;

// 节点角色文本映射
export const NODE_ROLE_TEXT: Record<string, string> = {
  master: '主节点',
  data: '数据节点',
  data_content: '内容数据',
  data_hot: '热数据',
  data_warm: '温数据',
  data_cold: '冷数据',
  data_frozen: '冻结数据',
  ingest: '摄取节点',
  ml: '机器学习',
  remote_cluster_client: '远程集群客户端',
  transform: '转换节点',
  voting_only: '仅投票',
  coordinating_only: '协调节点',
};

// 刷新间隔选项
export const REFRESH_INTERVALS = [
  { label: '关闭', value: 0 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
  { label: '1分钟', value: 60000 },
  { label: '5分钟', value: 300000 },
];

// 时间范围选项
export const TIME_RANGES = [
  { label: '最近15分钟', value: 900000 },
  { label: '最近1小时', value: 3600000 },
  { label: '最近4小时', value: 14400000 },
  { label: '最近12小时', value: 43200000 },
  { label: '最近24小时', value: 86400000 },
  { label: '最近7天', value: 604800000 },
];

// 菜单配置
export const MENU_ITEMS = [
  {
    key: '/',
    label: '监控概览',
    icon: 'LayoutDashboard',
  },
  {
    key: '/cluster',
    label: '集群信息',
    icon: 'Server',
  },
  {
    key: '/nodes',
    label: '节点管理',
    icon: 'HardDrive',
  },
  {
    key: '/indices',
    label: '索引管理',
    icon: 'Database',
  },
];

// 图表颜色
export const CHART_COLORS = {
  primary: '#006BB4',
  success: '#017D73',
  warning: '#F5A700',
  danger: '#BD271E',
  info: '#0077CC',
  gray: '#69707D',
};

// 线程池名称映射
export const THREAD_POOL_NAMES: Record<string, string> = {
  analyze: '分析',
  fetch_shard_started: '分片获取启动',
  fetch_shard_store: '分片存储获取',
  flush: '刷新',
  force_merge: '强制合并',
  generic: '通用',
  get: '获取',
  management: '管理',
  refresh: '刷新',
  search: '搜索',
  search_throttled: '限流搜索',
  snapshot: '快照',
  warmer: '预热',
  write: '写入',
};

// 断路器名称映射
export const BREAKER_NAMES: Record<string, string> = {
  request: '请求断路器',
  fielddata: '字段数据断路器',
  in_flight_requests: '传输中请求断路器',
  parent: '父断路器',
  accounting: '计费断路器',
  model_inference: '模型推理断路器',
};
