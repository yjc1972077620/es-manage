/**
 * Elasticsearch 9.0 监控数据类型定义
 * 基于 Metricbeat 采集的监控数据结构
 * 参考: https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-module-elasticsearch.html
 */

// ==================== 集群级别类型 ====================

/** 集群健康状态 */
export type ClusterHealthStatus = 'green' | 'yellow' | 'red';

/** 集群健康信息 - 对应 _cluster/health API */
export interface ClusterHealth {
  cluster_name: string;
  status: ClusterHealthStatus;
  timed_out: boolean;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  delayed_unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  task_max_waiting_in_queue_millis: number;
  active_shards_percent_as_number: number;
}

/** 集群统计信息 - 对应 _cluster/stats API */
export interface ClusterStats {
  _nodes: {
    total: number;
    successful: number;
    failed: number;
  };
  cluster_name: string;
  cluster_uuid: string;
  timestamp: number;
  status: ClusterHealthStatus;
  indices: ClusterIndicesStats;
  nodes: ClusterNodesStats;
}


/** 集群索引统计 */
export interface ClusterIndicesStats {
  count: number;
  shards: {
    total: number;
    primaries: number;
    replication: number;
    index: {
      shards: { min: number; max: number; avg: number };
      primaries: { min: number; max: number; avg: number };
      replication: { min: number; max: number; avg: number };
    };
  };
  docs: {
    count: number;
    deleted: number;
  };
  store: {
    size_in_bytes: number;
    total_data_set_size_in_bytes?: number;
    reserved_in_bytes?: number;
  };
  fielddata: {
    memory_size_in_bytes: number;
    evictions: number;
  };
  query_cache: {
    memory_size_in_bytes: number;
    total_count: number;
    hit_count: number;
    miss_count: number;
    cache_size: number;
    cache_count: number;
    evictions: number;
  };
  completion: {
    size_in_bytes: number;
  };
  segments: {
    count: number;
    memory_in_bytes: number;
    terms_memory_in_bytes: number;
    stored_fields_memory_in_bytes: number;
    term_vectors_memory_in_bytes: number;
    norms_memory_in_bytes: number;
    points_memory_in_bytes: number;
    doc_values_memory_in_bytes: number;
    index_writer_memory_in_bytes: number;
    version_map_memory_in_bytes: number;
    fixed_bit_set_memory_in_bytes: number;
    max_unsafe_auto_id_timestamp: number;
    file_sizes: Record<string, { size_in_bytes: number }>;
  };
  mappings: {
    field_types: Array<{
      name: string;
      count: number;
      index_count: number;
    }>;
  };
  analysis: {
    char_filter_types: Array<{ name: string; count: number; index_count: number }>;
    tokenizer_types: Array<{ name: string; count: number; index_count: number }>;
    filter_types: Array<{ name: string; count: number; index_count: number }>;
    analyzer_types: Array<{ name: string; count: number; index_count: number }>;
  };
}


/** 集群节点统计 */
export interface ClusterNodesStats {
  count: {
    total: number;
    coordinating_only: number;
    data: number;
    data_cold: number;
    data_content: number;
    data_frozen: number;
    data_hot: number;
    data_warm: number;
    ingest: number;
    master: number;
    ml: number;
    remote_cluster_client: number;
    transform: number;
    voting_only: number;
  };
  versions: string[];
  os: {
    available_processors: number;
    allocated_processors: number;
    names: Array<{ name: string; count: number }>;
    pretty_names: Array<{ pretty_name: string; count: number }>;
    architectures: Array<{ arch: string; count: number }>;
    mem: {
      total_in_bytes: number;
      adjusted_total_in_bytes: number;
      free_in_bytes: number;
      used_in_bytes: number;
      free_percent: number;
      used_percent: number;
    };
  };
  process: {
    cpu: { percent: number };
    open_file_descriptors: { min: number; max: number; avg: number };
  };
  jvm: {
    max_uptime_in_millis: number;
    versions: Array<{
      version: string;
      vm_name: string;
      vm_version: string;
      vm_vendor: string;
      bundled_jdk: boolean;
      using_bundled_jdk: boolean;
      count: number;
    }>;
    mem: {
      heap_used_in_bytes: number;
      heap_max_in_bytes: number;
    };
    threads: number;
  };
  fs: {
    total_in_bytes: number;
    free_in_bytes: number;
    available_in_bytes: number;
  };
  plugins: Array<{
    name: string;
    version: string;
    elasticsearch_version: string;
    java_version: string;
    description: string;
    classname: string;
    extended_plugins: string[];
    has_native_controller: boolean;
  }>;
  network_types: {
    transport_types: Record<string, number>;
    http_types: Record<string, number>;
  };
  discovery_types: Record<string, number>;
  packaging_types: Array<{ flavor: string; type: string; count: number }>;
  ingest: {
    number_of_pipelines: number;
    processor_stats: Record<string, { count: number; failed: number; current: number; time_in_millis: number }>;
  };
}


