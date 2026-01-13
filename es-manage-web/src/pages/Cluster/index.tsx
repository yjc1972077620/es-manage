/**
 * 集群信息页面
 * 展示集群详细统计信息
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Spin, Alert, Descriptions, Tag, Progress, Statistic } from 'antd';
import { StatusBadge, MetricChart, TimeRangeSelector } from '@/components';
import type { TimeRange } from '@/components';
import {
  fetchClusterOverview,
  fetchMonitoringOverview,
  type KibanaClusterOverview,
  type MonitoringOverviewResponse,
  type TimeSeriesPoint,
} from '@/services/kibanaApi';
import { formatBytes, formatNumber, formatUptime } from '@/utils';
import { CHART_COLORS } from '@/constants';

const Cluster: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clusterOverview, setClusterOverview] = useState<KibanaClusterOverview | null>(null);
  const [monitoringOverview, setMonitoringOverview] = useState<MonitoringOverviewResponse | null>(null);

  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000,
    end: Date.now(),
    label: '最近1小时',
  });

  // 计算时间范围（分钟）
  const getMinutes = useCallback(() => {
    return Math.ceil((timeRange.end - timeRange.start) / 60000);
  }, [timeRange]);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const minutes = getMinutes();
      const [clusterData, overviewData] = await Promise.all([
        fetchClusterOverview(minutes),
        fetchMonitoringOverview(minutes),
      ]);
      setClusterOverview(clusterData);
      setMonitoringOverview(overviewData);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  }, [getMinutes]);

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

  // 从 Kibana 原始数据提取时序数据
  const extractTimeSeriesFromKibana = (
    metrics: KibanaClusterOverview['metrics'] | undefined,
    key: string
  ): { timestamp: number; value: number }[] => {
    if (!metrics) return [];
    const metricData = metrics[key as keyof typeof metrics];
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

  if (error || !clusterOverview || !monitoringOverview) {
    return <Alert type="error" message={error || '加载数据失败'} />;
  }

  const { clusterStatus, metrics } = clusterOverview;

  return (
    <div className="space-y-6">
      {/* 时间范围选择器 */}
      <div className="flex justify-end">
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          onRefresh={loadData}
          loading={loading}
        />
      </div>

      {/* 集群基本信息 */}
      <Card title="集群基本信息">
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="集群名称">{monitoringOverview.cluster.name}</Descriptions.Item>
          <Descriptions.Item label="集群 UUID">
            <span className="text-xs font-mono text-gray-500">{monitoringOverview.cluster.uuid}</span>
          </Descriptions.Item>
          <Descriptions.Item label="集群状态">
            <StatusBadge status={clusterStatus.status} />
          </Descriptions.Item>
          <Descriptions.Item label="ES 版本">
            {clusterStatus.version?.join(', ') || monitoringOverview.cluster.version}
          </Descriptions.Item>
          <Descriptions.Item label="运行时间">
            {formatUptime(clusterStatus.upTime || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="节点数量">
            {clusterStatus.nodesCount}
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
                  percent={monitoringOverview.os.cpuPercent}
                  status={monitoringOverview.os.cpuPercent > 80 ? 'exception' : 'normal'}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="JVM 堆内存">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={monitoringOverview.jvm.heapUsedPercent}
                  status={monitoringOverview.jvm.heapUsedPercent > 85 ? 'exception' : 'normal'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formatBytes(monitoringOverview.jvm.heapUsedBytes)} / {formatBytes(monitoringOverview.jvm.heapMaxBytes)}
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="内存使用">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={monitoringOverview.os.memUsedPercent}
                  status={monitoringOverview.os.memUsedPercent > 85 ? 'exception' : 'normal'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formatBytes(clusterStatus.memUsed)} / {formatBytes(clusterStatus.memMax)}
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" title="磁盘空间">
              <div className="text-center">
                <Progress
                  type="dashboard"
                  percent={monitoringOverview.fs.usedPercent}
                  status={monitoringOverview.fs.usedPercent > 85 ? 'exception' : 'normal'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  可用: {formatBytes(monitoringOverview.fs.availableBytes)}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 性能趋势图表 */}
      <Card title="性能趋势">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <MetricChart
              title="搜索请求速率"
              data={extractTimeSeriesFromKibana(metrics, 'cluster_search_request_rate')}
              color={CHART_COLORS.info}
              unit="/s"
              height={200}
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="索引请求速率"
              data={extractTimeSeriesFromKibana(metrics, 'cluster_index_request_rate')}
              color={CHART_COLORS.warning}
              unit="/s"
              height={200}
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="查询延迟"
              data={extractTimeSeriesFromKibana(metrics, 'cluster_query_latency')}
              color={CHART_COLORS.primary}
              unit="ms"
              height={200}
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="索引延迟"
              data={extractTimeSeriesFromKibana(metrics, 'cluster_index_latency')}
              color={CHART_COLORS.success}
              unit="ms"
              height={200}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 节点统计 */}
        <Col xs={24} md={12}>
          <Card title="节点统计" className="h-full">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="节点总数" value={monitoringOverview.nodes.total} />
              </Col>
              <Col span={12}>
                <Statistic title="成功响应" value={monitoringOverview.nodes.successful} />
              </Col>
              <Col span={12}>
                <Statistic title="数据节点" value={monitoringOverview.nodes.data} />
              </Col>
              <Col span={12}>
                <Statistic title="主节点" value={monitoringOverview.nodes.master} />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 分片统计 */}
        <Col xs={24} md={12}>
          <Card title="分片统计" className="h-full">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="总分片数">
                <span className="font-medium">{formatNumber(clusterStatus.totalShards)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="主分片数">
                <span className="font-medium">{formatNumber(monitoringOverview.shards.primaries)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="活跃分片">
                <Tag color="green">{monitoringOverview.shards.total}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="未分配分片">
                <Tag color={clusterStatus.unassignedShards > 0 ? 'red' : 'green'}>
                  {clusterStatus.unassignedShards}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="迁移中分片">
                <Tag color={monitoringOverview.shards.relocating > 0 ? 'orange' : 'green'}>
                  {monitoringOverview.shards.relocating}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="初始化分片">
                <Tag color={monitoringOverview.shards.initializing > 0 ? 'orange' : 'green'}>
                  {monitoringOverview.shards.initializing}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 索引统计 */}
      <Card title="索引统计">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="索引数量"
              value={clusterStatus.indicesCount}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="文档总数"
              value={formatNumber(clusterStatus.documentCount)}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="数据大小"
              value={formatBytes(clusterStatus.dataSize)}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="运行时间"
              value={formatUptime(clusterStatus.upTime || 0)}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Cluster;
