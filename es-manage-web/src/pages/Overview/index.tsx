/**
 * 监控概览页面
 * 展示集群整体健康状态和关键指标
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Spin, Alert } from 'antd';
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Activity,
} from 'lucide-react';
import { StatsCard, StatusBadge, MetricChart, TimeRangeSelector } from '@/components';
import type { TimeRange } from '@/components';
import { fetchMonitoringOverview, type MonitoringOverviewResponse, type TimeSeriesPoint } from '@/services/kibanaApi';
import { formatBytes, formatNumber } from '@/utils';
import { CHART_COLORS } from '@/constants';

const Overview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<MonitoringOverviewResponse | null>(null);

  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000, // 默认最近1小时
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
      const data = await fetchMonitoringOverview(minutes);
      setOverview(data);
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

  // 处理时间范围变化
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadData();
  };

  // 转换时序数据格式
  const convertTimeSeries = (data: TimeSeriesPoint[] | undefined): { timestamp: number; value: number }[] => {
    if (!data) return [];
    return data.map(point => ({
      timestamp: point.timestamp,
      value: point.value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !overview) {
    return <Alert type="error" message={error || '加载数据失败'} />;
  }

  return (
    <div className="space-y-6">
      {/* 集群状态概览 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold m-0">集群状态</h2>
            <StatusBadge status={overview.cluster.status as 'green' | 'yellow' | 'red'} />
          </div>
          <div className="text-gray-500">
            集群名称: <span className="font-medium text-gray-800">{overview.cluster.name}</span>
            <span className="mx-2">|</span>
            版本: <span className="font-medium text-gray-800">{overview.cluster.version}</span>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <StatsCard
              title="节点数量"
              value={overview.nodes.total}
              suffix="个"
              icon={<Server size={32} />}
              tooltip={`数据节点: ${overview.nodes.data}, 主节点: ${overview.nodes.master}`}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatsCard
              title="索引数量"
              value={overview.indices.total}
              suffix="个"
              icon={<Database size={32} />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatsCard
              title="文档总数"
              value={formatNumber(overview.indices.docs)}
              icon={<Activity size={32} />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatsCard
              title="存储大小"
              value={formatBytes(overview.indices.storeSizeBytes)}
              icon={<HardDrive size={32} />}
            />
          </Col>
        </Row>
      </Card>

      {/* 分片状态 */}
      <Card title="分片状态">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <StatsCard
              title="活跃分片"
              value={overview.shards.total}
              valueStyle={{ color: CHART_COLORS.success }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <StatsCard
              title="主分片"
              value={overview.shards.primaries}
              valueStyle={{ color: CHART_COLORS.primary }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <StatsCard
              title="未分配分片"
              value={overview.shards.unassigned}
              valueStyle={{
                color: overview.shards.unassigned > 0 ? CHART_COLORS.danger : CHART_COLORS.success
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <StatsCard
              title="迁移中分片"
              value={overview.shards.relocating}
              valueStyle={{
                color: overview.shards.relocating > 0 ? CHART_COLORS.warning : CHART_COLORS.success
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* 资源使用情况 */}
      <Card title="资源使用">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <StatsCard
              title="CPU 使用率"
              value={overview.os.cpuPercent}
              suffix="%"
              icon={<Cpu size={32} />}
              progress={overview.os.cpuPercent}
              progressStatus={overview.os.cpuPercent > 80 ? 'exception' : 'normal'}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatsCard
              title="JVM 堆内存"
              value={overview.jvm.heapUsedPercent}
              suffix="%"
              icon={<MemoryStick size={32} />}
              progress={overview.jvm.heapUsedPercent}
              progressStatus={overview.jvm.heapUsedPercent > 85 ? 'exception' : 'normal'}
              tooltip={`已用: ${formatBytes(overview.jvm.heapUsedBytes)} / 最大: ${formatBytes(overview.jvm.heapMaxBytes)}`}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatsCard
              title="磁盘使用率"
              value={overview.fs.usedPercent}
              suffix="%"
              icon={<HardDrive size={32} />}
              progress={overview.fs.usedPercent}
              progressStatus={overview.fs.usedPercent > 85 ? 'exception' : 'normal'}
              tooltip={`可用: ${formatBytes(overview.fs.availableBytes)} / 总计: ${formatBytes(overview.fs.totalBytes)}`}
            />
          </Col>
        </Row>
      </Card>

      {/* 监控图表 - 带时间范围选择器 */}
      <Card
        title="性能趋势"
        extra={
          <TimeRangeSelector
            value={timeRange}
            onChange={handleTimeRangeChange}
            onRefresh={handleRefresh}
            loading={loading}
          />
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <MetricChart
              title="搜索速率"
              data={convertTimeSeries(overview.timeSeries?.search_rate)}
              color={CHART_COLORS.info}
              unit="/s"
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="索引速率"
              data={convertTimeSeries(overview.timeSeries?.indexing_rate)}
              color={CHART_COLORS.warning}
              unit="/s"
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="查询延迟"
              data={convertTimeSeries(overview.timeSeries?.query_latency)}
              color={CHART_COLORS.primary}
              unit="ms"
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="索引延迟"
              data={convertTimeSeries(overview.timeSeries?.index_latency)}
              color={CHART_COLORS.success}
              unit="ms"
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Overview;
