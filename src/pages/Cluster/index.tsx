/**
 * 集群信息页面
 * 展示集群详细统计信息
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Spin, Alert, Descriptions, Table, Tag, Progress } from 'antd';
import { StatusBadge, MetricChart, TimeRangeSelector } from '@/components';
import type { TimeRange } from '@/components';
import { fetchClusterStats, fetchClusterHealth, fetchMultipleTimeSeries } from '@/services';
import { formatBytes, formatNumber, formatUptime } from '@/utils';
import { CHART_COLORS } from '@/constants';
import type { ClusterStats, ClusterHealth, TimeSeriesDataPoint } from '@/types';

const Cluster: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesDataPoint[]>>({});
  
  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000,
    end: Date.now(),
    label: '最近1小时',
  });

  // 加载基础数据
  const loadBaseData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, healthData] = await Promise.all([
        fetchClusterStats(),
        fetchClusterHealth(),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载图表数据
  const loadChartData = useCallback(async () => {
    try {
      setChartLoading(true);
      const data = await fetchMultipleTimeSeries(
        ['cpu_percent', 'heap_used_percent', 'mem_used_percent', 'disk_used_percent', 'search_rate', 'indexing_rate'],
        timeRange.start,
        timeRange.end
      );
      setTimeSeries(data);
    } catch (error) {
      console.error('加载图表数据失败:', error);
    } finally {
      setChartLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!stats || !health) {
    return <Alert type="error" message="加载数据失败" />;
  }

  // 节点统计表格数据
  const nodeCountData = [
    { role: '总节点数', count: stats.nodes.count.total },
    { role: '数据节点', count: stats.nodes.count.data },
    { role: '主节点', count: stats.nodes.count.master },
    { role: '摄取节点', count: stats.nodes.count.ingest },
    { role: '协调节点', count: stats.nodes.count.coordinating_only },
    { role: '机器学习节点', count: stats.nodes.count.ml },
  ].filter(item => item.count > 0);

  // 字段类型统计
  const fieldTypeColumns = [
    { title: '字段类型', dataIndex: 'name', key: 'name' },
    { title: '字段数量', dataIndex: 'count', key: 'count' },
    { title: '索引数量', dataIndex: 'index_count', key: 'index_count' },
  ];

  // 计算资源使用百分比
  const heapPercent = Math.round((stats.nodes.jvm.mem.heap_used_in_bytes / stats.nodes.jvm.mem.heap_max_in_bytes) * 100);
  const memPercent = stats.nodes.os.mem.used_percent;
  const diskPercent = Math.round(((stats.nodes.fs.total_in_bytes - stats.nodes.fs.available_in_bytes) / stats.nodes.fs.total_in_bytes) * 100);

  return (
    <div className="space-y-6">
      {/* 时间范围选择器 */}
      <div className="flex justify-end">
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          onRefresh={() => {
            loadBaseData();
            loadChartData();
          }}
        />
      </div>

      {/* 集群基本信息 */}
      <Card title="集群基本信息">
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="集群名称">{stats.cluster_name}</Descriptions.Item>
          <Descriptions.Item label="集群 UUID">
            <span className="text-xs font-mono text-gray-500">{stats.cluster_uuid}</span>
          </Descriptions.Item>
          <Descriptions.Item label="集群状态">
            <StatusBadge status={stats.status} />
          </Descriptions.Item>
          <Descriptions.Item label="ES 版本">
            {stats.nodes.versions.join(', ')}
          </Descriptions.Item>
          <Descriptions.Item label="最长运行时间">
            {formatUptime(stats.nodes.jvm.max_uptime_in_millis)}
          </Descriptions.Item>
          <Descriptions.Item label="活跃分片百分比">
            <Progress 
              percent={health.active_shards_percent_as_number} 
              size="small"
              status={health.active_shards_percent_as_number < 100 ? 'exception' : 'success'}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 资源使用概览 */}
      <Card title="资源使用概览">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card size="small" title="CPU 使用率">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={stats.nodes.process.cpu.percent}
                  status={stats.nodes.process.cpu.percent > 80 ? 'exception' : 'normal'}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="JVM 堆内存">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={heapPercent}
                  status={heapPercent > 85 ? 'exception' : 'normal'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formatBytes(stats.nodes.jvm.mem.heap_used_in_bytes)} / {formatBytes(stats.nodes.jvm.mem.heap_max_in_bytes)}
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="系统内存">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={memPercent}
                  status={memPercent > 85 ? 'exception' : 'normal'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formatBytes(stats.nodes.os.mem.used_in_bytes)} / {formatBytes(stats.nodes.os.mem.total_in_bytes)}
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="磁盘空间">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={diskPercent}
                  status={diskPercent > 85 ? 'exception' : 'normal'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  可用: {formatBytes(stats.nodes.fs.available_in_bytes)}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 性能趋势图表 */}
      <Card title="性能趋势">
        <Spin spinning={chartLoading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <MetricChart
                title="CPU 使用率"
                data={timeSeries.cpu_percent || []}
                color={CHART_COLORS.primary}
                unit="%"
                yAxisDomain={[0, 100]}
                height={200}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="JVM 堆内存使用率"
                data={timeSeries.heap_used_percent || []}
                color={CHART_COLORS.success}
                unit="%"
                yAxisDomain={[0, 100]}
                height={200}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="搜索速率"
                data={timeSeries.search_rate || []}
                color={CHART_COLORS.info}
                unit="/s"
                height={200}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="索引速率"
                data={timeSeries.indexing_rate || []}
                color={CHART_COLORS.warning}
                unit="/s"
                height={200}
              />
            </Col>
          </Row>
        </Spin>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 节点统计 */}
        <Col xs={24} md={12}>
          <Card title="节点统计" className="h-full">
            <Table
              dataSource={nodeCountData}
              columns={[
                { title: '节点角色', dataIndex: 'role', key: 'role' },
                { 
                  title: '数量', 
                  dataIndex: 'count', 
                  key: 'count',
                  render: (count: number) => <span className="font-medium">{count}</span>,
                },
              ]}
              pagination={false}
              size="small"
              rowKey="role"
            />
          </Card>
        </Col>

        {/* 分片统计 */}
        <Col xs={24} md={12}>
          <Card title="分片统计" className="h-full">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="总分片数">
                <span className="font-medium">{formatNumber(stats.indices.shards.total)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="主分片数">
                <span className="font-medium">{formatNumber(stats.indices.shards.primaries)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="副本因子">
                {stats.indices.shards.replication}
              </Descriptions.Item>
              <Descriptions.Item label="活跃分片">
                <Tag color="green">{health.active_shards}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="未分配分片">
                <Tag color={health.unassigned_shards > 0 ? 'red' : 'green'}>
                  {health.unassigned_shards}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="迁移中分片">
                <Tag color={health.relocating_shards > 0 ? 'orange' : 'green'}>
                  {health.relocating_shards}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="初始化分片">
                <Tag color={health.initializing_shards > 0 ? 'orange' : 'green'}>
                  {health.initializing_shards}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="待处理任务">
                <Tag color={health.number_of_pending_tasks > 0 ? 'orange' : 'green'}>
                  {health.number_of_pending_tasks}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 索引统计 */}
      <Card title="索引统计">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Descriptions column={1} size="small" title="基本信息">
              <Descriptions.Item label="索引数量">
                <span className="font-medium">{formatNumber(stats.indices.count)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="文档总数">
                <span className="font-medium">{formatNumber(stats.indices.docs.count)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="已删除文档">
                {formatNumber(stats.indices.docs.deleted)}
              </Descriptions.Item>
              <Descriptions.Item label="存储大小">
                <span className="font-medium">{formatBytes(stats.indices.store.size_in_bytes)}</span>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={8}>
            <Descriptions column={1} size="small" title="缓存信息">
              <Descriptions.Item label="查询缓存">
                {formatBytes(stats.indices.query_cache.memory_size_in_bytes)}
              </Descriptions.Item>
              <Descriptions.Item label="查询缓存命中率">
                <Progress
                  percent={stats.indices.query_cache.total_count > 0
                    ? Math.round((stats.indices.query_cache.hit_count / stats.indices.query_cache.total_count) * 100)
                    : 0}
                  size="small"
                  status="active"
                />
              </Descriptions.Item>
              <Descriptions.Item label="字段数据缓存">
                {formatBytes(stats.indices.fielddata.memory_size_in_bytes)}
              </Descriptions.Item>
              <Descriptions.Item label="缓存驱逐">
                <span className={stats.indices.query_cache.evictions > 0 ? 'text-orange-500' : ''}>
                  {formatNumber(stats.indices.query_cache.evictions)}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={8}>
            <Descriptions column={1} size="small" title="段信息">
              <Descriptions.Item label="段数量">
                {formatNumber(stats.indices.segments.count)}
              </Descriptions.Item>
              <Descriptions.Item label="段内存">
                {formatBytes(stats.indices.segments.memory_in_bytes)}
              </Descriptions.Item>
              <Descriptions.Item label="词条内存">
                {formatBytes(stats.indices.segments.terms_memory_in_bytes)}
              </Descriptions.Item>
              <Descriptions.Item label="Doc Values 内存">
                {formatBytes(stats.indices.segments.doc_values_memory_in_bytes)}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* 字段类型统计 */}
      <Card title="字段类型统计">
        <Table
          dataSource={stats.indices.mappings.field_types}
          columns={fieldTypeColumns}
          pagination={false}
          size="small"
          rowKey="name"
        />
      </Card>
    </div>
  );
};

export default Cluster;
