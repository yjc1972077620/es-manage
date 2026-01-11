/**
 * Mock 数据生成器
 * 基于 Elasticsearch 9.0 和 Metricbeat 的实际数据结构
 */

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

// ==================== 集群数据 ====================

/** 生成集群健康数据 */
export function generateClusterHealth(): ClusterHealth {
  return {
    cluster_name: 'es-production-cluster',
    status: 'green',
    timed_out: false,
    number_of_nodes: 3,
    number_of_data_nodes: 3,
    active_primary_shards: 45,
    active_shards: 90,
    relocating_shards: 0,
    initializing_shards: 0,
    unassigned_shards: 0,
    delayed_unassigned_shards: 0,
    number_of_pending_tasks: 0,
    number_of_in_flight_fetch: 0,
    task_max_waiting_in_queue_millis: 0,
    active_shards_percent_as_number: 100.0,
  };
}

/** 生成集群统计数据 */
export function generateClusterStats(): ClusterStats {
  return {
    _nodes: { total: 3, successful: 3, failed: 0 },
    cluster_name: 'es-production-cluster',
    cluster_uuid: 'xQ3b7K9sTRmKvW8nL2pYzA',
    timestamp: Date.now(),
    status: 'green',
    indices: {
      count: 15,
      shards: {
        total: 90,
        primaries: 45,
        replication: 1.0,
        index: {
          shards: { min: 2, max: 10, avg: 6 },
          primaries: { min: 1, max: 5, avg: 3 },
          replication: { min: 1, max: 1, avg: 1 },
        },
      },
      docs: { count: 12500000, deleted: 125000 },
      store: { size_in_bytes: 85899345920 }, // ~80GB
      fielddata: { memory_size_in_bytes: 52428800, evictions: 0 },
      query_cache: {
        memory_size_in_bytes: 104857600,
        total_count: 1500000,
        hit_count: 1200000,
        miss_count: 300000,
        cache_size: 5000,
        cache_count: 8000,
        evictions: 500,
      },
      completion: { size_in_bytes: 0 },
      segments: {
        count: 450,
        memory_in_bytes: 209715200,
        terms_memory_in_bytes: 157286400,
        stored_fields_memory_in_bytes: 20971520,
        term_vectors_memory_in_bytes: 0,
        norms_memory_in_bytes: 10485760,
        points_memory_in_bytes: 5242880,
        doc_values_memory_in_bytes: 15728640,
        index_writer_memory_in_bytes: 0,
        version_map_memory_in_bytes: 0,
        fixed_bit_set_memory_in_bytes: 0,
        max_unsafe_auto_id_timestamp: -1,
        file_sizes: {},
      },
      mappings: {
        field_types: [
          { name: 'keyword', count: 150, index_count: 15 },
          { name: 'text', count: 80, index_count: 12 },
          { name: 'long', count: 60, index_count: 15 },
          { name: 'date', count: 30, index_count: 15 },
          { name: 'boolean', count: 20, index_count: 10 },
        ],
      },
      analysis: {
        char_filter_types: [],
        tokenizer_types: [{ name: 'standard', count: 12, index_count: 12 }],
        filter_types: [{ name: 'lowercase', count: 12, index_count: 12 }],
        analyzer_types: [{ name: 'standard', count: 15, index_count: 15 }],
      },
    },
    nodes: {
      count: {
        total: 3,
        coordinating_only: 0,
        data: 3,
        data_cold: 0,
        data_content: 3,
        data_frozen: 0,
        data_hot: 3,
        data_warm: 0,
        ingest: 3,
        master: 3,
        ml: 0,
        remote_cluster_client: 3,
        transform: 0,
        voting_only: 0,
      },
      versions: ['9.0.0'],
      os: {
        available_processors: 24,
        allocated_processors: 24,
        names: [{ name: 'Linux', count: 3 }],
        pretty_names: [{ pretty_name: 'Ubuntu 22.04.3 LTS', count: 3 }],
        architectures: [{ arch: 'amd64', count: 3 }],
        mem: {
          total_in_bytes: 103079215104, // ~96GB
          adjusted_total_in_bytes: 103079215104,
          free_in_bytes: 41231686041,
          used_in_bytes: 61847529063,
          free_percent: 40,
          used_percent: 60,
        },
      },
      process: {
        cpu: { percent: 15 },
        open_file_descriptors: { min: 500, max: 800, avg: 650 },
      },
      jvm: {
        max_uptime_in_millis: 864000000, // 10天
        versions: [
          {
            version: '21.0.1',
            vm_name: 'OpenJDK 64-Bit Server VM',
            vm_version: '21.0.1+12',
            vm_vendor: 'Eclipse Adoptium',
            bundled_jdk: true,
            using_bundled_jdk: true,
            count: 3,
          },
        ],
        mem: {
          heap_used_in_bytes: 12884901888, // ~12GB
          heap_max_in_bytes: 34359738368, // ~32GB
        },
        threads: 450,
      },
      fs: {
        total_in_bytes: 1099511627776, // 1TB
        free_in_bytes: 659706976666,
        available_in_bytes: 604462909030,
      },
      plugins: [],
      network_types: {
        transport_types: { 'security4': 3 },
        http_types: { 'security4': 3 },
      },
      discovery_types: { 'multi-node': 3 },
      packaging_types: [{ flavor: 'default', type: 'docker', count: 3 }],
      ingest: {
        number_of_pipelines: 5,
        processor_stats: {},
      },
    },
  };
}


