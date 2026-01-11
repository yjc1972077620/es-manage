/**
 * 告警规则管理页面
 * 支持多条件规则、创建、编辑、启用/禁用
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Switch, Modal, Form, Input, Select, InputNumber,
  message, Popconfirm, Tooltip, Divider, Row, Col,
} from 'antd';
import { Plus, Edit, Trash2, Copy, Minus } from 'lucide-react';
import {
  mockAlertRules,
  mockNotificationChannels,
  ALERT_METRIC_NAMES,
  ALERT_OPERATOR_NAMES,
  ALERT_SEVERITY_NAMES,
} from '@/services/alertMockData';
import type { AlertRule, AlertMetricType, AlertSeverity } from '@/types';

// 扩展规则类型支持多条件
interface ExtendedAlertRule extends Omit<AlertRule, 'metric' | 'operator' | 'threshold'> {
  conditions: Array<{
    metric: AlertMetricType;
    operator: string;
    threshold: number;
  }>;
  conditionLogic: 'and' | 'or';
}

const AlertRules: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<ExtendedAlertRule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<ExtendedAlertRule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setTimeout(() => {
      // 转换旧规则格式为新格式
      const converted = mockAlertRules.map(r => ({
        ...r,
        conditions: [{ metric: r.metric, operator: r.operator, threshold: r.threshold }],
        conditionLogic: 'and' as const,
      }));
      setRules(converted);
      setLoading(false);
    }, 300);
  }, []);

  // 打开新建/编辑弹窗
  const openModal = (rule?: ExtendedAlertRule) => {
    setEditingRule(rule || null);
    if (rule) {
      form.setFieldsValue({
        ...rule,
        conditions: rule.conditions || [{ metric: undefined, operator: undefined, threshold: undefined }],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        conditions: [{ metric: undefined, operator: undefined, threshold: undefined }],
        conditionLogic: 'and',
        enabled: true,
        cooldown: 300,
        duration: 60,
      });
    }
    setModalVisible(true);
  };

  // 保存规则
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingRule) {
        setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...values, updatedAt: Date.now() } : r));
        message.success('规则更新成功');
      } else {
        const newRule: ExtendedAlertRule = {
          ...values,
          id: `rule-${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setRules([...rules, newRule]);
        message.success('规则创建成功');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除规则
  const handleDelete = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    message.success('规则删除成功');
  };

  // 切换启用状态
  const handleToggle = (id: string, enabled: boolean) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled, updatedAt: Date.now() } : r));
    message.success(enabled ? '规则已启用' : '规则已禁用');
  };

  // 复制规则
  const handleCopy = (rule: ExtendedAlertRule) => {
    const newRule: ExtendedAlertRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (副本)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setRules([...rules, newRule]);
    message.success('规则复制成功');
  };

  // 渲染条件描述
  const renderConditions = (rule: ExtendedAlertRule) => {
    const logic = rule.conditionLogic === 'and' ? ' 且 ' : ' 或 ';
    return rule.conditions.map((c, i) => {
      const unit = c.metric.includes('cpu') || c.metric.includes('heap') || c.metric.includes('disk') || c.metric.includes('memory') ? '%' : c.metric.includes('latency') ? 'ms' : '';
      return (
        <span key={i}>
          {i > 0 && <Tag color="purple" className="mx-1">{logic.trim()}</Tag>}
          <span className="text-gray-600">
            {ALERT_METRIC_NAMES[c.metric]} {ALERT_OPERATOR_NAMES[c.operator]} {c.threshold}{unit}
          </span>
        </span>
      );
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: ExtendedAlertRule) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-400 text-xs truncate max-w-[180px]">{record.description}</div>
        </div>
      ),
    },
    {
      title: '触发条件',
      key: 'conditions',
      render: (_: unknown, record: ExtendedAlertRule) => (
        <div className="text-sm">{renderConditions(record)}</div>
      ),
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => `${duration}秒`,
    },
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: AlertSeverity) => {
        const colors = { critical: 'red', warning: 'orange', info: 'blue' };
        return <Tag color={colors[severity]}>{ALERT_SEVERITY_NAMES[severity]}</Tag>;
      },
    },
    {
      title: '通知',
      dataIndex: 'notificationChannels',
      key: 'notificationChannels',
      width: 80,
      render: (channels: string[]) => <span>{channels?.length || 0} 个</span>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (enabled: boolean, record: ExtendedAlertRule) => (
        <Switch checked={enabled} onChange={(checked) => handleToggle(record.id, checked)} size="small" />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: ExtendedAlertRule) => (
        <Space size="small">
          <Tooltip title="编辑"><Button type="text" size="small" icon={<Edit size={14} />} onClick={() => openModal(record)} /></Tooltip>
          <Tooltip title="复制"><Button type="text" size="small" icon={<Copy size={14} />} onClick={() => handleCopy(record)} /></Tooltip>
          <Popconfirm title="确定删除此规则？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除"><Button type="text" size="small" danger icon={<Trash2 size={14} />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">告警规则</h1>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => openModal()}>新建规则</Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={rules} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingRule ? '编辑告警规则' : '新建告警规则'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
                <Input placeholder="请输入规则名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="severity" label="告警级别" rules={[{ required: true }]}>
                <Select placeholder="选择级别">
                  {Object.entries(ALERT_SEVERITY_NAMES).map(([key, name]) => (
                    <Select.Option key={key} value={key}>{name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入规则描述" rows={2} />
          </Form.Item>

          <Divider orientation="left" plain>触发条件</Divider>
          
          <Form.Item name="conditionLogic" label="条件关系" initialValue="and">
            <Select style={{ width: 120 }}>
              <Select.Option value="and">全部满足 (且)</Select.Option>
              <Select.Option value="or">任一满足 (或)</Select.Option>
            </Select>
          </Form.Item>

          <Form.List name="conditions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex gap-2 items-start mb-2">
                    <Form.Item {...restField} name={[name, 'metric']} rules={[{ required: true, message: '选择指标' }]} className="flex-1 mb-0">
                      <Select placeholder="监控指标">
                        {Object.entries(ALERT_METRIC_NAMES).map(([k, n]) => (
                          <Select.Option key={k} value={k}>{n}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'operator']} rules={[{ required: true, message: '选择' }]} className="w-28 mb-0">
                      <Select placeholder="操作符">
                        {Object.entries(ALERT_OPERATOR_NAMES).map(([k, n]) => (
                          <Select.Option key={k} value={k}>{n}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'threshold']} rules={[{ required: true, message: '阈值' }]} className="w-24 mb-0">
                      <InputNumber placeholder="阈值" className="w-full" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="text" danger icon={<Minus size={16} />} onClick={() => remove(name)} />
                    )}
                  </div>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<Plus size={14} />} className="mt-2">
                  添加条件
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left" plain>告警设置</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="duration" label="持续时间(秒)" rules={[{ required: true }]} tooltip="指标持续超过阈值多久后触发告警">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cooldown" label="冷却时间(秒)" tooltip="避免重复告警的间隔时间">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enabled" label="启用状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notificationChannels" label="通知渠道" rules={[{ required: true, message: '请选择通知渠道' }]}>
            <Select mode="multiple" placeholder="请选择通知渠道">
              {mockNotificationChannels.map(channel => (
                <Select.Option key={channel.id} value={channel.id}>{channel.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlertRules;
