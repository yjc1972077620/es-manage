/**
 * 索引管理页面
 * 展示所有索引列表
 */

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Space, Spin, Button, Tooltip, Row, Col, Statistic, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search, Eye, RefreshCw, Database, FileText, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components';
import { fetchIndices, formatBytes, formatNumber, type KibanaIndicesResponse, type KibanaIndexInfo } from '@/services/kibanaApi';

const Indices: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indicesResponse, setIndicesResponse] = useState<KibanaIndicesResponse | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showSystem, setShowSystem] = useState(false);

  useEffect(() => {
    loadData();
  }, [showSystem]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchIndices(60, 0, 1000, searchText, showSystem);
      setIndicesResponse(response);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    loadData();
  };

  if (loading && !indicesResponse) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error && !indicesResponse) {
    return <Alert type="error" message={error} />;
  }

  const indices = indicesResponse?.indices || [];
  const clusterStatus = indicesResponse?.clusterStatus;

  // 过滤索引（前端额外过滤）
  const filteredIndices = indices.filter(index => {
    if (searchText && !index.name.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 计算统计数据
  const stats = {
    total: filteredIndices.length,
    healthy: filteredIndices.filter(i => i.status === 'green').length,
    warning: filteredIndices.filter(i => i.status === 'yellow').length,
    unhealthy: filteredIndices.filter(i => i.status === 'red').length,
    totalDocs: filteredIndices.reduce((sum, i) => sum + (i.doc_count || 0), 0),
    totalSize: filteredIndices.reduce((sum, i) => sum + (i.data_size || 0), 0),
  };

  // 查看索引详情
  const handleViewIndex = (indexName: string) => {
    navigate(`/indices/${encodeURIComponent(indexName)}`);
  };

  // 表格列定义
  const columns: ColumnsType<KibanaIndexInfo> = [
    {
      title: '健康',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      fixed: 'left',
      render: (status) => <StatusBadge status={status} showText={false} size="small" />,
      filters: [
        { text: '健康', value: 'green' },
        { text: '警告', value: 'yellow' },
        { text: '异常', value: 'red' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '索引名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <Tooltip title={name}>
          <span 
            className={`${name.startsWith('.') ? 'text-gray-400' : 'font-medium text-blue-600 cursor-pointer hover:underline'}`}
            onClick={() => !name.startsWith('.') && handleViewIndex(name)}
          >
            {name.length > 50 ? `${name.substring(0, 50)}...` : name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '文档数',
      dataIndex: 'doc_count',
      key: 'doc_count',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.doc_count || 0) - (b.doc_count || 0),
      render: (count) => formatNumber(count || 0),
    },
    {
      title: '数据大小',
      dataIndex: 'data_size',
      key: 'data_size',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.data_size || 0) - (b.data_size || 0),
      render: (size) => <span className="font-medium">{formatBytes(size || 0)}</span>,
    },
    {
      title: '索引速率',
      dataIndex: 'index_rate',
      key: 'index_rate',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.index_rate || 0) - (b.index_rate || 0),
      render: (rate) => rate ? `${rate.toFixed(2)}/s` : '-',
    },
    {
      title: '搜索速率',
      dataIndex: 'search_rate',
      key: 'search_rate',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.search_rate || 0) - (b.search_rate || 0),
      render: (rate) => rate ? `${rate.toFixed(2)}/s` : '-',
    },
    {
      title: '未分配分片',
      dataIndex: 'unassigned_shards',
      key: 'unassigned_shards',
      width: 100,
      align: 'center',
      render: (count) => (
        <span className={count > 0 ? 'text-red-500 font-medium' : ''}>
          {count || 0}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => handleViewIndex(record.name)}
          icon={<Eye size={14} />}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="索引总数"
              value={stats.total}
              prefix={<Database size={20} className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="健康索引"
              value={stats.healthy}
              valueStyle={{ color: '#017D73' }}
              suffix={
                <span className="text-sm text-gray-400">
                  / {stats.warning} 警告 / {stats.unhealthy} 异常
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="文档总数"
              value={stats.totalDocs}
              prefix={<FileText size={20} className="text-green-500" />}
              formatter={(val) => formatNumber(val as number)}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总数据大小"
              value={formatBytes(stats.totalSize)}
              prefix={<HardDrive size={20} className="text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* 索引列表 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Input
              placeholder="搜索索引名称..."
              prefix={<Search size={16} className="text-gray-400" />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Button
              type={showSystem ? 'primary' : 'default'}
              onClick={() => setShowSystem(!showSystem)}
            >
              {showSystem ? '隐藏系统索引' : '显示系统索引'}
            </Button>
          </Space>
          <Space>
            <span className="text-gray-500">
              显示 {filteredIndices.length} / {indices.length} 个索引
            </span>
            <Button
              icon={<RefreshCw size={16} />}
              onClick={loadData}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          dataSource={filteredIndices}
          columns={columns}
          rowKey="name"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
          size="small"
          rowClassName={(record) => record.name.startsWith('.') ? 'bg-gray-50' : ''}
        />
      </Card>
    </div>
  );
};

export default Indices;