// ==================== 节点级别类型 ====================

/** 节点角色类型 */
export type NodeRole = 
  | 'master' 
  | 'data' 
  | 'data_content' 
  | 'data_hot' 
  | 'data_warm' 
  | 'data_cold' 
  | 'data_frozen'
  | 'ingest' 
  | 'ml' 
  | 'remote_cluster_client' 
  | 'transform'
  | 'voting_only'
  | 'coordinating_only';

/** 节点详细信息 - 对应 _nodes/stats API */
export interface NodeStats {
  name: string;
  transport_address: string;
  host: string;
  ip: string;
  version: string;
  build_flavor: string;
  build_type: string;
  build_hash: string;
  roles: NodeRole[];
  attributes: Record<string, string>;
  
  // 操作系统信息
  os: NodeOsStats;
  
  // JVM 信息
  jvm: NodeJvmStats;
  
  // 进程信息
  process: NodeProcessStats;
  
  // 文件系统信息
  fs: NodeFsStats;
  
  // 传输层信息
  transport: NodeTransportStats;
  
  // HTTP 信息
  http: NodeHttpStats;
  
  // 线程池信息
  thread_pool: Record<string, ThreadPoolStats>;
  
  // 断路器信息
  breakers: Record<string, BreakerStats>;
  
  // 索引统计
  indices: NodeIndicesStats;
  
  // Ingest 统计
  ingest: NodeIngestStats;
}

/** 节点操作系统统计 */
export interface NodeOsStats {
  timestamp: number;
  cpu: {
    percent: number;
    load_average: {
      '1m': number;
      '5m': number;
      '15m': number;
    };
  };
  mem: {
    total_in_bytes: number;
    adjusted_total_in_bytes: number;
    free_in_bytes: number;
    used_in_bytes: number;
    free_percent: number;
    used_percent: number;
  };
  swap: {
    total_in_bytes: number;
    free_in_bytes: number;
    used_in_bytes: number;
  };
  cgroup?: {
    cpuacct: {
      control_group: string;
      usage_nanos: number;
    };
    cpu: {
      control_group: string;
      cfs_period_micros: number;
      cfs_quota_micros: number;
      stat: {
        number_of_elapsed_periods: number;
        number_of_times_throttled: number;
        time_throttled_nanos: number;
      };
    };
    memory: {
      control_group: string;
      limit_in_bytes: string;
      usage_in_bytes: string;
    };
  };
}


/** 节点 JVM 统计 */
export interface NodeJvmStats {
  timestamp: number;
  uptime_in_millis: number;
  mem: {
    heap_used_in_bytes: number;
    heap_used_percent: number;
    heap_committed_in_bytes: number;
    heap_max_in_bytes: number;
    non_heap_used_in_bytes: number;
    non_heap_committed_in_bytes: number;
    pools: Record<string, {
      used_in_bytes: number;
      max_in_bytes: number;
      peak_used_in_bytes: number;
      peak_max_in_bytes: number;
      last_gc_stats?: {
        used_in_bytes: number;
        max_in_bytes: number;
        usage_percent: number;
      };
    }>;
  };
  threads: {
    count: number;
    peak_count: number;
  };
  gc: {
    collectors: Record<string, {
      collection_count: number;
      collection_time_in_millis: number;
    }>;
  };
  buffer_pools: Record<string, {
    count: number;
    used_in_bytes: number;
    total_capacity_in_bytes: number;
  }>;
  classes: {
    current_loaded_count: number;
    total_loaded_count: number;
    total_unloaded_count: number;
  };
}

