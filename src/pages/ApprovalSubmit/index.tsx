/**
 * 提交审批申请页面
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Space, message, InputNumber, Switch, Alert, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch } from 'lucide-react';
import { mockNotificationChannels } from '@/services/alertMockData';
import { APPROVAL_TYPE_NAMES, APPROVAL_PRIORITY_NAMES } from '@/services/approvalMockData';
import { builtinWorkflowTemplates, WORKFLOW_STEP_TYPE_NAMES } from '@/services/workflowMockData';
import type { ApprovalRequestType, WorkflowTemplate } from '@/types';

const ApprovalSubmit: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<ApprovalRequestType>('create_index');
  const [boundWorkflows, setBoundWorkflows] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // 根据审批类型查找绑定的操作流
  useEffect(() => {
    const workflows = builtinWorkflowTemplates.filter(t => t.boundApprovalTypes?.includes(requestType));
    setBoundWorkflows(workflows);
    // 自动选择第一个绑定的操作流
    if (workflows.length > 0) {
      setSelectedWorkflow(workflows[0].id);
    } else {
      setSelectedWorkflow(null);
    }
  }, [requestType]);

  // 提交申请
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);
      // 模拟提交
      setTimeout(() => {
        if (selectedWorkflow) {
          message.success('申请提交成功，审批通过后将自动执行操作流');
        } else {
          message.success('申请提交成功，等待审批');
        }
        navigate('/approvals');
      }, 1000);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 根据类型渲染内容表单
  const renderContentFields = () => {
    switch (requestType) {
      case 'create_index':
        return (
          <>
            <Form.Item name={['content', 'indexName']} label="索引名称" rules={[{ required: true, message: '请输入索引名称' }]}>
              <Input placeholder="例如: user-logs-2026" />
            </Form.Item>
            <Space className="w-full" size="middle">
              <Form.Item name={['content', 'numberOfShards']} label="主分片数" initialValue={5} className="flex-1">
                <InputNumber min={1} max={100} className="w-full" />
              </Form.Item>
              <Form.Item name={['content', 'numberOfReplicas']} label="副本数" initialValue={1} className="flex-1">
                <InputNumber min={0} max={10} className="w-full" />
              </Form.Item>
            </Space>
            <Form.Item name={['content', 'mappings']} label="映射定义 (JSON)">
              <Input.TextArea rows={6} placeholder='{"properties": {"field": {"type": "keyword"}}}' />
            </Form.Item>
            <Form.Item name={['content', 'aliases']} label="别名">
              <Select mode="tags" placeholder="输入别名后按回车" />
            </Form.Item>
          </>
        );
      case 'delete_index':
        return (
          <>
            <Form.Item name={['content', 'indexName']} label="索引名称" rules={[{ required: true, message: '请输入索引名称' }]}>
              <Input placeholder="支持通配符，例如: logs-2023-*" />
            </Form.Item>
            <Form.Item name={['content', 'reason']} label="删除原因" rules={[{ required: true, message: '请输入删除原因' }]}>
              <Input.TextArea rows={2} placeholder="请说明删除原因" />
            </Form.Item>
            <Form.Item name={['content', 'backupRequired']} label="是否需要备份" valuePropName="checked" initialValue={true}>
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </>
        );
      case 'update_mapping':
      case 'update_settings':
        return (
          <>
            <Form.Item name={['content', 'indexName']} label="索引名称" rules={[{ required: true, message: '请输入索引名称' }]}>
              <Input placeholder="请输入索引名称" />
            </Form.Item>
            <Form.Item name={['content', requestType === 'update_mapping' ? 'mappings' : 'settings']} label={requestType === 'update_mapping' ? '映射定义 (JSON)' : '设置 (JSON)'} rules={[{ required: true }]}>
              <Input.TextArea rows={6} placeholder="请输入 JSON 格式内容" />
            </Form.Item>
            <Form.Item name={['content', 'reason']} label="修改原因" rules={[{ required: true, message: '请输入修改原因' }]}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </>
        );
      case 'create_alias':
      case 'delete_alias':
      case 'update_alias':
        return (
          <>
            <Form.Item name={['content', 'aliasName']} label="别名" rules={[{ required: true, message: '请输入别名' }]}>
              <Input placeholder="请输入别名" />
            </Form.Item>
            <Form.Item name={['content', 'indexName']} label="目标索引" rules={[{ required: true, message: '请输入目标索引' }]}>
              <Input placeholder="请输入目标索引名称" />
            </Form.Item>
            {requestType !== 'delete_alias' && (
              <>
                <Form.Item name={['content', 'filter']} label="过滤条件 (JSON)">
                  <Input.TextArea rows={3} placeholder='{"term": {"status": "active"}}' />
                </Form.Item>
                <Form.Item name={['content', 'routing']} label="路由">
                  <Input placeholder="可选" />
                </Form.Item>
              </>
            )}
          </>
        );
      case 'create_pipeline':
      case 'delete_pipeline':
        return (
          <>
            <Form.Item name={['content', 'pipelineName']} label="管道名称" rules={[{ required: true, message: '请输入管道名称' }]}>
              <Input placeholder="请输入管道名称" />
            </Form.Item>
            {requestType === 'create_pipeline' && (
              <>
                <Form.Item name={['content', 'description']} label="描述">
                  <Input placeholder="管道描述" />
                </Form.Item>
                <Form.Item name={['content', 'processors']} label="处理器 (JSON)" rules={[{ required: true }]}>
                  <Input.TextArea rows={6} placeholder='[{"set": {"field": "timestamp", "value": "{{_ingest.timestamp}}"}}]' />
                </Form.Item>
              </>
            )}
          </>
        );
      case 'reindex':
        return (
          <>
            <Form.Item name={['content', 'sourceIndex']} label="源索引" rules={[{ required: true, message: '请输入源索引' }]}>
              <Input placeholder="请输入源索引名称" />
            </Form.Item>
            <Form.Item name={['content', 'destIndex']} label="目标索引" rules={[{ required: true, message: '请输入目标索引' }]}>
              <Input placeholder="请输入目标索引名称" />
            </Form.Item>
            <Form.Item name={['content', 'script']} label="脚本 (可选)">
              <Input.TextArea rows={3} placeholder="Painless 脚本" />
            </Form.Item>
            <Form.Item name={['content', 'reason']} label="重建原因" rules={[{ required: true }]}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </>
        );
      default:
        return (
          <>
            <Form.Item name={['content', 'operation']} label="操作类型" rules={[{ required: true }]}>
              <Input placeholder="请描述操作类型" />
            </Form.Item>
            <Form.Item name={['content', 'details']} label="详细说明" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="请详细描述操作内容" />
            </Form.Item>
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="text" icon={<ArrowLeft size={20} />} onClick={() => navigate('/approvals')} />
        <h1 className="text-2xl font-semibold text-gray-900">提交申请</h1>
      </div>

      <Card>
        <Form form={form} layout="vertical" className="max-w-3xl">
          {/* 基本信息 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
            <Form.Item name="title" label="申请标题" rules={[{ required: true, message: '请输入申请标题' }]}>
              <Input placeholder="请简要描述申请内容" />
            </Form.Item>
            <Form.Item name="type" label="申请类型" rules={[{ required: true, message: '请选择申请类型' }]} initialValue="create_index">
              <Select onChange={(v) => setRequestType(v)}>
                {Object.entries(APPROVAL_TYPE_NAMES).map(([key, name]) => (
                  <Select.Option key={key} value={key}>{name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* 显示绑定的操作流 */}
            {boundWorkflows.length > 0 && (
              <Alert
                type="info"
                showIcon
                icon={<GitBranch size={16} />}
                message="关联操作流"
                description={
                  <div className="mt-2">
                    <span className="text-gray-600 block mb-2">此类型审批通过后将自动执行操作流：</span>
                    <Select
                      value={selectedWorkflow}
                      onChange={setSelectedWorkflow}
                      style={{ width: '100%' }}
                      placeholder="选择操作流"
                    >
                      {boundWorkflows.map(w => (
                        <Select.Option key={w.id} value={w.id}>
                          <div>
                            <span className="font-medium">{w.name}</span>
                            <span className="text-gray-400 ml-2 text-xs">({w.steps.length}个步骤)</span>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                    {selectedWorkflow && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <div className="text-gray-500 mb-1">执行步骤：</div>
                        {boundWorkflows.find(w => w.id === selectedWorkflow)?.steps.map((s, i) => (
                          <Tag key={i} className="mb-1">{i + 1}. {s.name}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                }
                className="mb-4"
              />
            )}

            <Form.Item name="priority" label="优先级" initialValue="normal">
              <Select>
                {Object.entries(APPROVAL_PRIORITY_NAMES).map(([key, name]) => (
                  <Select.Option key={key} value={key}>{name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="description" label="申请说明" rules={[{ required: true, message: '请输入申请说明' }]}>
              <Input.TextArea rows={3} placeholder="请详细说明申请原因和背景" />
            </Form.Item>
          </div>

          {/* 申请内容 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">申请内容</h3>
            {renderContentFields()}
          </div>

          {/* 通知设置 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">通知设置</h3>
            <Form.Item name="notificationChannels" label="通知渠道" tooltip="审批进度将通过选择的渠道通知">
              <Select mode="multiple" placeholder="选择通知渠道">
                {mockNotificationChannels.filter(c => c.enabled).map(channel => (
                  <Select.Option key={channel.id} value={channel.id}>{channel.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* 提交按钮 */}
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSubmit} loading={submitting}>
                提交申请
              </Button>
              <Button onClick={() => navigate('/approvals')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ApprovalSubmit;
