/**
 * 索引详情页面
 * 展示单个索引的详细信息
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Spin, Alert, Button, Tag, Row, Col, Progress, Statistic } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge, MetricChart, TimeRangeSelector } from '@/components';
import type { TimeRange } from '@/components';
import {
  fetchIndexStats,
  fetchIndexSettings,
  fetchIndexMapping,
  fetchIndexList,
  fetchIndexTimeSeries,
} from '@/services';
import { formatBytes, formatNumber, formatTimestamp } from '@/utils';
import { CHART_COLORS } from '@/constants';
import type { IndexStats, IndexSettings, IndexMapping, IndexInfo, TimeSeriesDataPoint } from '@/types';

const IndexDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [indexInfo, setIndexInfo] = useState<IndexInfo | null>(null);
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [settings, setSettings] = useState<IndexSettings | null>(null);
  const [mapping, setMapping] = useState<IndexMapping | null>(null);
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesDataPoint[]>>({});
  
  // 时间范围状态
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: Date.now() - 3600000,
    end: Date.now(),
    label: '最近1小时',
  });

  const decodedName = name ? decodeURIComponent(name) : '';

  // 加载基础数据
  const loadBaseData = useCallback(async () => {
    if (!decodedName) return;
    
    try {
      setLoading(true);
      const [indexList, statsData, settingsData, mappingData] = await Promise.all([
        fetchIndexList(),
        fetchIndexStats(decodedName),
        fetchIndexSettings(decodedName),
        fetchIndexMapping(decodedName),
      ]);
      
      const info = indexList.find(i => i.index === decodedName);
      setIndexInfo(info || null);
      setStats(statsData);
      setSettings(settingsData);
      setMapping(mappingData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [decodedName]);

  // 加载图表数据
  const loadChartData = useCallback(async () => {
    if (!decodedName) return;
    
    try {
      setChartLoading(true);
      const data = await fetchIndexTimeSeries(
        decodedName,
        [
          'search_rate',
          'indexing_rate',
          'query_latency',
          'doc_count',
          'segment_count',
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
  }, [decodedName, timeRange]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // 递归渲染映射属性
  const renderMappingProperties = (
    properties: Record<string, unknown>, 
    prefix = ''
  ): Array<{ key: string; field: string; type: string; analyzer?: string; properties?: string }> => {
    const result: Array<{ key: string; field: string; type: string; analyzer?: string; properties?: string }> = [];
    
    Object.entries(properties).forEach(([key, value]) => {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const prop = value as { 
        type?: string; 
        properties?: Record<string, unknown>;
        analyzer?: string;
        fields?: Record<string, unknown>;
      };
      
      if (prop.properties) {
        result.push({
          key: fieldName,
          field: fieldName,
          type: 'object',
          properties: Object.keys(prop.properties).join(', '),
        });
        result.push(...renderMappingProperties(prop.properties, fieldName));
      } else {
        result.push({
          key: fieldName,
          field: fieldName,
          type: prop.type || 'unknown',
          analyzer: prop.analyzer,
          properties: prop.fields ? `子字段: ${Object.keys(prop.fields).join(', ')}` : undefined,
        });
      }
    });
    
    return result;
  };

  // 计算缓存命中率
  const calculateHitRate = (hits: number, total: number): string => {
    if (total === 0) return '0%';
    return `${((hits / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!stats || !settings) {
    return <Alert type="error" message="索引不存在或加载失败" />;
  }

  const indexStats = stats._all.primaries;
  const totalStats = stats._all.total;

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
            {indexInfo && <StatusBadge status={indexInfo.health} size="small" />}
          </h1>
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

      {/* 基本信息卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="基本信息" size="small">
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
              <Descriptions.Item label="索引名称">{decodedName}</Descriptions.Item>
              <Descriptions.Item label="UUID">
                <span className="text-xs font-mono text-gray-500">{settings.index.uuid}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {indexInfo && <StatusBadge status={indexInfo.health} />}
              </Descriptions.Item>
              <Descriptions.Item label="主分片数">{settings.index.number_of_shards}</Descriptions.Item>
              <Descriptions.Item label="副本数">{settings.index.number_of_replicas}</Descriptions.Item>
              <Descriptions.Item label="刷新间隔">{settings.index.refresh_interval || '1s'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {settings.index.creation_date ? formatTimestamp(parseInt(settings.index.creation_date)) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="ES 版本">{settings.index.version?.created || '-'}</Descriptions.Item>
              <Descriptions.Item label="最大结果窗口">{settings.index.max_result_window || '10000'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="存储统计" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="文档数" 
                  value={indexStats.docs.count} 
                  formatter={(val) => formatNumber(val as number)}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="已删除" 
                  value={indexStats.docs.deleted}
                  formatter={(val) => formatNumber(val as number)}
                  valueStyle={{ color: indexStats.docs.deleted > 0 ? '#faad14' : undefined }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="主分片大小" 
                  value={formatBytes(indexStats.store.size_in_bytes)}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="总大小" 
                  value={formatBytes(totalStats.store.size_in_bytes)}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 性能图表 */}
      <Card title="性能趋势">
        <Spin spinning={chartLoading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <MetricChart
                title="搜索速率"
                data={timeSeries.search_rate || []}
                color={CHART_COLORS.primary}
                unit="/s"
                height={200}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="索引速率"
                data={timeSeries.indexing_rate || []}
                color={CHART_COLORS.success}
                unit="/s"
                height={200}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="查询延迟"
                data={timeSeries.query_latency || []}
                color={CHART_COLORS.warning}
                unit="ms"
                height={200}
              />
            </Col>
            <Col xs={24} md={12}>
              <MetricChart
                title="段数量"
                data={timeSeries.segment_count || []}
                color={CHART_COLORS.info}
                unit=""
                height={200}
              />
            </Col>
          </Row>
        </Spin>
      </Card>

      {/* 详细信息标签页 */}
      <Card>
        <Tabs
          items={[
            {
              key: 'stats',
              label: '详细统计',
              children: (
                <Row gutter={[16, 16]}>
                  {/* 索引操作 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="索引操作">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="索引总数">
                          {formatNumber(indexStats.indexing.index_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="索引时间">
                          {formatNumber(indexStats.indexing.index_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="平均索引时间">
                          {indexStats.indexing.index_total > 0 
                            ? `${(indexStats.indexing.index_time_in_millis / indexStats.indexing.index_total).toFixed(2)}ms`
                            : '0ms'}
                        </Descriptions.Item>
                        <Descriptions.Item label="索引失败">
                          <span className={indexStats.indexing.index_failed > 0 ? 'text-red-500 font-medium' : ''}>
                            {formatNumber(indexStats.indexing.index_failed)}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="删除总数">
                          {formatNumber(indexStats.indexing.delete_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="是否限流">
                          <Tag color={indexStats.indexing.is_throttled ? 'red' : 'green'}>
                            {indexStats.indexing.is_throttled ? '是' : '否'}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* 搜索操作 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="搜索操作">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="查询总数">
                          {formatNumber(indexStats.search.query_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="查询时间">
                          {formatNumber(indexStats.search.query_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="平均查询时间">
                          {indexStats.search.query_total > 0 
                            ? `${(indexStats.search.query_time_in_millis / indexStats.search.query_total).toFixed(2)}ms`
                            : '0ms'}
                        </Descriptions.Item>
                        <Descriptions.Item label="获取总数">
                          {formatNumber(indexStats.search.fetch_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="获取时间">
                          {formatNumber(indexStats.search.fetch_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="滚动查询">
                          {formatNumber(indexStats.search.scroll_total)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* GET 操作 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="GET 操作">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="GET 总数">
                          {formatNumber(indexStats.get.total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="GET 时间">
                          {formatNumber(indexStats.get.time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="存在的文档">
                          {formatNumber(indexStats.get.exists_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="缺失的文档">
                          {formatNumber(indexStats.get.missing_total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="命中率">
                          {calculateHitRate(indexStats.get.exists_total, indexStats.get.total)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* 合并操作 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="合并操作">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="合并总数">
                          {formatNumber(indexStats.merges.total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="合并时间">
                          {formatNumber(indexStats.merges.total_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="合并文档数">
                          {formatNumber(indexStats.merges.total_docs)}
                        </Descriptions.Item>
                        <Descriptions.Item label="合并大小">
                          {formatBytes(indexStats.merges.total_size_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="当前合并">
                          {indexStats.merges.current}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* 刷新和刷盘 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="刷新和刷盘">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="刷新总数">
                          {formatNumber(indexStats.refresh.total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="刷新时间">
                          {formatNumber(indexStats.refresh.total_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="刷盘总数">
                          {formatNumber(indexStats.flush.total)}
                        </Descriptions.Item>
                        <Descriptions.Item label="刷盘时间">
                          {formatNumber(indexStats.flush.total_time_in_millis)}ms
                        </Descriptions.Item>
                        <Descriptions.Item label="周期性刷盘">
                          {formatNumber(indexStats.flush.periodic)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* Translog */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="Translog">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="操作数">
                          {formatNumber(indexStats.translog.operations)}
                        </Descriptions.Item>
                        <Descriptions.Item label="大小">
                          {formatBytes(indexStats.translog.size_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="未提交操作">
                          {formatNumber(indexStats.translog.uncommitted_operations)}
                        </Descriptions.Item>
                        <Descriptions.Item label="未提交大小">
                          {formatBytes(indexStats.translog.uncommitted_size_in_bytes)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'cache',
              label: '缓存统计',
              children: (
                <Row gutter={[16, 16]}>
                  {/* 查询缓存 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="查询缓存">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="内存大小">
                          {formatBytes(indexStats.query_cache.memory_size_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="缓存条目">
                          {formatNumber(indexStats.query_cache.cache_size)}
                        </Descriptions.Item>
                        <Descriptions.Item label="命中次数">
                          {formatNumber(indexStats.query_cache.hit_count)}
                        </Descriptions.Item>
                        <Descriptions.Item label="未命中次数">
                          {formatNumber(indexStats.query_cache.miss_count)}
                        </Descriptions.Item>
                        <Descriptions.Item label="命中率">
                          <Progress
                            percent={parseFloat(calculateHitRate(
                              indexStats.query_cache.hit_count,
                              indexStats.query_cache.total_count
                            ))}
                            size="small"
                            status={
                              parseFloat(calculateHitRate(
                                indexStats.query_cache.hit_count,
                                indexStats.query_cache.total_count
                              )) > 80 ? 'success' : 'normal'
                            }
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="驱逐次数">
                          {formatNumber(indexStats.query_cache.evictions)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* 请求缓存 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="请求缓存">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="内存大小">
                          {formatBytes(indexStats.request_cache.memory_size_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="命中次数">
                          {formatNumber(indexStats.request_cache.hit_count)}
                        </Descriptions.Item>
                        <Descriptions.Item label="未命中次数">
                          {formatNumber(indexStats.request_cache.miss_count)}
                        </Descriptions.Item>
                        <Descriptions.Item label="命中率">
                          <Progress
                            percent={parseFloat(calculateHitRate(
                              indexStats.request_cache.hit_count,
                              indexStats.request_cache.hit_count + indexStats.request_cache.miss_count
                            ))}
                            size="small"
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="驱逐次数">
                          {formatNumber(indexStats.request_cache.evictions)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  {/* 字段数据 */}
                  <Col xs={24} md={8}>
                    <Card size="small" title="字段数据缓存">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="内存大小">
                          {formatBytes(indexStats.fielddata.memory_size_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="驱逐次数">
                          <span className={indexStats.fielddata.evictions > 0 ? 'text-orange-500' : ''}>
                            {formatNumber(indexStats.fielddata.evictions)}
                          </span>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'segments',
              label: '段信息',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="段统计">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="段数量">
                          {formatNumber(indexStats.segments.count)}
                        </Descriptions.Item>
                        <Descriptions.Item label="总内存">
                          {formatBytes(indexStats.segments.memory_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="词条内存">
                          {formatBytes(indexStats.segments.terms_memory_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="存储字段内存">
                          {formatBytes(indexStats.segments.stored_fields_memory_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Doc Values 内存">
                          {formatBytes(indexStats.segments.doc_values_memory_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Norms 内存">
                          {formatBytes(indexStats.segments.norms_memory_in_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Points 内存">
                          {formatBytes(indexStats.segments.points_memory_in_bytes)}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="内存分布">
                      <div className="space-y-3">
                        {[
                          { label: '词条', value: indexStats.segments.terms_memory_in_bytes, color: CHART_COLORS.primary },
                          { label: 'Doc Values', value: indexStats.segments.doc_values_memory_in_bytes, color: CHART_COLORS.success },
                          { label: '存储字段', value: indexStats.segments.stored_fields_memory_in_bytes, color: CHART_COLORS.warning },
                          { label: 'Norms', value: indexStats.segments.norms_memory_in_bytes, color: CHART_COLORS.info },
                          { label: 'Points', value: indexStats.segments.points_memory_in_bytes, color: CHART_COLORS.danger },
                        ].map(item => (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.label}</span>
                              <span>{formatBytes(item.value)}</span>
                            </div>
                            <Progress
                              percent={indexStats.segments.memory_in_bytes > 0 
                                ? Math.round((item.value / indexStats.segments.memory_in_bytes) * 100)
                                : 0}
                              strokeColor={item.color}
                              showInfo={false}
                              size="small"
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'mapping',
              label: '字段映射',
              children: mapping ? (
                <Table
                  dataSource={renderMappingProperties(mapping.mappings.properties)}
                  columns={[
                    { 
                      title: '字段名', 
                      dataIndex: 'field', 
                      key: 'field',
                      render: (field: string) => (
                        <span className="font-mono text-sm">{field}</span>
                      ),
                    },
                    { 
                      title: '类型', 
                      dataIndex: 'type', 
                      key: 'type',
                      render: (type: string) => <Tag color="blue">{type}</Tag>,
                      filters: [
                        { text: 'keyword', value: 'keyword' },
                        { text: 'text', value: 'text' },
                        { text: 'long', value: 'long' },
                        { text: 'date', value: 'date' },
                        { text: 'object', value: 'object' },
                        { text: 'boolean', value: 'boolean' },
                      ],
                      onFilter: (value, record) => record.type === value,
                    },
                    { 
                      title: '分析器', 
                      dataIndex: 'analyzer', 
                      key: 'analyzer',
                      render: (analyzer: string) => analyzer ? <Tag>{analyzer}</Tag> : '-',
                    },
                    { title: '备注', dataIndex: 'properties', key: 'properties' },
                  ]}
                  pagination={{ pageSize: 20, showSizeChanger: true }}
                  size="small"
                  rowKey="key"
                />
              ) : (
                <Alert message="无映射信息" type="info" />
              ),
            },
            {
              key: 'settings',
              label: '索引设置',
              children: (
                <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-[500px] text-sm">
                  {JSON.stringify(settings, null, 2)}
                </pre>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default IndexDetail;
