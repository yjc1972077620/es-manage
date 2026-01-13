/**
 * 告警记录页面
 * 展示历史告警记录，支持筛选、确认、查看详情和跳转监控
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Select, DatePicker, message, Tooltip, Modal, Descriptions, Divider,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import {
  mockAlertRecords,
  ALERT_SEVERITY_NAMES,
  ALERT_STATUS_NAMES,
  ALERT_METRIC_NAMES,
  NOTIFICATION_CHANNEL_TYPE_NAMES,
} from '@/services/alertMockData';
import type { AlertRecord, AlertStatus } from '@/types';

const { RangePicker } = DatePicker;

// 计算持续时长
const formatDuration = (startTime: number, endTime?: number) => {
  const end = endTime || Date.now();
  const diff = end - startTime;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
};

const AlertRecords: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AlertRecord[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AlertRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  useEffect(() => {
    setTimeout(() => {
      setRecords([...mockAlertRecords]);
      setLoading(false);
    }, 300);
  }, []);

  // 确认告警
  const handleAcknowledge = (id: string) => {
    setRecords(records.map(r =>
      r.id === id ? { ...r, status: 'acknowledged' as AlertStatus, acknowledgedAt: Date.now(), acknowledgedBy: 'admin' } : r
    ));
    message.success('告警已确认');
  };

  // 查看详情
  const showDetail = (record: AlertRecord) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  // 跳转到监控页面
  const goToMonitor = (record: AlertRecord) => {
    if (record.target) {
      if (record.metric.startsWith('node_')) {
        navigate(`/nodes/${record.target}`);
      } else if (record.metric.startsWith('index_')) {
        navigate(`/indices/${record.target}`);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  // 筛选数据
  const filteredRecords = records.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (severityFilter && r.severity !== severityFilter) return false;
    return true;
  });

  // 颜色映射
  const getStatusColor = (status: string) => ({ firing: 'red', resolved: 'green', acknowledged: 'orange' }[status] || 'default');
  const getSeverityColor = (severity: string) => ({ critical: 'red', warning: 'orange', info: 'blue' }[severity] || 'default');

  // 表格列定义
  const columns = [
    {
      title: '告警名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (text: string, record: AlertRecord) => (
        <div>
          <Space>
            <Tag color={getSeverityColor(record.severity)}>{ALERT_SEVERITY_NAMES[record.severity]}</Tag>
            <span className="font-medium">{text}</span>
          </Space>
          {record.target && <div className="text-xs text-gray-400 mt-1">目标: {record.target}</div>}
        </div>
      ),
    },
    {
      title: '指标/值',
      key: 'metric',
      render: (_: unknown, record: AlertRecord) => (
        <div>
          <div>{ALERT_METRIC_NAMES[record.metric as keyof typeof ALERT_METRIC_NAMES]}</div>
          <div className="text-xs text-gray-500">{record.value} / {record.threshold}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{ALERT_STATUS_NAMES[status as keyof typeof ALERT_STATUS_NAMES]}</Tag>,
    },
    {
      title: '触发时间',
      dataIndex: 'firedAt',
      key: 'firedAt',
      width: 170,
      sorter: (a: AlertRecord, b: AlertRecord) => a.firedAt - b.firedAt,
      render: (time: number) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '持续时长',
      key: 'duration',
      width: 120,
      render: (_: unknown, record: AlertRecord) => (
        <Space>
          <Clock size={14} className="text-gray-400" />
          <span className={record.status === 'firing' ? 'text-red-500' : ''}>
            {formatDuration(record.firedAt, record.resolvedAt)}
          </span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: AlertRecord) => (
        <Space size="small">
          <Tooltip title="查看详情"><Button type="text" size="small" icon={<Eye size={14} />} onClick={() => showDetail(record)} /></Tooltip>
          <Tooltip title="查看监控"><Button type="text" size="small" icon={<ExternalLink size={14} />} onClick={() => goToMonitor(record)} /></Tooltip>
          {record.status === 'firing' && (
            <Tooltip title="确认告警"><Button type="text" size="small" icon={<CheckCircle size={14} />} onClick={() => handleAcknowledge(record.id)} /></Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">告警记录</h1>
        <Button icon={<RefreshCw size={16} />} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 300); }}>刷新</Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Select placeholder="告警状态" allowClear style={{ width: 120 }} value={statusFilter || undefined} onChange={setStatusFilter}>
            {Object.entries(ALERT_STATUS_NAMES).map(([key, name]) => <Select.Option key={key} value={key}>{name}</Select.Option>)}
          </Select>
          <Select placeholder="告警级别" allowClear style={{ width: 120 }} value={severityFilter || undefined} onChange={setSeverityFilter}>
            {Object.entries(ALERT_SEVERITY_NAMES).map(([key, name]) => <Select.Option key={key} value={key}>{name}</Select.Option>)}
          </Select>
          <RangePicker placeholder={['开始时间', '结束时间']} />
        </div>
        <Table columns={columns} dataSource={filteredRecords} rowKey="id" loading={loading} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }} size="middle" />
      </Card>

      {/* 详情弹窗 */}
      <Modal title="告警详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={
        <Space>
          <Button onClick={() => selectedRecord && goToMonitor(selectedRecord)} icon={<ExternalLink size={14} />}>查看监控</Button>
          <Button onClick={() => setDetailVisible(false)}>关闭</Button>
        </Space>
      } width={650}>
        {selectedRecord && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="告警名称" span={2}>{selectedRecord.ruleName}</Descriptions.Item>
              <Descriptions.Item label="告警级别"><Tag color={getSeverityColor(selectedRecord.severity)}>{ALERT_SEVERITY_NAMES[selectedRecord.severity]}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={getStatusColor(selectedRecord.status)}>{ALERT_STATUS_NAMES[selectedRecord.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="监控指标">{ALERT_METRIC_NAMES[selectedRecord.metric as keyof typeof ALERT_METRIC_NAMES]}</Descriptions.Item>
              <Descriptions.Item label="目标">{selectedRecord.target || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前值">{selectedRecord.value}</Descriptions.Item>
              <Descriptions.Item label="阈值">{selectedRecord.threshold}</Descriptions.Item>
              <Descriptions.Item label="告警消息" span={2}>{selectedRecord.message}</Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left" plain>时间信息</Divider>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="触发时间">{new Date(selectedRecord.firedAt).toLocaleString('zh-CN')}</Descriptions.Item>
              <Descriptions.Item label="持续时长"><span className={selectedRecord.status === 'firing' ? 'text-red-500 font-medium' : ''}>{formatDuration(selectedRecord.firedAt, selectedRecord.resolvedAt)}</span></Descriptions.Item>
              {selectedRecord.resolvedAt && <Descriptions.Item label="恢复时间" span={2}>{new Date(selectedRecord.resolvedAt).toLocaleString('zh-CN')}</Descriptions.Item>}
              {selectedRecord.acknowledgedAt && (
                <>
                  <Descriptions.Item label="确认时间">{new Date(selectedRecord.acknowledgedAt).toLocaleString('zh-CN')}</Descriptions.Item>
                  <Descriptions.Item label="确认人">{selectedRecord.acknowledgedBy}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Divider orientation="left" plain>通知记录</Divider>
            <div className="space-y-1">
              {selectedRecord.notificationsSent.map((n, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <Space>
                    <Tag color={n.success ? 'green' : 'red'}>{n.success ? '成功' : '失败'}</Tag>
                    <span>{NOTIFICATION_CHANNEL_TYPE_NAMES[n.channelType]}</span>
                  </Space>
                  <span className="text-xs text-gray-400">{new Date(n.sentAt).toLocaleString('zh-CN')}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AlertRecords;