/** 节点进程统计 */
export interface NodeProcessStats {
  timestamp: number;
  open_file_descriptors: number;
  max_file_descriptors: number;
  cpu: {
    percent: number;
    total_in_millis: number;
  };
  mem: {
    total_virtual_in_bytes: number;
  };
}

/** 节点文件系统统计 */
export interface NodeFsStats {
  timestamp: number;
  total: {
    total_in_bytes: number;
    free_in_bytes: number;
    available_in_bytes: number;
  };
  data: Array<{
    path: string;
    mount: string;
    type: string;
    total_in_bytes: number;
    free_in_bytes: number;
    available_in_bytes: number;
  }>;
  io_stats?: {
    devices: Array<{
      device_name: string;
      operations: number;
      read_operations: number;
      write_operations: number;
      read_kilobytes: number;
      write_kilobytes: number;
    }>;
    total: {
      operations: number;
      read_operations: number;
      write_operations: number;
      read_kilobytes: number;
      write_kilobytes: number;
    };
  };
}

/** 节点传输层统计 */
export interface NodeTransportStats {
  server_open: number;
  total_outbound_connections: number;
  rx_count: number;
  rx_size_in_bytes: number;
  tx_count: number;
  tx_size_in_bytes: number;
}

/** 节点 HTTP 统计 */
export interface NodeHttpStats {
  current_open: number;
  total_opened: number;
}

/** 线程池统计 */
export interface ThreadPoolStats {
  threads: number;
  queue: number;
  active: number;
  rejected: number;
  largest: number;
  completed: number;
}

/** 断路器统计 */
export interface BreakerStats {
  limit_size_in_bytes: number;
  limit_size: string;
  estimated_size_in_bytes: number;
  estimated_size: string;
  overhead: number;
  tripped: number;
}


/** 节点索引统计 */
export interface NodeIndicesStats {
  docs: {
    count: number;
    deleted: number;
  };
  store: {
    size_in_bytes: number;
    total_data_set_size_in_bytes?: number;
    reserved_in_bytes?: number;
  };
  indexing: {
    index_total: number;
    index_time_in_millis: number;
    index_current: number;
    index_failed: number;
    delete_total: number;
    delete_time_in_millis: number;
    delete_current: number;
    noop_update_total: number;
    is_throttled: boolean;
    throttle_time_in_millis: number;
  };
  get: {
    total: number;
    time_in_millis: number;
    exists_total: number;
    exists_time_in_millis: number;
    missing_total: number;
    missing_time_in_millis: number;
    current: number;
  };
  search: {
    open_contexts: number;
    query_total: number;
    query_time_in_millis: number;
    query_current: number;
    fetch_total: number;
    fetch_time_in_millis: number;
    fetch_current: number;
    scroll_total: number;
    scroll_time_in_millis: number;
    scroll_current: number;
    suggest_total: number;
    suggest_time_in_millis: number;
    suggest_current: number;
  };
  merges: {
    current: number;
    current_docs: number;
    current_size_in_bytes: number;
    total: number;
    total_time_in_millis: number;
    total_docs: number;
    total_size_in_bytes: number;
    total_stopped_time_in_millis: number;
    total_throttled_time_in_millis: number;
    total_auto_throttle_in_bytes: number;
  };
  refresh: {
    total: number;
    total_time_in_millis: number;
    external_total: number;
    external_total_time_in_millis: number;
    listeners: number;
  };
  flush: {
    total: number;
    periodic: number;
    total_time_in_millis: number;
  };
  warmer: {
    current: number;
    total: number;
    total_time_in_millis: number;
  };
  query_cache: {
    memory_size_in_bytes: number;
    total_count: number;
    hit_count: number;
    miss_count: number;
    cache_size: number;
    cache_count: number;
    evictions: number;
  };
  fielddata: {
    memory_size_in_bytes: number;
    evictions: number;
  };
  completion: {
    size_in_bytes: number;
  };
  segments: {
    count: number;
    memory_in_bytes: number;
    terms_memory_in_bytes: number;
    stored_fields_memory_in_bytes: number;
    term_vectors_memory_in_bytes: number;
    norms_memory_in_bytes: number;
    points_memory_in_bytes: number;
    doc_values_memory_in_bytes: number;
    index_writer_memory_in_bytes: number;
    version_map_memory_in_bytes: number;
    fixed_bit_set_memory_in_bytes: number;
    max_unsafe_auto_id_timestamp: number;
    file_sizes: Record<string, { size_in_bytes: number }>;
  };
  translog: {
    operations: number;
    size_in_bytes: number;
    uncommitted_operations: number;
    uncommitted_size_in_bytes: number;
    earliest_last_modified_age: number;
  };
  request_cache: {
    memory_size_in_bytes: number;
    evictions: number;
    hit_count: number;
    miss_count: number;
  };
  recovery: {
    current_as_source: number;
    current_as_target: number;
    throttle_time_in_millis: number;
  };
}