// ==================== 节点数据 ====================

/** 节点基础配置 */
const nodeConfigs = [
  { id: 'node-1', name: 'es-node-01', ip: '192.168.1.101', isMaster: true },
  { id: 'node-2', name: 'es-node-02', ip: '192.168.1.102', isMaster: false },
  { id: 'node-3', name: 'es-node-03', ip: '192.168.1.103', isMaster: false },
];

/** 生成节点统计数据 */
export function generateNodeStats(): Record<string, NodeStats> {
  const nodes: Record<string, NodeStats> = {};
  
  nodeConfigs.forEach((config, index) => {
    const cpuPercent = 10 + Math.random() * 30;
    const heapUsedPercent = 40 + Math.random() * 30;
    const heapMaxBytes = 10737418240; // 10GB
    const heapUsedBytes = Math.floor(heapMaxBytes * heapUsedPercent / 100);
    
    nodes[config.id] = {
      name: config.name,
      transport_address: `${config.ip}:9300`,
      host: config.ip,
      ip: config.ip,
      version: '9.0.0',
      build_flavor: 'default',
      build_type: 'docker',
      build_hash: 'abc123def456',
      roles: ['master', 'data', 'data_content', 'data_hot', 'ingest', 'remote_cluster_client'],
      attributes: {
        'ml.machine_memory': '34359738368',
        'xpack.installed': 'true',
        'transform.node': 'true',
      },
      os: {
        timestamp: Date.now(),
        cpu: {
          percent: Math.round(cpuPercent),
          load_average: {
            '1m': 0.5 + Math.random() * 2,
            '5m': 0.4 + Math.random() * 1.5,
            '15m': 0.3 + Math.random() * 1,
          },
        },
        mem: {
          total_in_bytes: 34359738368, // 32GB
          adjusted_total_in_bytes: 34359738368,
          free_in_bytes: 13743895347,
          used_in_bytes: 20615843021,
          free_percent: 40,
          used_percent: 60,
        },
        swap: {
          total_in_bytes: 0,
          free_in_bytes: 0,
          used_in_bytes: 0,
        },
      },
      jvm: {
        timestamp: Date.now(),
        uptime_in_millis: 864000000 - index * 86400000, // 不同启动时间
        mem: {
          heap_used_in_bytes: heapUsedBytes,
          heap_used_percent: Math.round(heapUsedPercent),
          heap_committed_in_bytes: heapMaxBytes,
          heap_max_in_bytes: heapMaxBytes,
          non_heap_used_in_bytes: 209715200,
          non_heap_committed_in_bytes: 262144000,
          pools: {
            'G1 Eden Space': {
              used_in_bytes: Math.floor(heapUsedBytes * 0.3),
              max_in_bytes: Math.floor(heapMaxBytes * 0.4),
              peak_used_in_bytes: Math.floor(heapMaxBytes * 0.35),
              peak_max_in_bytes: Math.floor(heapMaxBytes * 0.4),
            },
            'G1 Survivor Space': {
              used_in_bytes: Math.floor(heapUsedBytes * 0.1),
              max_in_bytes: Math.floor(heapMaxBytes * 0.1),
              peak_used_in_bytes: Math.floor(heapMaxBytes * 0.08),
              peak_max_in_bytes: Math.floor(heapMaxBytes * 0.1),
            },
            'G1 Old Gen': {
              used_in_bytes: Math.floor(heapUsedBytes * 0.6),
              max_in_bytes: Math.floor(heapMaxBytes * 0.5),
              peak_used_in_bytes: Math.floor(heapMaxBytes * 0.45),
              peak_max_in_bytes: Math.floor(heapMaxBytes * 0.5),
            },
          },
        },
        threads: {
          count: 150 + index * 10,
          peak_count: 180 + index * 10,
        },
        gc: {
          collectors: {
            'G1 Young Generation': {
              collection_count: 5000 + index * 500,
              collection_time_in_millis: 120000 + index * 10000,
            },
            'G1 Old Generation': {
              collection_count: 50 + index * 5,
              collection_time_in_millis: 5000 + index * 500,
            },
          },
        },
        buffer_pools: {
          mapped: {
            count: 100,
            used_in_bytes: 52428800,
            total_capacity_in_bytes: 52428800,
          },
          direct: {
            count: 50,
            used_in_bytes: 104857600,
            total_capacity_in_bytes: 104857600,
          },
        },
        classes: {
          current_loaded_count: 20000,
          total_loaded_count: 20500,
          total_unloaded_count: 500,
        },
      },
      process: {
        timestamp: Date.now(),
        open_file_descriptors: 500 + index * 100,
        max_file_descriptors: 65535,
        cpu: {
          percent: Math.round(cpuPercent * 0.8),
          total_in_millis: 3600000000 + index * 360000000,
        },
        mem: {
          total_virtual_in_bytes: 17179869184,
        },
      },
      fs: {
        timestamp: Date.now(),
        total: {
          total_in_bytes: 536870912000, // 500GB
          free_in_bytes: 322122547200,
          available_in_bytes: 295279001600,
        },
        data: [
          {
            path: '/usr/share/elasticsearch/data',
            mount: '/dev/sda1',
            type: 'ext4',
            total_in_bytes: 536870912000,
            free_in_bytes: 322122547200,
            available_in_bytes: 295279001600,
          },
        ],
      },
      transport: {
        server_open: 13,
        total_outbound_connections: 6,
        rx_count: 1500000 + index * 100000,
        rx_size_in_bytes: 10737418240 + index * 1073741824,
        tx_count: 1400000 + index * 100000,
        tx_size_in_bytes: 9663676416 + index * 1073741824,
      },
      http: {
        current_open: 50 + index * 10,
        total_opened: 100000 + index * 10000,
      },
      thread_pool: {
        analyze: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 1, completed: 100 },
        fetch_shard_started: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 8, completed: 50 },
        fetch_shard_store: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 8, completed: 50 },
        flush: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 4, completed: 1000 },
        force_merge: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 1, completed: 10 },
        generic: { threads: 8, queue: 0, active: 1, rejected: 0, largest: 8, completed: 50000 },
        get: { threads: 8, queue: 0, active: 0, rejected: 0, largest: 8, completed: 100000 },
        management: { threads: 5, queue: 0, active: 1, rejected: 0, largest: 5, completed: 10000 },
        refresh: { threads: 4, queue: 0, active: 0, rejected: 0, largest: 4, completed: 50000 },
        search: { threads: 13, queue: 0, active: 2, rejected: 0, largest: 13, completed: 500000 },
        search_throttled: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 1, completed: 1000 },
        snapshot: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 4, completed: 100 },
        warmer: { threads: 1, queue: 0, active: 0, rejected: 0, largest: 4, completed: 5000 },
        write: { threads: 8, queue: 0, active: 1, rejected: 0, largest: 8, completed: 200000 },
      },
      breakers: {
        request: {
          limit_size_in_bytes: 6442450944,
          limit_size: '6gb',
          estimated_size_in_bytes: 0,
          estimated_size: '0b',
          overhead: 1.0,
          tripped: 0,
        },
        fielddata: {
          limit_size_in_bytes: 4294967296,
          limit_size: '4gb',
          estimated_size_in_bytes: 52428800,
          estimated_size: '50mb',
          overhead: 1.03,
          tripped: 0,
        },
        in_flight_requests: {
          limit_size_in_bytes: 10737418240,
          limit_size: '10gb',
          estimated_size_in_bytes: 1048576,
          estimated_size: '1mb',
          overhead: 2.0,
          tripped: 0,
        },
        parent: {
          limit_size_in_bytes: 10200547328,
          limit_size: '9.5gb',
          estimated_size_in_bytes: 53477376,
          estimated_size: '51mb',
          overhead: 1.0,
          tripped: 0,
        },
      },
      indices: {
        docs: { count: 4166666 + index * 100000, deleted: 41666 + index * 1000 },
        store: { size_in_bytes: 28633115306 + index * 1073741824 },
        indexing: {
          index_total: 5000000 + index * 500000,
          index_time_in_millis: 1800000 + index * 180000,
          index_current: 0,
          index_failed: 100 + index * 10,
          delete_total: 50000 + index * 5000,
          delete_time_in_millis: 18000 + index * 1800,
          delete_current: 0,
          noop_update_total: 1000,
          is_throttled: false,
          throttle_time_in_millis: 0,
        },
        get: {
          total: 100000 + index * 10000,
          time_in_millis: 50000 + index * 5000,
          exists_total: 95000 + index * 9500,
          exists_time_in_millis: 47500 + index * 4750,
          missing_total: 5000 + index * 500,
          missing_time_in_millis: 2500 + index * 250,
          current: 0,
        },
        search: {
          open_contexts: 0,
          query_total: 1000000 + index * 100000,
          query_time_in_millis: 500000 + index * 50000,
          query_current: 0,
          fetch_total: 800000 + index * 80000,
          fetch_time_in_millis: 200000 + index * 20000,
          fetch_current: 0,
          scroll_total: 10000 + index * 1000,
          scroll_time_in_millis: 50000 + index * 5000,
          scroll_current: 0,
          suggest_total: 1000 + index * 100,
          suggest_time_in_millis: 500 + index * 50,
          suggest_current: 0,
        },
        merges: {
          current: 0,
          current_docs: 0,
          current_size_in_bytes: 0,
          total: 5000 + index * 500,
          total_time_in_millis: 3600000 + index * 360000,
          total_docs: 10000000 + index * 1000000,
          total_size_in_bytes: 53687091200 + index * 5368709120,
          total_stopped_time_in_millis: 0,
          total_throttled_time_in_millis: 0,
          total_auto_throttle_in_bytes: 20971520,
        },
        refresh: {
          total: 50000 + index * 5000,
          total_time_in_millis: 1800000 + index * 180000,
          external_total: 45000 + index * 4500,
          external_total_time_in_millis: 1620000 + index * 162000,
          listeners: 0,
        },
        flush: {
          total: 1000 + index * 100,
          periodic: 500 + index * 50,
          total_time_in_millis: 180000 + index * 18000,
        },
        warmer: {
          current: 0,
          total: 50000 + index * 5000,
          total_time_in_millis: 90000 + index * 9000,
        },
        query_cache: {
          memory_size_in_bytes: 34952533 + index * 3495253,
          total_count: 500000 + index * 50000,
          hit_count: 400000 + index * 40000,
          miss_count: 100000 + index * 10000,
          cache_size: 1666 + index * 166,
          cache_count: 2666 + index * 266,
          evictions: 166 + index * 16,
        },
        fielddata: {
          memory_size_in_bytes: 17476266 + index * 1747626,
          evictions: 0,
        },
        completion: { size_in_bytes: 0 },
        segments: {
          count: 150 + index * 15,
          memory_in_bytes: 69905066 + index * 6990506,
          terms_memory_in_bytes: 52428800 + index * 5242880,
          stored_fields_memory_in_bytes: 6990506 + index * 699050,
          term_vectors_memory_in_bytes: 0,
          norms_memory_in_bytes: 3495253 + index * 349525,
          points_memory_in_bytes: 1747626 + index * 174762,
          doc_values_memory_in_bytes: 5242880 + index * 524288,
          index_writer_memory_in_bytes: 0,
          version_map_memory_in_bytes: 0,
          fixed_bit_set_memory_in_bytes: 0,
          max_unsafe_auto_id_timestamp: -1,
          file_sizes: {},
        },
        translog: {
          operations: 10000 + index * 1000,
          size_in_bytes: 104857600 + index * 10485760,
          uncommitted_operations: 100 + index * 10,
          uncommitted_size_in_bytes: 1048576 + index * 104857,
          earliest_last_modified_age: 1000,
        },
        request_cache: {
          memory_size_in_bytes: 10485760 + index * 1048576,
          evictions: 100 + index * 10,
          hit_count: 50000 + index * 5000,
          miss_count: 10000 + index * 1000,
        },
        recovery: {
          current_as_source: 0,
          current_as_target: 0,
          throttle_time_in_millis: 0,
        },
      },
      ingest: {
        total: {
          count: 100000 + index * 10000,
          time_in_millis: 50000 + index * 5000,
          current: 0,
          failed: 10 + index,
        },
        pipelines: {},
      },
    };
  });
  
  return nodes;
}

