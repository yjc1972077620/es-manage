/**
 * 索引管理页面
 * 展示所有索引列表
 */

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Space, Spin, Button, Tooltip, Row, Col, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search, Eye, RefreshCw, Database, FileText, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components';
import { fetchIndexList } from '@/services';
import { formatNumber, formatTimestamp } from '@/utils';
import type { IndexInfo } from '@/types';

const Indices: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showSystem, setShowSystem] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchIndexList();
      setIndices(data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤索引
  const filteredIndices = indices.filter(index => {
    // 搜索过滤
    if (searchText && !index.index.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    // 系统索引过滤
    if (!showSystem && index.index.startsWith('.')) {
      return false;
    }
    return true;
  });

  // 计算统计数据
  const stats = {
    total: filteredIndices.length,
    healthy: filteredIndices.filter(i => i.health === 'green').length,
    warning: filteredIndices.filter(i => i.health === 'yellow').length,
    unhealthy: filteredIndices.filter(i => i.health === 'red').length,
    totalDocs: filteredIndices.reduce((sum, i) => sum + i['docs.count'], 0),
    totalShards: filteredIndices.reduce((sum, i) => sum + i.pri * (1 + i.rep), 0),
  };

  // 查看索引详情
  const handleViewIndex = (indexName: string) => {
    navigate(`/indices/${encodeURIComponent(indexName)}`);
  };

  // 解析大小字符串为字节数（用于排序）
  const parseSize = (s: string): number => {
    const num = parseFloat(s);
    if (s.includes('gb')) return num * 1024 * 1024 * 1024;
    if (s.includes('mb')) return num * 1024 * 1024;
    if (s.includes('kb')) return num * 1024;
    return num;
  };

  // 表格列定义
  const columns: ColumnsType<IndexInfo> = [
    {
      title: '健康',
      dataIndex: 'health',
      key: 'health',
      width: 70,
      fixed: 'left',
      render: (health) => <StatusBadge status={health} showText={false} size="small" />,
      filters: [
        { text: '健康', value: 'green' },
        { text: '警告', value: 'yellow' },
        { text: '异常', value: 'red' },
      ],
      onFilter: (value, record) => record.health === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (status) => (
        <Tag color={status === 'open' ? 'green' : 'default'}>
          {status === 'open' ? '开启' : '关闭'}
        </Tag>
      ),
      filters: [
        { text: '开启', value: 'open' },
        { text: '关闭', value: 'close' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '索引名称',
      dataIndex: 'index',
      key: 'index',
      fixed: 'left',
      sorter: (a, b) => a.index.localeCompare(b.index),
      render: (name: string) => (
        <Tooltip title={name}>
          <span 
            className={`${name.startsWith('.') ? 'text-gray-400' : 'font-medium text-blue-600 cursor-pointer hover:underline'}`}
            onClick={() => !name.startsWith('.') && handleViewIndex(name)}
          >
            {name.length > 40 ? `${name.substring(0, 40)}...` : name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '主分片',
      dataIndex: 'pri',
      key: 'pri',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.pri - b.pri,
    },
    {
      title: '副本',
      dataIndex: 'rep',
      key: 'rep',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.rep - b.rep,
    },
    {
      title: '文档数',
      dataIndex: 'docs.count',
      key: 'docs',
      width: 120,
      align: 'right',
      sorter: (a, b) => a['docs.count'] - b['docs.count'],
      render: (count) => formatNumber(count),
    },
    {
      title: '已删除',
      dataIndex: 'docs.deleted',
      key: 'deleted',
      width: 100,
      align: 'right',
      render: (count, record) => {
        const percent = record['docs.count'] > 0 
          ? (count / record['docs.count'] * 100).toFixed(1)
          : 0;
        return (
          <Tooltip title={`${percent}% 已删除`}>
            <span className={parseFloat(String(percent)) > 10 ? 'text-orange-500' : ''}>
              {formatNumber(count)}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '主分片大小',
      dataIndex: 'pri.store.size',
      key: 'priSize',
      width: 110,
      align: 'right',
      sorter: (a, b) => parseSize(a['pri.store.size']) - parseSize(b['pri.store.size']),
    },
    {
      title: '总大小',
      dataIndex: 'store.size',
      key: 'size',
      width: 100,
      align: 'right',
      sorter: (a, b) => parseSize(a['store.size']) - parseSize(b['store.size']),
      render: (size) => <span className="font-medium">{size}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'creation_date',
      key: 'creation_date',
      width: 170,
      render: (date) => date ? formatTimestamp(date) : '-',
      sorter: (a, b) => (a.creation_date || 0) - (b.creation_date || 0),
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
          onClick={() => handleViewIndex(record.index)}
          icon={<Eye size={14} />}
        >
          详情
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

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
              title="分片总数"
              value={stats.totalShards}
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
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          dataSource={filteredIndices}
          columns={columns}
          rowKey="uuid"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1400 }}
          size="small"
          rowClassName={(record) => record.index.startsWith('.') ? 'bg-gray-50' : ''}
        />
      </Card>
    </div>
  );
};

export default Indices;