/** 节点 Ingest 统计 */
export interface NodeIngestStats {
  total: {
    count: number;
    time_in_millis: number;
    current: number;
    failed: number;
  };
  pipelines: Record<string, {
    count: number;
    time_in_millis: number;
    current: number;
    failed: number;
    processors: Array<{
      type: string;
      stats: {
        count: number;
        time_in_millis: number;
        current: number;
        failed: number;
      };
    }>;
  }>;
}


// ==================== 索引级别类型 ====================

/** 索引健康状态 */
export type IndexHealthStatus = 'green' | 'yellow' | 'red';

/** 索引信息 - 对应 _cat/indices API */
export interface IndexInfo {
  health: IndexHealthStatus;
  status: 'open' | 'close';
  index: string;
  uuid: string;
  pri: number;           // 主分片数
  rep: number;           // 副本数
  'docs.count': number;
  'docs.deleted': number;
  'store.size': string;
  'pri.store.size': string;
  // 扩展字段
  creation_date?: number;
  creation_date_string?: string;
}

/** 索引详细统计 - 对应 /{index}/_stats API */
export interface IndexStats {
  _shards: {
    total: number;
    successful: number;
    failed: number;
  };
  _all: {
    primaries: IndexDetailStats;
    total: IndexDetailStats;
  };
  indices: Record<string, {
    uuid: string;
    primaries: IndexDetailStats;
    total: IndexDetailStats;
  }>;
}

/** 索引详细统计数据 */
export interface IndexDetailStats {
  docs: {
    count: number;
    deleted: number;
  };
  store: {
    size_in_bytes: number;
    total_data_set_size_in_bytes?: number;
    reserved_in_bytes?: number;
  };
  indexing: {
    index_total: number;
    index_time_in_millis: number;
    index_current: number;
    index_failed: number;
    delete_total: number;
    delete_time_in_millis: number;
    delete_current: number;
    noop_update_total: number;
    is_throttled: boolean;
    throttle_time_in_millis: number;
  };
  get: {
    total: number;
    time_in_millis: number;
    exists_total: number;
    exists_time_in_millis: number;
    missing_total: number;
    missing_time_in_millis: number;
    current: number;
  };
  search: {
    open_contexts: number;
    query_total: number;
    query_time_in_millis: number;
    query_current: number;
    fetch_total: number;
    fetch_time_in_millis: number;
    fetch_current: number;
    scroll_total: number;
    scroll_time_in_millis: number;
    scroll_current: number;
    suggest_total: number;
    suggest_time_in_millis: number;
    suggest_current: number;
  };
  merges: {
    current: number;
    current_docs: number;
    current_size_in_bytes: number;
    total: number;
    total_time_in_millis: number;
    total_docs: number;
    total_size_in_bytes: number;
  };
  refresh: {
    total: number;
    total_time_in_millis: number;
    external_total: number;
    external_total_time_in_millis: number;
    listeners: number;
  };
  flush: {
    total: number;
    periodic: number;
    total_time_in_millis: number;
  };
  segments: {
    count: number;
    memory_in_bytes: number;
    terms_memory_in_bytes: number;
    stored_fields_memory_in_bytes: number;
    term_vectors_memory_in_bytes: number;
    norms_memory_in_bytes: number;
    points_memory_in_bytes: number;
    doc_values_memory_in_bytes: number;
    index_writer_memory_in_bytes: number;
    version_map_memory_in_bytes: number;
    fixed_bit_set_memory_in_bytes: number;
  };
  translog: {
    operations: number;
    size_in_bytes: number;
    uncommitted_operations: number;
    uncommitted_size_in_bytes: number;
  };
  request_cache: {
    memory_size_in_bytes: number;
    evictions: number;
    hit_count: number;
    miss_count: number;
  };
  query_cache: {
    memory_size_in_bytes: number;
    total_count: number;
    hit_count: number;
    miss_count: number;
    cache_size: number;
    cache_count: number;
    evictions: number;
  };
  fielddata: {
    memory_size_in_bytes: number;
    evictions: number;
  };
  completion: {
    size_in_bytes: number;
  };
}