/** 获取节点列表（简化版） */
export function getNodeList() {
  return nodeConfigs.map((config, index) => ({
    id: config.id,
    name: config.name,
    ip: config.ip,
    isMaster: config.isMaster,
    isCurrentMaster: index === 0,
    roles: ['master', 'data', 'ingest'],
    version: '9.0.0',
  }));
}


// ==================== 索引数据 ====================

/** 索引配置 */
const indexConfigs = [
  { name: 'logs-nginx-2024.01', docs: 5000000, size: 10737418240, shards: 5, replicas: 1 },
  { name: 'logs-nginx-2024.02', docs: 4500000, size: 9663676416, shards: 5, replicas: 1 },
  { name: 'logs-app-2024.01', docs: 2000000, size: 4294967296, shards: 3, replicas: 1 },
  { name: 'logs-app-2024.02', docs: 1800000, size: 3865470566, shards: 3, replicas: 1 },
  { name: 'metrics-system-2024.01', docs: 800000, size: 1717986918, shards: 2, replicas: 1 },
  { name: 'metrics-system-2024.02', docs: 750000, size: 1610612736, shards: 2, replicas: 1 },
  { name: 'apm-traces-2024.01', docs: 300000, size: 644245094, shards: 2, replicas: 1 },
  { name: 'apm-traces-2024.02', docs: 280000, size: 601295421, shards: 2, replicas: 1 },
  { name: 'users', docs: 100000, size: 214748364, shards: 1, replicas: 1 },
  { name: 'products', docs: 50000, size: 107374182, shards: 1, replicas: 1 },
  { name: 'orders', docs: 500000, size: 1073741824, shards: 3, replicas: 1 },
  { name: '.kibana', docs: 5000, size: 10737418, shards: 1, replicas: 1 },
  { name: '.security-7', docs: 100, size: 214748, shards: 1, replicas: 1 },
  { name: '.monitoring-es-7-2024.01', docs: 1000000, size: 2147483648, shards: 1, replicas: 0 },
  { name: '.monitoring-es-7-2024.02', docs: 900000, size: 1932735283, shards: 1, replicas: 0 },
];

