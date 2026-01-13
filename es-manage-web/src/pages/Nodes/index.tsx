/**
 * 节点管理页面
 * 展示所有节点列表
 */

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, Spin, Row, Col, Statistic, Button, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Star, Eye, RefreshCw, Server, Cpu, MemoryStick } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchNodes, type KibanaNodesResponse, type KibanaNodeInfo } from '@/services/kibanaApi';
import { formatBytes, formatNumber } from '@/utils';
import { NODE_ROLE_TEXT } from '@/constants';

const Nodes: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodesResponse, setNodesResponse] = useState<KibanaNodesResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchNodes(60, 0, 100);
      setNodesResponse(response);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  };

  // 查看节点详情
  const handleViewNode = (nodeId: string) => {
    navigate(`/nodes/${nodeId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !nodesResponse) {
    return <Alert type="error" message={error || '加载数据失败'} />;
  }

  const { nodes, clusterStatus } = nodesResponse;

  // 计算统计数据
  const stats = {
    total: nodes.length,
    master: nodes.filter(n => n.roles?.includes('master')).length,
    data: nodes.filter(n => n.roles?.includes('data')).length,
    avgCpu: nodes.length > 0 
      ? Math.round(nodes.reduce((sum, n) => sum + (n.node_cpu_utilization?.summary?.lastVal || 0), 0) / nodes.length)
      : 0,
    avgHeap: nodes.length > 0
      ? Math.round(nodes.reduce((sum, n) => sum + (n.node_jvm_mem_percent?.summary?.lastVal || 0), 0) / nodes.length)
      : 0,
  };

  // 表格列定义
  const columns: ColumnsType<KibanaNodeInfo> = [
    {
      title: '节点名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      render: (name: string, record) => (
        <div className="flex items-center gap-2">
          {record.type === 'master' && (
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
          )}
          <span 
            className="font-medium text-blue-600 cursor-pointer hover:underline"
            onClick={() => handleViewNode(record.uuid)}
          >
            {name}
          </span>
        </div>
      ),
    },
    {
      title: '传输地址',
      dataIndex: 'transport_address',
      key: 'transport_address',
    },
    {
      title: '状态',
      dataIndex: 'isOnline',
      key: 'isOnline',
      width: 80,
      render: (isOnline: boolean) => (
        <Tag color={isOnline ? 'green' : 'red'}>
          {isOnline ? '在线' : '离线'}
        </Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <div className="flex flex-wrap gap-1">
          {roles?.slice(0, 3).map(role => (
            <Tag key={role} color="blue">
              {NODE_ROLE_TEXT[role] || role}
            </Tag>
          ))}
          {roles && roles.length > 3 && (
            <Tag>+{roles.length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'CPU',
      key: 'cpu',
      width: 120,
      render: (_, record) => {
        const percent = record.node_cpu_utilization?.summary?.lastVal;
        if (percent === undefined || percent === null) return '-';
        const value = Math.round(percent);
        return (
          <Progress
            percent={value}
            size="small"
            status={value > 80 ? 'exception' : 'normal'}
            format={p => `${p}%`}
          />
        );
      },
    },
    {
      title: 'JVM 堆内存',
      key: 'heap',
      width: 120,
      render: (_, record) => {
        const percent = record.node_jvm_mem_percent?.summary?.lastVal;
        if (percent === undefined || percent === null) return '-';
        const value = Math.round(percent);
        return (
          <Progress
            percent={value}
            size="small"
            status={value > 85 ? 'exception' : 'normal'}
            format={p => `${p}%`}
          />
        );
      },
    },
    {
      title: '系统负载',
      key: 'load',
      width: 100,
      render: (_, record) => {
        const load = record.node_load_average?.summary?.lastVal;
        if (load === undefined || load === null) return '-';
        return load.toFixed(2);
      },
    },
    {
      title: '磁盘可用',
      key: 'disk',
      width: 100,
      align: 'right',
      render: (_, record) => {
        const freeSpace = record.node_free_space?.summary?.lastVal;
        if (freeSpace === undefined || freeSpace === null) return '-';
        return formatBytes(freeSpace);
      },
    },
    {
      title: '分片数',
      dataIndex: 'shardCount',
      key: 'shardCount',
      width: 80,
      align: 'center',
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
          onClick={() => handleViewNode(record.uuid)}
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
              title="节点总数"
              value={stats.total}
              prefix={<Server size={20} className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="主节点 / 数据节点"
              value={stats.master}
              suffix={`/ ${stats.data}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="平均 CPU"
              value={stats.avgCpu}
              suffix="%"
              prefix={<Cpu size={20} className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="平均 JVM 堆"
              value={stats.avgHeap}
              suffix="%"
              prefix={<MemoryStick size={20} className="text-orange-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* 集群状态信息 */}
      {clusterStatus && (
        <Card size="small">
          <Row gutter={16}>
            <Col span={4}>
              <Statistic 
                title="集群状态" 
                value={clusterStatus.status?.toUpperCase()} 
                valueStyle={{ 
                  color: clusterStatus.status === 'green' ? '#52c41a' : 
                         clusterStatus.status === 'yellow' ? '#faad14' : '#ff4d4f' 
                }}
              />
            </Col>
            <Col span={4}>
              <Statistic title="索引数" value={clusterStatus.indicesCount} />
            </Col>
            <Col span={4}>
              <Statistic title="文档数" value={formatNumber(clusterStatus.documentCount)} />
            </Col>
            <Col span={4}>
              <Statistic title="数据大小" value={formatBytes(clusterStatus.dataSize)} />
            </Col>
            <Col span={4}>
              <Statistic title="总分片" value={clusterStatus.totalShards} />
            </Col>
            <Col span={4}>
              <Statistic 
                title="未分配分片" 
                value={clusterStatus.unassignedShards}
                valueStyle={{ color: clusterStatus.unassignedShards > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 节点列表 */}
      <Card 
        title={`节点列表 (${nodes.length})`}
        extra={
          <Button icon={<RefreshCw size={16} />} onClick={loadData}>
            刷新
          </Button>
        }
      >
        <Table
          dataSource={nodes}
          columns={columns}
          rowKey="uuid"
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default Nodes;
