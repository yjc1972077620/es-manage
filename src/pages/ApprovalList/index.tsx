/**
 * 审批列表页面
 * 展示所有审批申请，支持筛选和快速操作
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Select, Input, Statistic, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  mockApprovalRequests,
  generateApprovalStatistics,
  APPROVAL_TYPE_NAMES,
  APPROVAL_STATUS_NAMES,
  APPROVAL_PRIORITY_NAMES,
} from '@/services/approvalMockData';
import type { ApprovalRequest, ApprovalStatus, ApprovalRequestType } from '@/types';

const ApprovalList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [statistics, setStatistics] = useState<ReturnType<typeof generateApprovalStatistics> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setRequests([...mockApprovalRequests]);
      setStatistics(generateApprovalStatistics());
      setLoading(false);
    }, 300);
  }, []);

  // 状态颜色
  const getStatusColor = (status: ApprovalStatus) => {
    const colors: Record<string, string> = {
      pending: 'orange', approved: 'cyan', rejected: 'red',
      cancelled: 'default', processing: 'blue', completed: 'green', failed: 'red',
    };
    return colors[status] || 'default';
  };

  // 优先级颜色
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = { low: 'default', normal: 'blue', high: 'orange', urgent: 'red' };
    return colors[priority] || 'default';
  };

  // 筛选数据
  const filteredRequests = requests.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (typeFilter && r.type !== typeFilter) return false;
    if (searchText && !r.title.includes(searchText) && !r.applicant.includes(searchText)) return false;
    return true;
  });

  // 表格列
  const columns = [
    {
      title: '申请标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ApprovalRequest) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-400 text-xs">{record.id}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: ApprovalRequestType) => APPROVAL_TYPE_NAMES[type],
    },
    {
      title: '申请人',
      key: 'applicant',
      render: (_: unknown, record: ApprovalRequest) => (
        <div>
          <div>{record.applicant}</div>
          <div className="text-gray-400 text-xs">{record.applicantDept}</div>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{APPROVAL_PRIORITY_NAMES[priority]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ApprovalStatus) => (
        <Tag color={getStatusColor(status)}>{APPROVAL_STATUS_NAMES[status]}</Tag>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: ApprovalRequest, b: ApprovalRequest) => a.createdAt - b.createdAt,
      render: (time: number) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: ApprovalRequest) => (
        <Button type="link" icon={<Eye size={16} />} onClick={() => navigate(`/approvals/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">审批管理</h1>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/approvals/submit')}>
          提交申请
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="待审批" value={statistics?.pending || 0} prefix={<Clock size={16} className="text-orange-500" />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="处理中" value={statistics?.processing || 0} prefix={<FileText size={16} className="text-blue-500" />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="已通过" value={statistics?.approved || 0} prefix={<CheckCircle size={16} className="text-cyan-500" />} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="已驳回" value={statistics?.rejected || 0} prefix={<XCircle size={16} className="text-red-500" />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="已完成" value={statistics?.completed || 0} prefix={<CheckCircle size={16} className="text-green-500" />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="总计" value={statistics?.total || 0} />
          </Card>
        </Col>
      </Row>

      {/* 列表 */}
      <Card>
        <div className="mb-4 flex gap-4">
          <Input.Search placeholder="搜索标题或申请人" style={{ width: 200 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
          <Select placeholder="申请类型" allowClear style={{ width: 140 }} value={typeFilter || undefined} onChange={setTypeFilter}>
            {Object.entries(APPROVAL_TYPE_NAMES).map(([key, name]) => (
              <Select.Option key={key} value={key}>{name}</Select.Option>
            ))}
          </Select>
          <Select placeholder="状态" allowClear style={{ width: 120 }} value={statusFilter || undefined} onChange={setStatusFilter}>
            {Object.entries(APPROVAL_STATUS_NAMES).map(([key, name]) => (
              <Select.Option key={key} value={key}>{name}</Select.Option>
            ))}
          </Select>
        </div>
        <Table columns={columns} dataSource={filteredRequests} rowKey="id" loading={loading} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }} />
      </Card>
    </div>
  );
};

export default ApprovalList;