/** 生成索引列表 */
export function generateIndexList(): IndexInfo[] {
  return indexConfigs.map((config, index) => ({
    health: 'green' as const,
    status: 'open' as const,
    index: config.name,
    uuid: `idx-uuid-${index.toString().padStart(3, '0')}`,
    pri: config.shards,
    rep: config.replicas,
    'docs.count': config.docs,
    'docs.deleted': Math.floor(config.docs * 0.01),
    'store.size': formatBytesSimple(config.size * (1 + config.replicas)),
    'pri.store.size': formatBytesSimple(config.size),
    creation_date: Date.now() - (30 - index) * 86400000,
  }));
}

/** 简单字节格式化 */
function formatBytesSimple(bytes: number): string {
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}kb`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}mb`;
  return `${(bytes / 1073741824).toFixed(1)}gb`;
}

/** 生成索引统计数据 */
export function generateIndexStats(indexName: string): IndexStats {
  const config = indexConfigs.find(c => c.name === indexName) || indexConfigs[0];
  
  const detailStats = {
    docs: { count: config.docs, deleted: Math.floor(config.docs * 0.01) },
    store: { size_in_bytes: config.size },
    indexing: {
      index_total: config.docs + Math.floor(config.docs * 0.1),
      index_time_in_millis: Math.floor(config.docs * 0.5),
      index_current: 0,
      index_failed: Math.floor(config.docs * 0.0001),
      delete_total: Math.floor(config.docs * 0.01),
      delete_time_in_millis: Math.floor(config.docs * 0.005),
      delete_current: 0,
      noop_update_total: 0,
      is_throttled: false,
      throttle_time_in_millis: 0,
    },
    get: {
      total: Math.floor(config.docs * 0.1),
      time_in_millis: Math.floor(config.docs * 0.05),
      exists_total: Math.floor(config.docs * 0.095),
      exists_time_in_millis: Math.floor(config.docs * 0.0475),
      missing_total: Math.floor(config.docs * 0.005),
      missing_time_in_millis: Math.floor(config.docs * 0.0025),
      current: 0,
    },
    search: {
      open_contexts: 0,
      query_total: Math.floor(config.docs * 0.5),
      query_time_in_millis: Math.floor(config.docs * 0.25),
      query_current: 0,
      fetch_total: Math.floor(config.docs * 0.4),
      fetch_time_in_millis: Math.floor(config.docs * 0.1),
      fetch_current: 0,
      scroll_total: Math.floor(config.docs * 0.01),
      scroll_time_in_millis: Math.floor(config.docs * 0.05),
      scroll_current: 0,
      suggest_total: 0,
      suggest_time_in_millis: 0,
      suggest_current: 0,
    },
    merges: {
      current: 0,
      current_docs: 0,
      current_size_in_bytes: 0,
      total: Math.floor(config.docs * 0.001),
      total_time_in_millis: Math.floor(config.docs * 0.5),
      total_docs: config.docs,
      total_size_in_bytes: config.size,
    },
    refresh: {
      total: Math.floor(config.docs * 0.01),
      total_time_in_millis: Math.floor(config.docs * 0.05),
      external_total: Math.floor(config.docs * 0.009),
      external_total_time_in_millis: Math.floor(config.docs * 0.045),
      listeners: 0,
    },
    flush: {
      total: Math.floor(config.docs * 0.0001),
      periodic: Math.floor(config.docs * 0.00005),
      total_time_in_millis: Math.floor(config.docs * 0.01),
    },
    segments: {
      count: Math.floor(config.docs / 100000) + 1,
      memory_in_bytes: Math.floor(config.size * 0.01),
      terms_memory_in_bytes: Math.floor(config.size * 0.007),
      stored_fields_memory_in_bytes: Math.floor(config.size * 0.001),
      term_vectors_memory_in_bytes: 0,
      norms_memory_in_bytes: Math.floor(config.size * 0.0005),
      points_memory_in_bytes: Math.floor(config.size * 0.0003),
      doc_values_memory_in_bytes: Math.floor(config.size * 0.0012),
      index_writer_memory_in_bytes: 0,
      version_map_memory_in_bytes: 0,
      fixed_bit_set_memory_in_bytes: 0,
    },
    translog: {
      operations: Math.floor(config.docs * 0.001),
      size_in_bytes: Math.floor(config.size * 0.01),
      uncommitted_operations: Math.floor(config.docs * 0.0001),
      uncommitted_size_in_bytes: Math.floor(config.size * 0.001),
    },
    request_cache: {
      memory_size_in_bytes: Math.floor(config.size * 0.001),
      evictions: 0,
      hit_count: Math.floor(config.docs * 0.1),
      miss_count: Math.floor(config.docs * 0.02),
    },
    query_cache: {
      memory_size_in_bytes: Math.floor(config.size * 0.002),
      total_count: Math.floor(config.docs * 0.2),
      hit_count: Math.floor(config.docs * 0.16),
      miss_count: Math.floor(config.docs * 0.04),
      cache_size: Math.floor(config.docs * 0.0001),
      cache_count: Math.floor(config.docs * 0.0002),
      evictions: 0,
    },
    fielddata: {
      memory_size_in_bytes: Math.floor(config.size * 0.001),
      evictions: 0,
    },
    completion: { size_in_bytes: 0 },
  };
  
  return {
    _shards: {
      total: config.shards * (1 + config.replicas),
      successful: config.shards * (1 + config.replicas),
      failed: 0,
    },
    _all: {
      primaries: detailStats,
      total: {
        ...detailStats,
        store: { size_in_bytes: config.size * (1 + config.replicas) },
      },
    },
    indices: {
      [indexName]: {
        uuid: `idx-uuid-${indexConfigs.findIndex(c => c.name === indexName).toString().padStart(3, '0')}`,
        primaries: detailStats,
        total: {
          ...detailStats,
          store: { size_in_bytes: config.size * (1 + config.replicas) },
        },
      },
    },
  };
}