/** 索引设置 */
export interface IndexSettings {
  index: {
    number_of_shards: string;
    number_of_replicas: string;
    provided_name: string;
    creation_date: string;
    uuid: string;
    version: {
      created: string;
    };
    routing?: {
      allocation?: {
        include?: Record<string, string>;
        exclude?: Record<string, string>;
        require?: Record<string, string>;
      };
    };
    refresh_interval?: string;
    max_result_window?: string;
    analysis?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

/** 索引映射 */
export interface IndexMapping {
  mappings: {
    properties: Record<string, MappingProperty>;
    _source?: {
      enabled: boolean;
    };
    dynamic?: 'true' | 'false' | 'strict';
  };
}

/** 映射属性 */
export interface MappingProperty {
  type?: string;
  properties?: Record<string, MappingProperty>;
  fields?: Record<string, MappingProperty>;
  analyzer?: string;
  search_analyzer?: string;
  format?: string;
  index?: boolean;
  store?: boolean;
  doc_values?: boolean;
  enabled?: boolean;
  null_value?: unknown;
  copy_to?: string | string[];
  [key: string]: unknown;
}


// ==================== Metricbeat 监控数据类型 ====================

/** Metricbeat 事件基础结构 */
export interface MetricbeatEvent<T = unknown> {
  '@timestamp': string;
  '@metadata': {
    beat: string;
    type: string;
    version: string;
  };
  agent: {
    name: string;
    type: string;
    version: string;
    hostname: string;
    id: string;
  };
  ecs: {
    version: string;
  };
  host: {
    name: string;
  };
  metricset: {
    name: string;
    period: number;
  };
  service: {
    type: string;
    address: string;
  };
  event: {
    dataset: string;
    module: string;
    duration: number;
  };
  elasticsearch: T;
}

/** Metricbeat 集群统计数据 */
export interface MetricbeatClusterStats {
  cluster: {
    id: string;
    name: string;
    stats: {
      status: ClusterHealthStatus;
      nodes: {
        count: number;
        master: number;
        data: number;
      };
      indices: {
        total: number;
        shards: {
          count: number;
          primaries: number;
        };
        docs: {
          total: number;
        };
        store: {
          size: {
            bytes: number;
          };
        };
      };
    };
  };
}

/** Metricbeat 节点统计数据 */
export interface MetricbeatNodeStats {
  node: {
    id: string;
    name: string;
    master: boolean;
    mlockall: boolean;
    stats: {
      jvm: {
        mem: {
          heap: {
            used: { bytes: number };
            max: { bytes: number };
          };
        };
        gc: {
          collectors: {
            young: { collection: { count: number; ms: number } };
            old: { collection: { count: number; ms: number } };
          };
        };
      };
      os: {
        cpu: {
          load_avg: { '1m': number; '5m': number; '15m': number };
        };
        mem: {
          total: { bytes: number };
          used: { bytes: number; pct: number };
          free: { bytes: number };
        };
      };
      fs: {
        summary: {
          total: { bytes: number };
          free: { bytes: number };
          available: { bytes: number };
        };
      };
      indices: {
        docs: { count: number };
        store: { size: { bytes: number } };
        indexing: {
          index: { total: number; time: { ms: number } };
        };
        search: {
          query: { total: number; time: { ms: number } };
        };
      };
    };
  };
}

/** Metricbeat 索引统计数据 */
export interface MetricbeatIndexStats {
  index: {
    name: string;
    uuid: string;
    status: string;
    total: {
      docs: { count: number };
      store: { size: { bytes: number } };
      segments: { count: number };
      search: {
        query: { total: number; time: { ms: number } };
      };
      indexing: {
        index: { total: number; time: { ms: number } };
      };
    };
    primaries: {
      docs: { count: number };
      store: { size: { bytes: number } };
    };
    shards: {
      total: number;
      primaries: number;
    };
  };
}

// ==================== 监控概览类型 ====================

/** 监控概览数据 */
export interface MonitoringOverview {
  cluster: {
    name: string;
    uuid: string;
    status: ClusterHealthStatus;
    version: string;
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
    store_size_bytes: number;
  };
  shards: {
    total: number;
    primaries: number;
    unassigned: number;
    relocating: number;
    initializing: number;
  };
  jvm: {
    heap_used_percent: number;
    heap_used_bytes: number;
    heap_max_bytes: number;
  };
  os: {
    cpu_percent: number;
    mem_used_percent: number;
  };
  fs: {
    total_bytes: number;
    available_bytes: number;
    used_percent: number;
  };
}

/** 时间序列监控数据点 */
export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

/** 监控指标时间序列 */
export interface MonitoringTimeSeries {
  metric: string;
  data: TimeSeriesDataPoint[];
}

// ==================== 系统信息类型 ====================

/** 系统信息 */
export interface SystemInfo {
  os: {
    name: string;
    version: string;
    arch: string;
    available_processors: number;
  };
  jvm: {
    version: string;
    vm_name: string;
    vm_vendor: string;
    vm_version: string;
    heap_init_bytes: number;
    heap_max_bytes: number;
    non_heap_init_bytes: number;
    non_heap_max_bytes: number;
  };
  process: {
    pid: number;
    mlockall: boolean;
    max_file_descriptors: number;
  };
}


// ==================== 告警相关类型 ====================

/** 告警级别 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/** 告警状态 */
export type AlertStatus = 'firing' | 'resolved' | 'acknowledged';

/** 告警通知渠道类型 */
export type NotificationChannelType = 'email' | 'dingtalk' | 'webhook' | 'sms' | 'internal';

/** 告警指标类型 */
export type AlertMetricType = 
  | 'cluster_health'
  | 'node_cpu'
  | 'node_heap'
  | 'node_disk'
  | 'node_memory'
  | 'index_docs'
  | 'index_size'
  | 'search_latency'
  | 'indexing_latency'
  | 'gc_time'
  | 'thread_pool_rejected'
  | 'circuit_breaker_tripped'
  | 'unassigned_shards';

/** 告警条件操作符 */
export type AlertOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

/** 告警规则 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: AlertMetricType;
  operator: AlertOperator;
  threshold: number;
  duration: number; // 持续时间（秒），超过此时间才触发告警
  severity: AlertSeverity;
  targets?: string[]; // 目标节点或索引，空表示全部
  notificationChannels: string[]; // 通知渠道 ID 列表
  cooldown: number; // 冷却时间（秒），避免重复告警
  createdAt: number;
  updatedAt: number;
}

/** 告警记录 */
export interface AlertRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: AlertMetricType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  value: number;
  threshold: number;
  target?: string; // 触发告警的节点或索引
  firedAt: number;
  resolvedAt?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  notificationsSent: Array<{
    channelId: string;
    channelType: NotificationChannelType;
    sentAt: number;
    success: boolean;
    error?: string;
  }>;
}

/** 通知渠道配置 */
export interface NotificationChannel {
  id: string;
  name: string;
  type: NotificationChannelType;
  enabled: boolean;
  config: NotificationChannelConfig;
  createdAt: number;
  updatedAt: number;
}

/** 通知渠道配置详情 */
export type NotificationChannelConfig = 
  | EmailChannelConfig
  | DingtalkChannelConfig
  | WebhookChannelConfig
  | SmsChannelConfig
  | InternalChannelConfig;

/** 邮件通知配置 */
export interface EmailChannelConfig {
  type: 'email';
  recipients: string[];
  smtpHost?: string;
  smtpPort?: number;
  username?: string;
  password?: string;
  useTls?: boolean;
}

/** 钉钉通知配置 */
export interface DingtalkChannelConfig {
  type: 'dingtalk';
  webhookUrl: string;
  secret?: string;
  atMobiles?: string[];
  atAll?: boolean;
}

/** Webhook 通知配置 */
export interface WebhookChannelConfig {
  type: 'webhook';
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  template?: string;
}

/** 短信通知配置 */
export interface SmsChannelConfig {
  type: 'sms';
  phoneNumbers: string[];
  provider: string;
  apiKey?: string;
}

/** 站内信通知配置 */
export interface InternalChannelConfig {
  type: 'internal';
  userIds?: string[];
  broadcast?: boolean;
}

/** 告警统计 */
export interface AlertStatistics {
  total: number;
  firing: number;
  resolved: number;
  acknowledged: number;
  bySeverity: {
    critical: number;
    warning: number;
    info: number;
  };
  byMetric: Record<AlertMetricType, number>;
  recentTrend: Array<{
    timestamp: number;
    count: number;
  }>;
}


// ==================== 审批相关类型 ====================

/** 申请类型 */
export type ApprovalRequestType =
  | 'create_index'      // 新建索引
  | 'delete_index'      // 删除索引
  | 'update_mapping'    // 修改映射
  | 'update_settings'   // 修改设置
  | 'create_alias'      // 创建别名
  | 'delete_alias'      // 删除别名
  | 'update_alias'      // 修改别名
  | 'create_template'   // 创建模板
  | 'delete_template'   // 删除模板
  | 'create_pipeline'   // 创建管道
  | 'delete_pipeline'   // 删除管道
  | 'reindex'           // 重建索引
  | 'other';            // 其他

/** 审批状态 */
export type ApprovalStatus =
  | 'pending'           // 待审批
  | 'approved'          // 已通过
  | 'rejected'          // 已驳回
  | 'cancelled'         // 已取消
  | 'processing'        // 处理中
  | 'completed'         // 已完成
  | 'failed';           // 执行失败

/** 审批节点状态 */
export type ApprovalNodeStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

/** 审批流程节点 */
export interface ApprovalNode {
  id: string;
  name: string;
  type: 'approval' | 'notification' | 'execution';
  assignee?: string;           // 审批人
  assigneeRole?: string;       // 审批角色
  status: ApprovalNodeStatus;
  comment?: string;            // 审批意见
  operatedAt?: number;         // 操作时间
  operatedBy?: string;         // 操作人
}

/** 审批日志 */
export interface ApprovalLog {
  id: string;
  action: string;              // 操作类型
  operator: string;            // 操作人
  operatedAt: number;          // 操作时间
  comment?: string;            // 备注
  details?: Record<string, unknown>; // 详细信息
}

/** 审批申请 */
export interface ApprovalRequest {
  id: string;
  title: string;
  type: ApprovalRequestType;
  status: ApprovalStatus;
  applicant: string;           // 申请人
  applicantDept?: string;      // 申请部门
  description: string;         // 申请说明
  content: ApprovalContent;    // 申请内容
  priority: 'low' | 'normal' | 'high' | 'urgent';
  nodes: ApprovalNode[];       // 审批流程节点
  logs: ApprovalLog[];         // 审批日志
  notificationChannels: string[]; // 通知渠道
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

/** 申请内容 - 根据类型不同有不同结构 */
export type ApprovalContent =
  | CreateIndexContent
  | DeleteIndexContent
  | UpdateMappingContent
  | UpdateSettingsContent
  | AliasContent
  | TemplateContent
  | PipelineContent
  | ReindexContent
  | OtherContent;

/** 新建索引内容 */
export interface CreateIndexContent {
  type: 'create_index';
  indexName: string;
  numberOfShards: number;
  numberOfReplicas: number;
  mappings?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  aliases?: string[];
}

/** 删除索引内容 */
export interface DeleteIndexContent {
  type: 'delete_index';
  indexName: string;
  reason: string;
  backupRequired: boolean;
}

/** 修改映射内容 */
export interface UpdateMappingContent {
  type: 'update_mapping';
  indexName: string;
  mappings: Record<string, unknown>;
  reason: string;
}

/** 修改设置内容 */
export interface UpdateSettingsContent {
  type: 'update_settings';
  indexName: string;
  settings: Record<string, unknown>;
  reason: string;
}

/** 别名操作内容 */
export interface AliasContent {
  type: 'create_alias' | 'delete_alias' | 'update_alias';
  aliasName: string;
  indexName: string;
  filter?: Record<string, unknown>;
  routing?: string;
}

/** 模板操作内容 */
export interface TemplateContent {
  type: 'create_template' | 'delete_template';
  templateName: string;
  indexPatterns?: string[];
  template?: Record<string, unknown>;
}

/** 管道操作内容 */
export interface PipelineContent {
  type: 'create_pipeline' | 'delete_pipeline';
  pipelineName: string;
  description?: string;
  processors?: Array<Record<string, unknown>>;
}

/** 重建索引内容 */
export interface ReindexContent {
  type: 'reindex';
  sourceIndex: string;
  destIndex: string;
  script?: string;
  reason: string;
}

/** 其他操作内容 */
export interface OtherContent {
  type: 'other';
  operation: string;
  details: string;
}


// ==================== 操作流相关类型 ====================

/** 原子操作类型 */
export type AtomicOperationType =
  | 'read_index_config'   // 读取索引配置
  | 'create_index'        // 创建索引
  | 'update_mapping'      // 更新映射
  | 'update_settings'     // 更新设置
  | 'reindex'             // 重建索引
  | 'create_alias'        // 创建别名
  | 'switch_alias'        // 切换别名
  | 'delete_alias'        // 删除别名
  | 'delete_index'        // 删除索引
  | 'verify_data'         // 验证数据
  | 'backup_index'        // 备份索引
  | 'custom_api'          // 自定义API调用
  | 'custom_script';      // 自定义脚本

/** HTTP 方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';

/** 操作流步骤类型 */
export type WorkflowStepType =
  | AtomicOperationType
  | 'approval'            // 审批节点
  | 'notification';       // 通知节点

/** 操作流步骤状态 */
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/** 操作流状态 */
export type WorkflowStatus = 'draft' | 'pending_approval' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled';

/** 操作流步骤执行结果 */
export interface WorkflowStepResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  duration?: number;  // 执行耗时(ms)
  response?: unknown; // API响应
}

/** 操作流步骤定义 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  description?: string;
  config: Record<string, unknown>;
  status: WorkflowStepStatus;
  result?: WorkflowStepResult;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
}

/** 原子操作API配置 */
export interface AtomicOperationApiConfig {
  method: HttpMethod;
  endpoint: string;           // API端点，支持变量如 /{{indexName}}/_settings
  body?: string;              // 请求体模板，JSON格式
  headers?: Record<string, string>;
  successCondition?: string;  // 成功条件表达式
}

/** 原子操作定义 */
export interface AtomicOperation {
  id: string;
  name: string;
  type: AtomicOperationType;
  description: string;
  apiConfig: AtomicOperationApiConfig;  // API调用配置
  inputSchema: Record<string, unknown>;  // 输入参数定义
  outputSchema?: Record<string, unknown>; // 输出参数定义
  isBuiltin: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/** 操作流模板 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'index' | 'alias' | 'migration' | 'custom';
  steps: Omit<WorkflowStep, 'id' | 'status' | 'result' | 'startedAt' | 'completedAt' | 'error'>[];
  isBuiltin: boolean;
  boundApprovalTypes?: ApprovalRequestType[];  // 绑定的审批类型
  createdAt: number;
  updatedAt: number;
}

/** 操作流实例 */
export interface WorkflowInstance {
  id: string;
  templateId?: string;
  templateName?: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;  // 流程变量
  approvalId?: string;                 // 关联的审批ID
  currentStepIndex?: number;           // 当前执行步骤索引
  progress?: number;                   // 执行进度 0-100
  triggerType?: 'manual' | 'approval'; // 触发类型
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
}

/** 操作流执行记录 */
export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  templateId?: string;
  templateName?: string;
  status: WorkflowStatus;
  triggerType: 'manual' | 'approval';
  approvalId?: string;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  createdBy: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}
