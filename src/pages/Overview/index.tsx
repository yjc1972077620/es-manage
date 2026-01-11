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
import {
  fetchMonitoringOverview,
  fetchClusterHealth,
  fetchMultipleTimeSeries,
} from '@/services';
import { formatBytes, formatNumber } from '@/utils';
import type { MonitoringOverview, ClusterHealth, TimeSeriesDataPoint } from '@/types';
import { CHART_COLORS } from '@/constants';

const Overview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesDataPoint[]>>({});
  
  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000, // 默认最近1小时
    end: Date.now(),
    label: '最近1小时',
  });

  // 加载基础数据
  const loadBaseData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewData, healthData] = await Promise.all([
        fetchMonitoringOverview(),
        fetchClusterHealth(),
      ]);
      setOverview(overviewData);
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
      const timeSeriesData = await fetchMultipleTimeSeries(
        ['cpu_percent', 'heap_used_percent', 'search_rate', 'indexing_rate'],
        timeRange.start,
        timeRange.end
      );
      setTimeSeries(timeSeriesData);
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

  // 处理时间范围变化
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadBaseData();
    loadChartData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!overview || !health) {
    return <Alert type="error" message="加载数据失败" />;
  }

  return (
    <div className="space-y-6">
      {/* 集群状态概览 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold m-0">集群状态</h2>
            <StatusBadge status={overview.cluster.status} />
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
              value={formatBytes(overview.indices.store_size_bytes)}
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
              value={overview.os.cpu_percent}
              suffix="%"
              icon={<Cpu size={32} />}
              progress={overview.os.cpu_percent}
              progressStatus={overview.os.cpu_percent > 80 ? 'exception' : 'normal'}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatsCard
              title="JVM 堆内存"
              value={overview.jvm.heap_used_percent}
              suffix="%"
              icon={<MemoryStick size={32} />}
              progress={overview.jvm.heap_used_percent}
              progressStatus={overview.jvm.heap_used_percent > 85 ? 'exception' : 'normal'}
              tooltip={`已用: ${formatBytes(overview.jvm.heap_used_bytes)} / 最大: ${formatBytes(overview.jvm.heap_max_bytes)}`}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <StatsCard
              title="磁盘使用率"
              value={overview.fs.used_percent}
              suffix="%"
              icon={<HardDrive size={32} />}
              progress={overview.fs.used_percent}
              progressStatus={overview.fs.used_percent > 85 ? 'exception' : 'normal'}
              tooltip={`可用: ${formatBytes(overview.fs.available_bytes)} / 总计: ${formatBytes(overview.fs.total_bytes)}`}
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
          />
        }
      >
        <Spin spinning={chartLoading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <MetricChart
                title="CPU 使用率趋势"
                data={timeSeries.cpu_percent || []}
                color={CHART_COLORS.primary}
                unit="%"
                yAxisDomain={[0, 100]}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="JVM 堆内存使用率趋势"
                data={timeSeries.heap_used_percent || []}
                color={CHART_COLORS.success}
                unit="%"
                yAxisDomain={[0, 100]}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="搜索速率"
                data={timeSeries.search_rate || []}
                color={CHART_COLORS.info}
                unit="/s"
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="索引速率"
                data={timeSeries.indexing_rate || []}
                color={CHART_COLORS.warning}
                unit="/s"
              />
            </Col>
          </Row>
        </Spin>
      </Card>
    </div>
  );
};

export default Overview;