/** 生成索引设置 */
export function generateIndexSettings(indexName: string): IndexSettings {
  const config = indexConfigs.find(c => c.name === indexName) || indexConfigs[0];
  
  return {
    index: {
      number_of_shards: config.shards.toString(),
      number_of_replicas: config.replicas.toString(),
      provided_name: indexName,
      creation_date: (Date.now() - 30 * 86400000).toString(),
      uuid: `idx-uuid-${indexConfigs.findIndex(c => c.name === indexName).toString().padStart(3, '0')}`,
      version: { created: '9000099' },
      refresh_interval: '1s',
      max_result_window: '10000',
    },
  };
}

/** 生成索引映射 */
export function generateIndexMapping(indexName: string): IndexMapping {
  // 根据索引名称生成不同的映射
  if (indexName.startsWith('logs-')) {
    return {
      mappings: {
        properties: {
          '@timestamp': { type: 'date' },
          message: { type: 'text', analyzer: 'standard' },
          level: { type: 'keyword' },
          host: {
            properties: {
              name: { type: 'keyword' },
              ip: { type: 'ip' },
            },
          },
          service: {
            properties: {
              name: { type: 'keyword' },
              version: { type: 'keyword' },
            },
          },
          http: {
            properties: {
              request: {
                properties: {
                  method: { type: 'keyword' },
                  path: { type: 'keyword' },
                },
              },
              response: {
                properties: {
                  status_code: { type: 'integer' },
                  body_bytes: { type: 'long' },
                },
              },
            },
          },
        },
      },
    };
  }
  
  // 默认映射
  return {
    mappings: {
      properties: {
        '@timestamp': { type: 'date' },
        id: { type: 'keyword' },
        name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
      },
    },
  };
}


