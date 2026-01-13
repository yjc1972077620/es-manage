/**
 * 节点详情页面
 * 展示单个节点的详细信息和监控数据
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Spin, Alert, Button, Tag, Row, Col, Progress, Statistic } from 'antd';
import { ArrowLeft, MemoryStick, HardDrive, Activity } from 'lucide-react';
import { MetricChart, TimeRangeSelector } from '@/components';
import type { TimeRange } from '@/components';
import {
  fetchNodeDetail,
  fetchNodeTimeSeries,
  type KibanaNodeDetail,
  type TimeSeriesPoint,
} from '@/services/kibanaApi';
import { formatBytes, formatNumber } from '@/utils';
import { CHART_COLORS } from '@/constants';

const NodeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeDetail, setNodeDetail] = useState<KibanaNodeDetail | null>(null);
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesPoint[]>>({});

  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000,
    end: Date.now(),
    label: '最近1小时',
  });

  const nodeId = id || '';

  // 计算时间范围（分钟）
  const getMinutes = useCallback(() => {
    return Math.ceil((timeRange.end - timeRange.start) / 60000);
  }, [timeRange]);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!nodeId) return;

    try {
      setLoading(true);
      setError(null);
      const minutes = getMinutes();
      const [detail, timeSeriesData] = await Promise.all([
        fetchNodeDetail(nodeId, minutes),
        fetchNodeTimeSeries(nodeId, minutes),
      ]);
      setNodeDetail(detail);
      setTimeSeries(timeSeriesData);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  }, [nodeId, getMinutes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 转换时序数据格式
  const convertTimeSeries = (data: TimeSeriesPoint[] | undefined): { timestamp: number; value: number }[] => {
    if (!data) return [];
    return data.map(point => ({
      timestamp: point.timestamp,
      value: point.value,
    }));
  };

  // 从 Kibana 原始 metrics 数据提取时序数据
  const extractTimeSeriesFromMetrics = (
    metrics: KibanaNodeDetail['metrics'] | undefined,
    key: string
  ): { timestamp: number; value: number }[] => {
    if (!metrics) return [];
    const metricData = metrics[key];
    if (!metricData || !Array.isArray(metricData) || metricData.length === 0) return [];
    const firstMetric = metricData[0];
    if (!firstMetric?.data) return [];
    return firstMetric.data
      .filter(([, value]) => value !== null)
      .map(([timestamp, value]) => ({
        timestamp,
        value: value as number,
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !nodeDetail) {
    return <Alert type="error" message={error || '节点不存在或加载失败'} />;
  }

  const { nodeSummary, metrics } = nodeDetail;

  // 计算磁盘使用百分比
  const diskUsedPercent = nodeSummary.totalSpace > 0
    ? Math.round(((nodeSummary.totalSpace - nodeSummary.freeSpace) / nodeSummary.totalSpace) * 100)
    : 0;

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
          <h1 className="text-xl font-semibold m-0">{nodeSummary.name}</h1>
          <Tag color={nodeSummary.isOnline ? 'green' : 'red'}>
            {nodeSummary.isOnline ? '在线' : '离线'}
          </Tag>
          <Tag color="blue">{nodeSummary.nodeTypeLabel}</Tag>
        </div>
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          onRefresh={loadData}
          loading={loading}
        />
      </div>

      {/* 基本信息和资源概览 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="基本信息" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="节点名称">{nodeSummary.name}</Descriptions.Item>
              <Descriptions.Item label="传输地址">{nodeSummary.transport_address}</Descriptions.Item>
              <Descriptions.Item label="节点类型">{nodeSummary.type}</Descriptions.Item>
              <Descriptions.Item label="状态">{nodeSummary.status}</Descriptions.Item>
              <Descriptions.Item label="分片数">{nodeSummary.totalShards}</Descriptions.Item>
              <Descriptions.Item label="索引数">{nodeSummary.indexCount}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="资源概览" size="small">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="JVM 堆"
                  value={nodeSummary.usedHeap}
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
                  value={nodeSummary.documents}
                  prefix={<Activity size={16} className="text-purple-500" />}
                  formatter={(val) => formatNumber(val as number)}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="数据大小"
                  value={formatBytes(nodeSummary.dataSize)}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 资源使用仪表盘 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" title="JVM 堆内存">
            <div className="text-center">
              <Progress
                type="dashboard"
                percent={nodeSummary.usedHeap}
                status={nodeSummary.usedHeap > 85 ? 'exception' : 'normal'}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" title="磁盘使用">
            <div className="text-center">
              <Progress
                type="dashboard"
                percent={diskUsedPercent}
                status={diskUsedPercent > 85 ? 'exception' : 'normal'}
              />
              <div className="text-xs text-gray-500 mt-1">
                可用: {formatBytes(nodeSummary.freeSpace)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" title="分片统计">
            <div className="text-center py-4">
              <Statistic title="总分片数" value={nodeSummary.totalShards} />
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
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="CPU 使用率"
                      data={extractTimeSeriesFromMetrics(metrics, 'node_cpu_metric')}
                      color={CHART_COLORS.primary}
                      unit="%"
                      yAxisDomain={[0, 100]}
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="JVM 堆内存使用率"
                      data={extractTimeSeriesFromMetrics(metrics, 'node_jvm_mem')}
                      color={CHART_COLORS.success}
                      unit="%"
                      yAxisDomain={[0, 100]}
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="系统负载"
                      data={extractTimeSeriesFromMetrics(metrics, 'node_load_average')}
                      color={CHART_COLORS.warning}
                      unit=""
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="IO 操作"
                      data={extractTimeSeriesFromMetrics(metrics, 'node_total_io')}
                      color={CHART_COLORS.info}
                      unit=""
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="段数量"
                      data={extractTimeSeriesFromMetrics(metrics, 'node_segment_count')}
                      color={CHART_COLORS.danger}
                      unit=""
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="延迟"
                      data={extractTimeSeriesFromMetrics(metrics, 'node_latency')}
                      color="#8884d8"
                      unit="ms"
                      height={200}
                    />
                  </Col>
                </Row>
              ),
            },
            {
              key: 'timeseries',
              label: '转换后时序数据',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="CPU 使用率"
                      data={convertTimeSeries(timeSeries.cpu_percent)}
                      color={CHART_COLORS.primary}
                      unit="%"
                      yAxisDomain={[0, 100]}
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="JVM 堆内存使用率"
                      data={convertTimeSeries(timeSeries.heap_used_percent)}
                      color={CHART_COLORS.success}
                      unit="%"
                      yAxisDomain={[0, 100]}
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="系统负载"
                      data={convertTimeSeries(timeSeries.load_average)}
                      color={CHART_COLORS.warning}
                      unit=""
                      height={200}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <MetricChart
                      title="延迟"
                      data={convertTimeSeries(timeSeries.latency)}
                      color={CHART_COLORS.info}
                      unit="ms"
                      height={200}
                    />
                  </Col>
                </Row>
              ),
            },
            {
              key: 'summary',
              label: '节点摘要',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="存储信息">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="数据大小">
                          {formatBytes(nodeSummary.dataSize)}
                        </Descriptions.Item>
                        <Descriptions.Item label="可用空间">
                          {formatBytes(nodeSummary.freeSpace)}
                        </Descriptions.Item>
                        <Descriptions.Item label="总空间">
                          {formatBytes(nodeSummary.totalSpace)}
                        </Descriptions.Item>
                        <Descriptions.Item label="文档数量">
                          {formatNumber(nodeSummary.documents)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="索引信息">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="索引数量">
                          {nodeSummary.indexCount}
                        </Descriptions.Item>
                        <Descriptions.Item label="分片数量">
                          {nodeSummary.totalShards}
                        </Descriptions.Item>
                        <Descriptions.Item label="JVM 堆使用">
                          {nodeSummary.usedHeap}%
                        </Descriptions.Item>
                        <Descriptions.Item label="节点状态">
                          {nodeSummary.status}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default NodeDetail;
