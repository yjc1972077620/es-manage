/**
 * 节点管理页面
 * 展示所有节点列表
 */

import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Progress, Spin, Row, Col, Statistic, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Star, Eye, RefreshCw, Server, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchNodeStats, fetchNodeList } from '@/services';
import { formatBytes, formatNumber } from '@/utils';
import { NODE_ROLE_TEXT } from '@/constants';
import type { NodeStats } from '@/types';

interface NodeListItem {
  id: string;
  name: string;
  ip: string;
  isMaster: boolean;
  isCurrentMaster: boolean;
  roles: string[];
  version: string;
}

const Nodes: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nodeList, setNodeList] = useState<NodeListItem[]>([]);
  const [nodeStats, setNodeStats] = useState<Record<string, NodeStats>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, stats] = await Promise.all([
        fetchNodeList(),
        fetchNodeStats(),
      ]);
      setNodeList(list);
      setNodeStats(stats);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 查看节点详情
  const handleViewNode = (nodeId: string) => {
    navigate(`/nodes/${nodeId}`);
  };

  // 计算统计数据
  const stats = {
    total: nodeList.length,
    master: nodeList.filter(n => n.roles.includes('master')).length,
    data: nodeList.filter(n => n.roles.includes('data')).length,
    avgCpu: nodeList.length > 0 
      ? Math.round(nodeList.reduce((sum, n) => sum + (nodeStats[n.id]?.os.cpu.percent || 0), 0) / nodeList.length)
      : 0,
    avgHeap: nodeList.length > 0
      ? Math.round(nodeList.reduce((sum, n) => sum + (nodeStats[n.id]?.jvm.mem.heap_used_percent || 0), 0) / nodeList.length)
      : 0,
  };

  // 表格列定义
  const columns: ColumnsType<NodeListItem> = [
    {
      title: '节点名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      render: (name: string, record) => (
        <div className="flex items-center gap-2">
          {record.isCurrentMaster && (
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
          )}
          <span 
            className="font-medium text-blue-600 cursor-pointer hover:underline"
            onClick={() => handleViewNode(record.id)}
          >
            {name}
          </span>
        </div>
      ),
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <div className="flex flex-wrap gap-1">
          {roles.slice(0, 3).map(role => (
            <Tag key={role} color="blue">
              {NODE_ROLE_TEXT[role] || role}
            </Tag>
          ))}
          {roles.length > 3 && (
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
        const stats = nodeStats[record.id];
        if (!stats) return '-';
        const percent = stats.os.cpu.percent;
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent > 80 ? 'exception' : 'normal'}
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
        const stats = nodeStats[record.id];
        if (!stats) return '-';
        const percent = stats.jvm.mem.heap_used_percent;
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent > 85 ? 'exception' : 'normal'}
            format={p => `${p}%`}
          />
        );
      },
    },
    {
      title: '磁盘',
      key: 'disk',
      width: 120,
      render: (_, record) => {
        const stats = nodeStats[record.id];
        if (!stats) return '-';
        const used = stats.fs.total.total_in_bytes - stats.fs.total.available_in_bytes;
        const percent = Math.round((used / stats.fs.total.total_in_bytes) * 100);
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent > 85 ? 'exception' : 'normal'}
            format={p => `${p}%`}
          />
        );
      },
    },
    {
      title: '文档数',
      key: 'docs',
      align: 'right',
      render: (_, record) => {
        const stats = nodeStats[record.id];
        if (!stats) return '-';
        return formatNumber(stats.indices.docs.count);
      },
    },
    {
      title: '存储大小',
      key: 'store',
      align: 'right',
      render: (_, record) => {
        const stats = nodeStats[record.id];
        if (!stats) return '-';
        return formatBytes(stats.indices.store.size_in_bytes);
      },
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
          onClick={() => handleViewNode(record.id)}
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

      {/* 节点列表 */}
      <Card 
        title={`节点列表 (${nodeList.length})`}
        extra={
          <Button icon={<RefreshCw size={16} />} onClick={loadData}>
            刷新
          </Button>
        }
      >
        <Table
          dataSource={nodeList}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default Nodes;