// ==================== 监控概览数据 ====================

/** 生成监控概览数据 */
export function generateMonitoringOverview(): MonitoringOverview {
  const clusterStats = generateClusterStats();
  const clusterHealth = generateClusterHealth();
  
  return {
    cluster: {
      name: clusterStats.cluster_name,
      uuid: clusterStats.cluster_uuid,
      status: clusterStats.status,
      version: '9.0.0',
    },
    nodes: {
      total: clusterStats.nodes.count.total,
      successful: clusterStats._nodes.successful,
      data: clusterStats.nodes.count.data,
      master: clusterStats.nodes.count.master,
    },
    indices: {
      total: clusterStats.indices.count,
      docs: clusterStats.indices.docs.count,
      store_size_bytes: clusterStats.indices.store.size_in_bytes,
    },
    shards: {
      total: clusterHealth.active_shards,
      primaries: clusterHealth.active_primary_shards,
      unassigned: clusterHealth.unassigned_shards,
      relocating: clusterHealth.relocating_shards,
      initializing: clusterHealth.initializing_shards,
    },
    jvm: {
      heap_used_percent: Math.round(
        (clusterStats.nodes.jvm.mem.heap_used_in_bytes / clusterStats.nodes.jvm.mem.heap_max_in_bytes) * 100
      ),
      heap_used_bytes: clusterStats.nodes.jvm.mem.heap_used_in_bytes,
      heap_max_bytes: clusterStats.nodes.jvm.mem.heap_max_in_bytes,
    },
    os: {
      cpu_percent: clusterStats.nodes.process.cpu.percent,
      mem_used_percent: clusterStats.nodes.os.mem.used_percent,
    },
    fs: {
      total_bytes: clusterStats.nodes.fs.total_in_bytes,
      available_bytes: clusterStats.nodes.fs.available_in_bytes,
      used_percent: Math.round(
        ((clusterStats.nodes.fs.total_in_bytes - clusterStats.nodes.fs.available_in_bytes) /
          clusterStats.nodes.fs.total_in_bytes) *
          100
      ),
    },
  };
}

