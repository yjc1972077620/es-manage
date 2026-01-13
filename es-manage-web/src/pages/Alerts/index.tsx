/**
 * 告警概览页面
 * 展示告警统计、最近告警、告警趋势
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Statistic, Button, Space, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Line } from '@ant-design/charts';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Settings,
  List,
  Send,
} from 'lucide-react';
import {
  mockAlertRecords,
  generateAlertStatistics,
  ALERT_SEVERITY_NAMES,
  ALERT_STATUS_NAMES,
  ALERT_METRIC_NAMES,
} from '@/services/alertMockData';
import type { AlertRecord, AlertStatistics } from '@/types';

const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertRecord[]>([]);

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setStatistics(generateAlertStatistics());
      setRecentAlerts(mockAlertRecords.slice(0, 5));
      setLoading(false);
    }, 300);
  }, []);

  // 告警状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'firing': return 'red';
      case 'resolved': return 'green';
      case 'acknowledged': return 'orange';
      default: return 'default';
    }
  };

  // 告警级别颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'default';
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '告警名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (text: string, record: AlertRecord) => (
        <Space>
          <Tag color={getSeverityColor(record.severity)}>
            {ALERT_SEVERITY_NAMES[record.severity]}
          </Tag>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '指标',
      dataIndex: 'metric',
      key: 'metric',
      render: (metric: string) => ALERT_METRIC_NAMES[metric as keyof typeof ALERT_METRIC_NAMES] || metric,
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
      render: (target: string) => target || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {ALERT_STATUS_NAMES[status as keyof typeof ALERT_STATUS_NAMES]}
        </Tag>
      ),
    },
    {
      title: '触发时间',
      dataIndex: 'firedAt',
      key: 'firedAt',
      render: (time: number) => new Date(time).toLocaleString('zh-CN'),
    },
  ];

  // 趋势图配置
  const trendConfig = {
    data: statistics?.recentTrend.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      count: item.count,
    })) || [],
    xField: 'time',
    yField: 'count',
    smooth: true,
    height: 200,
    color: '#ff4d4f',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 1:#ff4d4f20',
    },
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">告警中心</h1>
        <Space>
          <Button icon={<List size={16} />} onClick={() => navigate('/alert-rules')}>
            告警规则
          </Button>
          <Button icon={<Clock size={16} />} onClick={() => navigate('/alert-records')}>
            告警记录
          </Button>
          <Button icon={<Send size={16} />} onClick={() => navigate('/notification-channels')}>
            通知渠道
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="触发中告警"
              value={statistics?.firing || 0}
              prefix={<AlertTriangle size={20} className="text-red-500" />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已确认"
              value={statistics?.acknowledged || 0}
              prefix={<Bell size={20} className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已恢复"
              value={statistics?.resolved || 0}
              prefix={<CheckCircle size={20} className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="告警总数"
              value={statistics?.total || 0}
              prefix={<Settings size={20} className="text-blue-500" />}
            />
          </Card>
        </Col>
      </Row>

      {/* 告警趋势和级别分布 */}
      <Row gutter={16}>
        <Col span={16}>
          <Card title="24小时告警趋势" loading={loading}>
            <Line {...trendConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="告警级别分布" loading={loading}>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="text-red-600 font-medium">严重</span>
                <span className="text-2xl font-bold text-red-600">
                  {statistics?.bySeverity.critical || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="text-orange-600 font-medium">警告</span>
                <span className="text-2xl font-bold text-orange-600">
                  {statistics?.bySeverity.warning || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-blue-600 font-medium">信息</span>
                <span className="text-2xl font-bold text-blue-600">
                  {statistics?.bySeverity.info || 0}
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近告警 */}
      <Card 
        title="最近告警" 
        extra={
          <Button type="link" onClick={() => navigate('/alert-records')}>
            查看全部
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentAlerts}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Alerts;
