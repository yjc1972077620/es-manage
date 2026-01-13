/**
 * 通知渠道管理页面
 * 支持配置邮件、钉钉、Webhook、站内信等通知方式
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import { Plus, Edit, Trash2, TestTube } from 'lucide-react';
import {
  mockNotificationChannels,
  NOTIFICATION_CHANNEL_TYPE_NAMES,
} from '@/services/alertMockData';
import type { NotificationChannel, NotificationChannelType } from '@/types';

const NotificationChannels: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [form] = Form.useForm();
  const [channelType, setChannelType] = useState<NotificationChannelType>('email');

  useEffect(() => {
    setTimeout(() => {
      setChannels([...mockNotificationChannels]);
      setLoading(false);
    }, 300);
  }, []);

  // 打开新建/编辑弹窗
  const openModal = (channel?: NotificationChannel) => {
    setEditingChannel(channel || null);
    if (channel) {
      setChannelType(channel.type);
      const { type: _type, ...configWithoutType } = channel.config;
      form.setFieldsValue({
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        ...configWithoutType,
      });
    } else {
      form.resetFields();
      setChannelType('email');
    }
    setModalVisible(true);
  };

  // 保存渠道
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const { name, type, enabled, ...configValues } = values;
      const config = { type, ...configValues };

      if (editingChannel) {
        setChannels(channels.map(c =>
          c.id === editingChannel.id
            ? { ...c, name, type, enabled, config, updatedAt: Date.now() }
            : c
        ));
        message.success('渠道更新成功');
      } else {
        const newChannel: NotificationChannel = {
          id: `channel-${Date.now()}`,
          name,
          type,
          enabled: enabled ?? true,
          config,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setChannels([...channels, newChannel]);
        message.success('渠道创建成功');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除渠道
  const handleDelete = (id: string) => {
    setChannels(channels.filter(c => c.id !== id));
    message.success('渠道删除成功');
  };

  // 切换启用状态
  const handleToggle = (id: string, enabled: boolean) => {
    setChannels(channels.map(c =>
      c.id === id ? { ...c, enabled, updatedAt: Date.now() } : c
    ));
    message.success(enabled ? '渠道已启用' : '渠道已禁用');
  };

  // 测试渠道
  const handleTest = (channel: NotificationChannel) => {
    message.loading('正在发送测试通知...', 1.5);
    setTimeout(() => {
      message.success(`测试通知已发送至 ${channel.name}`);
    }, 1500);
  };

  // 渠道类型图标颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      email: 'blue', dingtalk: 'cyan', webhook: 'purple', sms: 'green', internal: 'orange',
    };
    return colors[type] || 'default';
  };

  // 表格列定义
  const columns = [
    {
      title: '渠道名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: NotificationChannel) => (
        <Space>
          <Tag color={getTypeColor(record.type)}>
            {NOTIFICATION_CHANNEL_TYPE_NAMES[record.type]}
          </Tag>
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => NOTIFICATION_CHANNEL_TYPE_NAMES[type],
    },
    {
      title: '配置摘要',
      key: 'configSummary',
      render: (_: unknown, record: NotificationChannel) => {
        const config = record.config;
        if (config.type === 'email') return `收件人: ${config.recipients?.join(', ')}`;
        if (config.type === 'dingtalk') return `Webhook: ${config.webhookUrl?.slice(0, 30)}...`;
        if (config.type === 'webhook') return `URL: ${config.url?.slice(0, 30)}...`;
        if (config.type === 'internal') return config.broadcast ? '全员广播' : `指定用户`;
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: NotificationChannel) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggle(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time: number) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: NotificationChannel) => (
        <Space>
          <Tooltip title="测试">
            <Button type="text" size="small" icon={<TestTube size={16} />} onClick={() => handleTest(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<Edit size={16} />} onClick={() => openModal(record)} />
          </Tooltip>
          <Popconfirm title="确定删除此渠道？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<Trash2 size={16} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 根据类型渲染配置表单
  const renderConfigFields = () => {
    switch (channelType) {
      case 'email':
        return (
          <>
            <Form.Item name="recipients" label="收件人" rules={[{ required: true, message: '请输入收件人' }]}>
              <Select mode="tags" placeholder="输入邮箱地址后按回车" />
            </Form.Item>
            <Form.Item name="smtpHost" label="SMTP 服务器">
              <Input placeholder="smtp.example.com" />
            </Form.Item>
            <Space className="w-full">
              <Form.Item name="smtpPort" label="端口" className="flex-1">
                <Input placeholder="587" />
              </Form.Item>
              <Form.Item name="useTls" label="TLS" valuePropName="checked" className="flex-1">
                <Switch />
              </Form.Item>
            </Space>
          </>
        );
      case 'dingtalk':
        return (
          <>
            <Form.Item name="webhookUrl" label="Webhook URL" rules={[{ required: true, message: '请输入 Webhook URL' }]}>
              <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx" />
            </Form.Item>
            <Form.Item name="secret" label="加签密钥">
              <Input.Password placeholder="SEC..." />
            </Form.Item>
            <Form.Item name="atAll" label="@所有人" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        );
      case 'webhook':
        return (
          <>
            <Form.Item name="url" label="URL" rules={[{ required: true, message: '请输入 URL' }]}>
              <Input placeholder="https://example.com/api/alerts" />
            </Form.Item>
            <Form.Item name="method" label="请求方法" initialValue="POST">
              <Select>
                <Select.Option value="GET">GET</Select.Option>
                <Select.Option value="POST">POST</Select.Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'internal':
        return (
          <Form.Item name="broadcast" label="全员广播" valuePropName="checked">
            <Switch />
          </Form.Item>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">通知渠道</h1>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => openModal()}>
          新建渠道
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={channels} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingChannel ? '编辑通知渠道' : '新建通知渠道'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="渠道名称" rules={[{ required: true, message: '请输入渠道名称' }]}>
            <Input placeholder="请输入渠道名称" />
          </Form.Item>
          <Form.Item name="type" label="渠道类型" rules={[{ required: true, message: '请选择渠道类型' }]}>
            <Select placeholder="请选择渠道类型" onChange={(v) => setChannelType(v)}>
              {Object.entries(NOTIFICATION_CHANNEL_TYPE_NAMES).map(([key, name]) => (
                <Select.Option key={key} value={key}>{name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {renderConfigFields()}
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationChannels;