// ==================== 时间序列数据 ====================

/** 生成时间序列数据 */
export function generateTimeSeries(
  metric: string,
  startTime: number = Date.now() - 3600000,
  endTime: number = Date.now(),
  interval?: number
): TimeSeriesDataPoint[] {
  const duration = endTime - startTime;
  // 根据时间范围自动计算合适的间隔
  const autoInterval = interval || Math.max(60000, Math.floor(duration / 60));
  const points: TimeSeriesDataPoint[] = [];
  const count = Math.floor(duration / autoInterval);
  
  // 根据指标类型生成不同的基准值和波动范围
  let baseValue: number;
  let variance: number;
  
  switch (metric) {
    case 'cpu_percent':
      baseValue = 15;
      variance = 20;
      break;
    case 'heap_used_percent':
      baseValue = 55;
      variance = 15;
      break;
    case 'mem_used_percent':
      baseValue = 60;
      variance = 10;
      break;
    case 'disk_used_percent':
      baseValue = 45;
      variance = 5;
      break;
    case 'search_rate':
      baseValue = 500;
      variance = 200;
      break;
    case 'indexing_rate':
      baseValue = 100;
      variance = 50;
      break;
    case 'query_latency':
      baseValue = 50;
      variance = 30;
      break;
    case 'gc_young_count':
      baseValue = 10;
      variance = 5;
      break;
    case 'gc_old_count':
      baseValue = 0.5;
      variance = 0.3;
      break;
    case 'thread_pool_search_queue':
      baseValue = 5;
      variance = 10;
      break;
    case 'thread_pool_write_queue':
      baseValue = 3;
      variance = 8;
      break;
    case 'network_rx':
      baseValue = 50;
      variance = 30;
      break;
    case 'network_tx':
      baseValue = 40;
      variance = 25;
      break;
    case 'segment_count':
      baseValue = 150;
      variance = 20;
      break;
    case 'doc_count':
      baseValue = 4000000;
      variance = 100000;
      break;
    default:
      baseValue = 50;
      variance = 20;
  }
  
  for (let i = 0; i <= count; i++) {
    const timestamp = startTime + i * autoInterval;
    // 添加一些随机波动和趋势
    const trend = Math.sin((i / count) * Math.PI * 2) * (variance * 0.3);
    const noise = (Math.random() - 0.5) * variance;
    let value = baseValue + trend + noise;
    
    // 确保值在合理范围内
    if (metric.includes('percent')) {
      value = Math.max(0, Math.min(100, value));
    } else {
      value = Math.max(0, value);
    }
    
    points.push({ timestamp, value: Math.round(value * 100) / 100 });
  }
  
  return points;
}

