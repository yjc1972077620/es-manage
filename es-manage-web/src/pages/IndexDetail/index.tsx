/**
 * 索引详情页面
 * 展示单个索引的详细信息
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Spin, Alert, Button, Tag, Row, Col, Statistic } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge, MetricChart, TimeRangeSelector } from '@/components';
import type { TimeRange } from '@/components';
import {
  fetchIndexDetail,
  fetchIndexTimeSeries,
  type IndexDetailResponse,
  type TimeSeriesPoint,
} from '@/services/kibanaApi';
import { formatBytes, formatNumber } from '@/utils';
import { CHART_COLORS } from '@/constants';

const IndexDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexDetail, setIndexDetail] = useState<IndexDetailResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesPoint[]>>({});

  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000,
    end: Date.now(),
    label: '最近1小时',
  });

  const decodedName = name ? decodeURIComponent(name) : '';

  // 计算时间范围（分钟）
  const getMinutes = useCallback(() => {
    return Math.ceil((timeRange.end - timeRange.start) / 60000);
  }, [timeRange]);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!decodedName) return;

    try {
      setLoading(true);
      setError(null);
      const minutes = getMinutes();
      const [detail, timeSeriesData] = await Promise.all([
        fetchIndexDetail(decodedName, minutes),
        fetchIndexTimeSeries(decodedName, minutes),
      ]);
      setIndexDetail(detail);
      setTimeSeries(timeSeriesData);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  }, [decodedName, getMinutes]);

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
    metrics: IndexDetailResponse['metrics'] | undefined,
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

  if (error || !indexDetail) {
    return <Alert type="error" message={error || '索引不存在或加载失败'} />;
  }

  const { indexSummary, metrics, shards } = indexDetail;

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/indices')}
          >
            返回
          </Button>
          <h1 className="text-xl font-semibold m-0 flex items-center gap-2">
            {decodedName}
            {indexSummary && <StatusBadge status={indexSummary.status as 'green' | 'yellow' | 'red'} size="small" />}
          </h1>
        </div>
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          onRefresh={loadData}
          loading={loading}
        />
      </div>

      {/* 基本信息卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="基本信息" size="small">
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
              <Descriptions.Item label="索引名称">{indexSummary.name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusBadge status={indexSummary.status as 'green' | 'yellow' | 'red'} />
              </Descriptions.Item>
              <Descriptions.Item label="主分片数">{indexSummary.primaries}</Descriptions.Item>
              <Descriptions.Item label="副本数">{indexSummary.replicas}</Descriptions.Item>
              <Descriptions.Item label="总分片数">{indexSummary.totalShards}</Descriptions.Item>
              <Descriptions.Item label="未分配分片">
                <span className={indexSummary.unassignedShards > 0 ? 'text-red-500 font-medium' : ''}>
                  {indexSummary.unassignedShards}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="存储统计" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="文档数"
                  value={indexSummary.documents}
                  formatter={(val) => formatNumber(val as number)}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="数据大小"
                  value={formatBytes(indexSummary.dataSize?.total || 0)}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 性能图表 */}
      <Card title="性能趋势">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <MetricChart
              title="搜索速率"
              data={convertTimeSeries(timeSeries.search_rate) || extractTimeSeriesFromMetrics(metrics, 'index_search_request_rate')}
              color={CHART_COLORS.primary}
              unit="/s"
              height={200}
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="索引速率"
              data={convertTimeSeries(timeSeries.indexing_rate) || extractTimeSeriesFromMetrics(metrics, 'index_request_rate')}
              color={CHART_COLORS.success}
              unit="/s"
              height={200}
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="文档数量"
              data={convertTimeSeries(timeSeries.doc_count) || extractTimeSeriesFromMetrics(metrics, 'index_document_count')}
              color={CHART_COLORS.warning}
              unit=""
              height={200}
            />
          </Col>
          <Col xs={24} md={12}>
            <MetricChart
              title="段数量"
              data={convertTimeSeries(timeSeries.segment_count) || extractTimeSeriesFromMetrics(metrics, 'index_segment_count')}
              color={CHART_COLORS.info}
              unit=""
              height={200}
            />
          </Col>
        </Row>
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'shards',
              label: '分片信息',
              children: shards && shards.length > 0 ? (
                <Table
                  dataSource={shards}
                  columns={[
                    {
                      title: '分片',
                      dataIndex: 'shard',
                      key: 'shard',
                      width: 80,
                    },
                    {
                      title: '类型',
                      dataIndex: 'primary',
                      key: 'primary',
                      width: 100,
                      render: (primary: boolean) => (
                        <Tag color={primary ? 'blue' : 'default'}>
                          {primary ? '主分片' : '副本'}
                        </Tag>
                      ),
                    },
                    {
                      title: '节点',
                      dataIndex: 'node',
                      key: 'node',
                    },
                    {
                      title: '状态',
                      dataIndex: 'state',
                      key: 'state',
                      render: (state: string) => (
                        <Tag color={state === 'STARTED' ? 'green' : state === 'RELOCATING' ? 'orange' : 'red'}>
                          {state}
                        </Tag>
                      ),
                    },
                    {
                      title: '迁移目标',
                      dataIndex: 'relocatingNode',
                      key: 'relocatingNode',
                      render: (node: string | null) => node || '-',
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey={(record) => `${record.shard}-${record.primary}`}
                />
              ) : (
                <Alert message="无分片信息" type="info" />
              ),
            },
            {
              key: 'metrics',
              label: '原始指标',
              children: metrics ? (
                <div className="space-y-4">
                  {Object.entries(metrics).map(([key, dataList]) => (
                    <Card key={key} size="small" title={key}>
                      <MetricChart
                        title=""
                        data={extractTimeSeriesFromMetrics(metrics, key)}
                        color={CHART_COLORS.primary}
                        unit=""
                        height={150}
                      />
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert message="无指标数据" type="info" />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default IndexDetail;
