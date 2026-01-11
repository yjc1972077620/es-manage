/**
 * 节点详情页面
 * 展示单个节点的详细信息和监控数据
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Spin, Alert, Button, Tag, Row, Col, Progress, Statistic } from 'antd';
import { ArrowLeft, Cpu, MemoryStick, HardDrive, Activity } from 'lucide-react';
import { MetricChart, TimeRangeSelector } from '@/components';
import type { TimeRange } from '@/components';
import { fetchNodeStats, fetchNodeTimeSeries } from '@/services';
import { formatBytes, formatNumber, formatUptime } from '@/utils';
import { NODE_ROLE_TEXT, THREAD_POOL_NAMES, BREAKER_NAMES, CHART_COLORS } from '@/constants';
import type { NodeStats, TimeSeriesDataPoint } from '@/types';

const NodeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [nodeStats, setNodeStats] = useState<NodeStats | null>(null);
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesDataPoint[]>>({});
  
  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000,
    end: Date.now(),
    label: '最近1小时',
  });

  const nodeId = id || '';

  // 加载基础数据
  const loadBaseData = useCallback(async () => {
    if (!nodeId) return;
    
    try {
      setLoading(true);
      const allNodes = await fetchNodeStats();
      setNodeStats(allNodes[nodeId] || null);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  // 加载图表数据
  const loadChartData = useCallback(async () => {
    if (!nodeId) return;
    
    try {
      setChartLoading(true);
      const data = await fetchNodeTimeSeries(
        nodeId,
        [
          'cpu_percent',
          'heap_used_percent',
          'mem_used_percent',
          'disk_used_percent',
          'gc_young_count',
          'gc_old_count',
          'thread_pool_search_queue',
          'thread_pool_write_queue',
          'network_rx',
          'network_tx',
          'search_rate',
          'indexing_rate',
        ],
        timeRange.start,
        timeRange.end
      );
      setTimeSeries(data);
    } catch (error) {
      console.error('加载图表数据失败:', error);
    } finally {
      setChartLoading(false);
    }
  }, [nodeId, timeRange]);

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

  if (!nodeStats) {
    return <Alert type="error" message="节点不存在或加载失败" />;
  }

  const diskUsedPercent = Math.round(
    ((nodeStats.fs.total.total_in_bytes - nodeStats.fs.total.available_in_bytes) /
      nodeStats.fs.total.total_in_bytes) * 100
  );

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/nodes')}
          >
            返回
          </Button>
          <h1 className="text-xl font-semibold m-0">{nodeStats.name}</h1>
          <div className="flex gap-1">
            {nodeStats.roles.slice(0, 4).map(role => (
              <Tag key={role} color="blue">
                {NODE_ROLE_TEXT[role] || role}
              </Tag>
            ))}
            {nodeStats.roles.length > 4 && <Tag>+{nodeStats.roles.length - 4}</Tag>}
          </div>
        </div>
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          onRefresh={() => {
            loadBaseData();
            loadChartData();
          }}
        />
      </div>

      {/* 基本信息和资源概览 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="基本信息" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="节点名称">{nodeStats.name}</Descriptions.Item>
              <Descriptions.Item label="IP 地址">{nodeStats.ip}</Descriptions.Item>
              <Descriptions.Item label="传输地址">{nodeStats.transport_address}</Descriptions.Item>
              <Descriptions.Item label="版本">{nodeStats.version}</Descriptions.Item>
              <Descriptions.Item label="运行时间" span={2}>
                {formatUptime(nodeStats.jvm.uptime_in_millis)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="资源概览" size="small">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="CPU"
                  value={nodeStats.os.cpu.percent}
                  suffix="%"
                  prefix={<Cpu size={16} className="text-blue-500" />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="JVM 堆"
                  value={nodeStats.jvm.mem.heap_used_percent}
                  suffix="%"
                  prefix={<MemoryStick size={16} className="text-green-500" />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="磁盘"
                  value={diskUsedPercent}
                  suffix="%"
                  prefix={<HardDrive size={16} className="text-orange-500" />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="文档数"
                  value={nodeStats.indices.docs.count}
                  prefix={<Activity size={16} className="text-purple-500" />}
                  formatter={(val) => formatNumber(val as number)}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 资源使用仪表盘 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" title="CPU 使用率">
            <div className="text-center">
              <Progress
                type="dashboard"
                percent={nodeStats.os.cpu.percent}
                status={nodeStats.os.cpu.percent > 80 ? 'exception' : 'normal'}
              />
              <div className="text-xs text-gray-500 mt-1">
                负载: {nodeStats.os.cpu.load_average['1m'].toFixed(2)} / {nodeStats.os.cpu.load_average['5m'].toFixed(2)} / {nodeStats.os.cpu.load_average['15m'].toFixed(2)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" title="JVM 堆内存">
            <div className="text-center">
              <Progress
                type="dashboard"
                percent={nodeStats.jvm.mem.heap_used_percent}
                status={nodeStats.jvm.mem.heap_used_percent > 85 ? 'exception' : 'normal'}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formatBytes(nodeStats.jvm.mem.heap_used_in_bytes)} / {formatBytes(nodeStats.jvm.mem.heap_max_in_bytes)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" title="系统内存">
            <div className="text-center">
              <Progress
                type="dashboard"
                percent={nodeStats.os.mem.used_percent}
                status={nodeStats.os.mem.used_percent > 85 ? 'exception' : 'normal'}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formatBytes(nodeStats.os.mem.used_in_bytes)} / {formatBytes(nodeStats.os.mem.total_in_bytes)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" title="磁盘使用">
            <div className="text-center">
              <Progress
                type="dashboard"
                percent={diskUsedPercent}
                status={diskUsedPercent > 85 ? 'exception' : 'normal'}
              />
              <div className="text-xs text-gray-500 mt-1">
                可用: {formatBytes(nodeStats.fs.total.available_in_bytes)}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'charts',
              label: '性能图表',
              children: (
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
                        title="系统内存使用率"
                        data={timeSeries.mem_used_percent || []}
                        color={CHART_COLORS.warning}
                        unit="%"
                        yAxisDomain={[0, 100]}
                        height={200}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <MetricChart
                        title="磁盘使用率"
                        data={timeSeries.disk_used_percent || []}
                        color={CHART_COLORS.danger}
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
                        color={CHART_COLORS.primary}
                        unit="/s"
                        height={200}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <MetricChart
                        title="网络接收 (MB/s)"
                        data={timeSeries.network_rx || []}
                        color="#8884d8"
                        unit=""
                        height={200}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <MetricChart
                        title="网络发送 (MB/s)"
                        data={timeSeries.network_tx || []}
                        color="#82ca9d"
                        unit=""
                        height={200}
                      />
                    </Col>
                  </Row>
                </Spin>
              ),
            },
            {
              key: 'jvm',
              label: 'JVM 详情',
              children: (
                <div className="space-y-4">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card size="small" title="内存信息">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="堆内存使用">
                            {formatBytes(nodeStats.jvm.mem.heap_used_in_bytes)}
                          </Descriptions.Item>
                          <Descriptions.Item label="堆内存最大">
                            {formatBytes(nodeStats.jvm.mem.heap_max_in_bytes)}
                          </Descriptions.Item>
                          <Descriptions.Item label="非堆内存使用">
                            {formatBytes(nodeStats.jvm.mem.non_heap_used_in_bytes)}
                          </Descriptions.Item>
                          <Descriptions.Item label="线程数">
                            {nodeStats.jvm.threads.count} (峰值: {nodeStats.jvm.threads.peak_count})
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card size="small" title="GC 信息">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Young GC 次数">
                            {nodeStats.jvm.gc.collectors['G1 Young Generation']?.collection_count || 0}
                          </Descriptions.Item>
                          <Descriptions.Item label="Young GC 时间">
                            {nodeStats.jvm.gc.collectors['G1 Young Generation']?.collection_time_in_millis || 0}ms
                          </Descriptions.Item>
                          <Descriptions.Item label="Old GC 次数">
                            {nodeStats.jvm.gc.collectors['G1 Old Generation']?.collection_count || 0}
                          </Descriptions.Item>
                          <Descriptions.Item label="Old GC 时间">
                            {nodeStats.jvm.gc.collectors['G1 Old Generation']?.collection_time_in_millis || 0}ms
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>
                  <Spin spinning={chartLoading}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <MetricChart
                          title="Young GC 次数/分钟"
                          data={timeSeries.gc_young_count || []}
                          color={CHART_COLORS.primary}
                          unit=""
                          height={200}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <MetricChart
                          title="Old GC 次数/分钟"
                          data={timeSeries.gc_old_count || []}
                          color={CHART_COLORS.danger}
                          unit=""
                          height={200}
                        />
                      </Col>
                    </Row>
                  </Spin>
                </div>
              ),
            },
            {
              key: 'indices',
              label: '索引统计',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card size="small" title="文档统计">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="文档数">
                          {formatNumber(nodeStats.indices.docs.count)}
                        </Descriptions.Item>
                        <Descriptions.Item label="已删除文档">
                          {formatNumber(nodeStats.indices.docs.deleted)}
                        </Descriptions.Item>
                        <Descriptions.Item label="存储大小">
                          {formatBytes(nodeStats.indices.store.size_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="段数量">
                          {nodeStats.indices.segments.count}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title="索引操作">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="索引总数">
                          {formatNumber(nodeStats.indices.indexing.index_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="索引时间">
                          {formatNumber(nodeStats.indices.indexing.index_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="索引失败">
                          <span className={nodeStats.indices.indexing.index_failed > 0 ? 'text-red-500' : ''}>
                            {formatNumber(nodeStats.indices.indexing.index_failed)}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="删除总数">
                          {formatNumber(nodeStats.indices.indexing.delete_total)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title="搜索操作">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="查询总数">
                          {formatNumber(nodeStats.indices.search.query_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="查询时间">
                          {formatNumber(nodeStats.indices.search.query_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="获取总数">
                          {formatNumber(nodeStats.indices.search.fetch_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="滚动查询">
                          {formatNumber(nodeStats.indices.search.scroll_total)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'threadpool',
              label: '线程池',
              children: (
                <div className="space-y-4">
                  <Table
                    dataSource={Object.entries(nodeStats.thread_pool).map(([name, stats]) => ({
                      name,
                      ...stats,
                    }))}
                    columns={[
                      { 
                        title: '线程池', 
                        dataIndex: 'name', 
                        key: 'name',
                        render: (name: string) => THREAD_POOL_NAMES[name] || name,
                      },
                      { title: '线程数', dataIndex: 'threads', key: 'threads' },
                      { 
                        title: '队列', 
                        dataIndex: 'queue', 
                        key: 'queue',
                        render: (val: number) => (
                          <span className={val > 10 ? 'text-orange-500 font-medium' : ''}>{val}</span>
                        ),
                      },
                      { title: '活跃', dataIndex: 'active', key: 'active' },
                      { 
                        title: '拒绝', 
                        dataIndex: 'rejected', 
                        key: 'rejected',
                        render: (val: number) => (
                          <span className={val > 0 ? 'text-red-500 font-medium' : ''}>{val}</span>
                        ),
                      },
                      { 
                        title: '完成', 
                        dataIndex: 'completed', 
                        key: 'completed',
                        render: (val: number) => formatNumber(val),
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey="name"
                  />
                  <Spin spinning={chartLoading}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <MetricChart
                          title="搜索线程池队列"
                          data={timeSeries.thread_pool_search_queue || []}
                          color={CHART_COLORS.primary}
                          unit=""
                          height={200}
                        />
                      </Col>
                      <Col xs={24} md={12}>
                        <MetricChart
                          title="写入线程池队列"
                          data={timeSeries.thread_pool_write_queue || []}
                          color={CHART_COLORS.warning}
                          unit=""
                          height={200}
                        />
                      </Col>
                    </Row>
                  </Spin>
                </div>
              ),
            },
            {
              key: 'breakers',
              label: '断路器',
              children: (
                <Table
                  dataSource={Object.entries(nodeStats.breakers).map(([name, stats]) => ({
                    name,
                    ...stats,
                  }))}
                  columns={[
                    { 
                      title: '断路器', 
                      dataIndex: 'name', 
                      key: 'name',
                      render: (name: string) => BREAKER_NAMES[name] || name,
                    },
                    { title: '限制', dataIndex: 'limit_size', key: 'limit_size' },
                    { title: '估计使用', dataIndex: 'estimated_size', key: 'estimated_size' },
                    {
                      title: '使用率',
                      key: 'usage',
                      width: 200,
                      render: (_: unknown, record: { limit_size_in_bytes: number; estimated_size_in_bytes: number }) => {
                        const percent = Math.round((record.estimated_size_in_bytes / record.limit_size_in_bytes) * 100);
                        return (
                          <Progress
                            percent={percent}
                            size="small"
                            status={percent > 80 ? 'exception' : 'normal'}
                          />
                        );
                      },
                    },
                    { 
                      title: '触发次数', 
                      dataIndex: 'tripped', 
                      key: 'tripped',
                      render: (val: number) => (
                        <span className={val > 0 ? 'text-red-500 font-medium' : ''}>{val}</span>
                      ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="name"
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default NodeDetail;