/** 生成多个指标的时间序列数据 */
export function generateMultipleTimeSeries(
  metrics: string[],
  startTime?: number,
  endTime?: number,
  interval?: number
): Record<string, TimeSeriesDataPoint[]> {
  const result: Record<string, TimeSeriesDataPoint[]> = {};
  
  metrics.forEach(metric => {
    result[metric] = generateTimeSeries(metric, startTime, endTime, interval);
  });
  
  return result;
}

/** 生成节点级别的时间序列数据 */
export function generateNodeTimeSeries(
  nodeId: string,
  metrics: string[],
  startTime?: number,
  endTime?: number
): Record<string, TimeSeriesDataPoint[]> {
  // 根据节点 ID 生成略有不同的数据
  const nodeIndex = parseInt(nodeId.replace('node-', '')) || 1;
  const result: Record<string, TimeSeriesDataPoint[]> = {};
  
  metrics.forEach(metric => {
    const baseData = generateTimeSeries(metric, startTime, endTime);
    // 根据节点索引调整数据
    result[metric] = baseData.map(point => ({
      ...point,
      value: point.value * (0.9 + nodeIndex * 0.05),
    }));
  });
  
  return result;
}

/** 生成索引级别的时间序列数据 */
export function generateIndexTimeSeries(
  indexName: string,
  metrics: string[],
  startTime?: number,
  endTime?: number
): Record<string, TimeSeriesDataPoint[]> {
  const config = indexConfigs.find(c => c.name === indexName);
  const scaleFactor = config ? config.docs / 5000000 : 1;
  const result: Record<string, TimeSeriesDataPoint[]> = {};
  
  metrics.forEach(metric => {
    const baseData = generateTimeSeries(metric, startTime, endTime);
    result[metric] = baseData.map(point => ({
      ...point,
      value: Math.round(point.value * scaleFactor * 100) / 100,
    }));
  });
  
  return result;
}
