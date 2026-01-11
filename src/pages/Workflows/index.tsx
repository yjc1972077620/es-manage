/**
 * 操作流管理页面
 * 支持原子操作CRUD、模板管理、实例执行、执行历史
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Table, Button, Tag, Space, Modal, Form, Input, Select, Steps, message, Tooltip, Popconfirm, Descriptions, Progress, Timeline, Badge, Row, Col, Divider,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Eye, Trash2, Edit, GitBranch, CheckCircle, Clock, XCircle, Loader, AlertCircle, Link2, Code, History, Minus } from 'lucide-react';
import {
  builtinWorkflowTemplates,
  mockWorkflowInstances,
  atomicOperations as initialOperations,
  mockExecutionRecords,
  WORKFLOW_STEP_TYPE_NAMES,
  WORKFLOW_STATUS_NAMES,
  WORKFLOW_CATEGORY_NAMES,
  ATOMIC_OPERATION_NAMES,
  HTTP_METHOD_COLORS,
} from '@/services/workflowMockData';
import { APPROVAL_TYPE_NAMES } from '@/services/approvalMockData';
import type { WorkflowTemplate, WorkflowInstance, AtomicOperation, WorkflowExecutionRecord, AtomicOperationType } from '@/types';

const { TextArea } = Input;

const Workflows: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [operations, setOperations] = useState<AtomicOperation[]>([]);
  const [execRecords, setExecRecords] = useState<WorkflowExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('instances');

  // 弹窗状态
  const [operationModalVisible, setOperationModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [instanceModalVisible, setInstanceModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [bindModalVisible, setBindModalVisible] = useState(false);
  
  // 选中项
  const [editingOperation, setEditingOperation] = useState<AtomicOperation | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  
  // 表单
  const [operationForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [instanceForm] = Form.useForm();
  const [bindForm] = Form.useForm();

  useEffect(() => {
    setTimeout(() => {
      setTemplates([...builtinWorkflowTemplates]);
      setInstances([...mockWorkflowInstances]);
      setOperations([...initialOperations]);
      setExecRecords([...mockExecutionRecords]);
      setLoading(false);
    }, 300);
  }, []);

  // 状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default', pending_approval: 'orange', approved: 'cyan',
      running: 'processing', completed: 'success', failed: 'error', cancelled: 'default',
      pending: 'default', skipped: 'default',
    };
    return colors[status] || 'default';
  };

  // 步骤状态图标
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'running': return <Loader size={16} className="text-blue-600 animate-spin" />;
      case 'failed': return <XCircle size={16} className="text-red-600" />;
      case 'skipped': return <AlertCircle size={16} className="text-gray-400" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  // 格式化耗时
  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  // ==================== 原子操作 CRUD ====================
  const openOperationModal = (op?: AtomicOperation) => {
    setEditingOperation(op || null);
    if (op) {
      operationForm.setFieldsValue({
        ...op,
        method: op.apiConfig.method,
        endpoint: op.apiConfig.endpoint,
        body: op.apiConfig.body,
      });
    } else {
      operationForm.resetFields();
      operationForm.setFieldsValue({ method: 'GET', type: 'custom_api' });
    }
    setOperationModalVisible(true);
  };

  const handleSaveOperation = async () => {
    try {
      const values = await operationForm.validateFields();
      const newOp: AtomicOperation = {
        id: editingOperation?.id || `op-${Date.now()}`,
        name: values.name,
        type: values.type,
        description: values.description,
        apiConfig: {
          method: values.method,
          endpoint: values.endpoint,
          body: values.body,
        },
        inputSchema: {},
        isBuiltin: false,
        createdAt: editingOperation?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      if (editingOperation) {
        setOperations(operations.map(o => o.id === editingOperation.id ? newOp : o));
        message.success('操作更新成功');
      } else {
        setOperations([newOp, ...operations]);
        message.success('操作创建成功');
      }
      setOperationModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleDeleteOperation = (id: string) => {
    setOperations(operations.filter(o => o.id !== id));
    message.success('操作删除成功');
  };

  // ==================== 模板 CRUD ====================
  const openTemplateModal = (tpl?: WorkflowTemplate) => {
    setEditingTemplate(tpl || null);
    if (tpl) {
      templateForm.setFieldsValue({
        ...tpl,
        steps: tpl.steps.map(s => ({ type: s.type, name: s.name, description: s.description })),
      });
    } else {
      templateForm.resetFields();
      templateForm.setFieldsValue({ category: 'custom', steps: [{ type: undefined, name: '', description: '' }] });
    }
    setTemplateModalVisible(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      const newTpl: WorkflowTemplate = {
        id: editingTemplate?.id || `tpl-${Date.now()}`,
        name: values.name,
        description: values.description,
        category: values.category,
        steps: values.steps.map((s: { type: string; name: string; description?: string }) => ({
          name: s.name,
          type: s.type,
          description: s.description,
          config: {},
        })),
        isBuiltin: false,
        boundApprovalTypes: editingTemplate?.boundApprovalTypes,
        createdAt: editingTemplate?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      if (editingTemplate) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? newTpl : t));
        message.success('模板更新成功');
      } else {
        setTemplates([newTpl, ...templates]);
        message.success('模板创建成功');
      }
      setTemplateModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    message.success('模板删除成功');
  };

  // ==================== 实例操作 ====================
  const openInstanceModal = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    instanceForm.resetFields();
    instanceForm.setFieldsValue({ templateId: template.id });
    setInstanceModalVisible(true);
  };

  const handleCreateInstance = async () => {
    try {
      const values = await instanceForm.validateFields();
      const template = templates.find(t => t.id === values.templateId);
      if (!template) return;

      const newInstance: WorkflowInstance = {
        id: `wf-${Date.now()}`,
        templateId: template.id,
        templateName: template.name,
        name: values.name,
        description: values.description,
        status: 'running',
        currentStepIndex: 0,
        progress: 0,
        triggerType: 'manual',
        variables: values.variables || {},
        steps: template.steps.map((s, i) => ({
          ...s,
          id: `s${i + 1}`,
          status: i === 0 ? 'running' : 'pending',
          startedAt: i === 0 ? Date.now() : undefined,
        })),
        createdBy: 'admin',
        createdAt: Date.now(),
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
      setInstances([newInstance, ...instances]);
      message.success('操作流已启动');
      setInstanceModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const showInstanceDetail = (instance: WorkflowInstance) => {
    setSelectedInstance(instance);
    setDetailModalVisible(true);
  };

  const handleCancelInstance = (id: string) => {
    setInstances(instances.map(i => i.id === id ? { ...i, status: 'cancelled', updatedAt: Date.now() } : i));
    message.success('操作流已取消');
  };

  const handleRetryInstance = (id: string) => {
    setInstances(instances.map(i => {
      if (i.id === id) {
        const failedStepIndex = i.steps.findIndex(s => s.status === 'failed');
        return {
          ...i,
          status: 'running',
          steps: i.steps.map((s, idx) => idx === failedStepIndex ? { ...s, status: 'running', error: undefined, startedAt: Date.now() } : s),
          updatedAt: Date.now(),
        };
      }
      return i;
    }));
    message.success('正在重试...');
  };

  // ==================== 绑定审批 ====================
  const openBindModal = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    bindForm.setFieldsValue({ boundApprovalTypes: template.boundApprovalTypes || [] });
    setBindModalVisible(true);
  };

  const handleSaveBind = async () => {
    const values = await bindForm.validateFields();
    setTemplates(templates.map(t => t.id === selectedTemplate?.id ? { ...t, boundApprovalTypes: values.boundApprovalTypes, updatedAt: Date.now() } : t));
    message.success('绑定保存成功');
    setBindModalVisible(false);
  };

  const goToApproval = (approvalId?: string) => {
    if (approvalId) navigate(`/approvals/${approvalId}`);
    else navigate('/approvals');
  };

  // ==================== 表格列定义 ====================
  const operationColumns = [
    { title: '操作名称', dataIndex: 'name', key: 'name', render: (text: string, record: AtomicOperation) => (
      <div>
        <div className="font-medium text-gray-900">{text}</div>
        <div className="text-gray-500 text-xs mt-1">{record.description}</div>
      </div>
    )},
    { title: 'API配置', key: 'api', width: 300, render: (_: unknown, record: AtomicOperation) => (
      <div className="font-mono text-xs">
        <Tag color={HTTP_METHOD_COLORS[record.apiConfig.method]}>{record.apiConfig.method}</Tag>
        <span className="text-gray-600 ml-1">{record.apiConfig.endpoint}</span>
      </div>
    )},
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => <Tag>{ATOMIC_OPERATION_NAMES[type as AtomicOperationType]}</Tag> },
    { title: '来源', dataIndex: 'isBuiltin', key: 'isBuiltin', width: 80, render: (v: boolean) => v ? <Tag color="blue">内置</Tag> : <Tag color="green">自定义</Tag> },
    { title: '操作', key: 'actions', width: 120, render: (_: unknown, record: AtomicOperation) => (
      <Space>
        <Tooltip title="查看"><Button type="text" size="small" icon={<Eye size={14} />} onClick={() => openOperationModal(record)} /></Tooltip>
        {!record.isBuiltin && (
          <>
            <Tooltip title="编辑"><Button type="text" size="small" icon={<Edit size={14} />} onClick={() => openOperationModal(record)} /></Tooltip>
            <Popconfirm title="确定删除？" onConfirm={() => handleDeleteOperation(record.id)}>
              <Tooltip title="删除"><Button type="text" size="small" danger icon={<Trash2 size={14} />} /></Tooltip>
            </Popconfirm>
          </>
        )}
      </Space>
    )},
  ];

  const templateColumns = [
    { title: '模板名称', dataIndex: 'name', key: 'name', render: (text: string, record: WorkflowTemplate) => (
      <div>
        <div className="font-medium text-gray-900 flex items-center gap-2">
          {text}
          {record.isBuiltin && <Tag color="blue">内置</Tag>}
        </div>
        <div className="text-gray-500 text-xs mt-1">{record.description}</div>
      </div>
    )},
    { title: '分类', dataIndex: 'category', key: 'category', width: 100, render: (category: string) => <Tag>{WORKFLOW_CATEGORY_NAMES[category]}</Tag> },
    { title: '步骤', dataIndex: 'steps', key: 'steps', width: 80, render: (steps: unknown[]) => <span className="text-gray-700">{steps.length}</span> },
    { title: '绑定审批', key: 'boundApprovalTypes', width: 180, render: (_: unknown, record: WorkflowTemplate) => (
      <div className="flex flex-wrap gap-1">
        {record.boundApprovalTypes?.length ? record.boundApprovalTypes.map(t => (
          <Tag key={t} color="purple" className="text-xs">{APPROVAL_TYPE_NAMES[t]}</Tag>
        )) : <span className="text-gray-400 text-xs">未绑定</span>}
      </div>
    )},
    { title: '操作', key: 'actions', width: 200, render: (_: unknown, record: WorkflowTemplate) => (
      <Space>
        <Button type="primary" size="small" icon={<Play size={14} />} onClick={() => openInstanceModal(record)}>执行</Button>
        <Tooltip title="绑定审批"><Button type="text" size="small" icon={<Link2 size={14} />} onClick={() => openBindModal(record)} /></Tooltip>
        {!record.isBuiltin && (
          <>
            <Tooltip title="编辑"><Button type="text" size="small" icon={<Edit size={14} />} onClick={() => openTemplateModal(record)} /></Tooltip>
            <Popconfirm title="确定删除？" onConfirm={() => handleDeleteTemplate(record.id)}>
              <Tooltip title="删除"><Button type="text" size="small" danger icon={<Trash2 size={14} />} /></Tooltip>
            </Popconfirm>
          </>
        )}
      </Space>
    )},
  ];

  const instanceColumns = [
    { title: '操作流名称', dataIndex: 'name', key: 'name', render: (text: string, record: WorkflowInstance) => (
      <div>
        <div className="font-medium text-gray-900">{text}</div>
        <div className="text-gray-500 text-xs">{record.templateName}</div>
      </div>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Badge status={getStatusColor(status) as 'default' | 'processing' | 'success' | 'error' | 'warning'} text={WORKFLOW_STATUS_NAMES[status]} /> },
    { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType', width: 90, render: (t: string) => <Tag color={t === 'approval' ? 'purple' : 'blue'}>{t === 'approval' ? '审批触发' : '手动执行'}</Tag> },
    { title: '进度', key: 'progress', width: 180, render: (_: unknown, record: WorkflowInstance) => {
      const completed = record.steps.filter(s => s.status === 'completed').length;
      const total = record.steps.length;
      const percent = record.status === 'completed' ? 100 : record.progress || Math.round((completed / total) * 100);
      return (
        <div className="flex items-center gap-2">
          <Progress percent={percent} size="small" status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'} className="flex-1 mb-0" />
          <span className="text-xs text-gray-500">{completed}/{total}</span>
        </div>
      );
    }},
    { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 80 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (time: number) => <span className="text-gray-600 text-sm">{new Date(time).toLocaleString('zh-CN')}</span> },
    { title: '操作', key: 'actions', width: 150, render: (_: unknown, record: WorkflowInstance) => (
      <Space>
        <Tooltip title="详情"><Button type="text" size="small" icon={<Eye size={14} />} onClick={() => showInstanceDetail(record)} /></Tooltip>
        {record.approvalId && <Tooltip title="审批"><Button type="text" size="small" icon={<GitBranch size={14} />} onClick={() => goToApproval(record.approvalId)} /></Tooltip>}
        {record.status === 'failed' && <Tooltip title="重试"><Button type="text" size="small" icon={<Play size={14} />} onClick={() => handleRetryInstance(record.id)} /></Tooltip>}
        {(record.status === 'pending_approval' || record.status === 'running') && (
          <Popconfirm title="确定取消？" onConfirm={() => handleCancelInstance(record.id)}>
            <Tooltip title="取消"><Button type="text" size="small" danger icon={<XCircle size={14} />} /></Tooltip>
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  const execRecordColumns = [
    { title: '操作流', dataIndex: 'workflowName', key: 'workflowName', render: (text: string, record: WorkflowExecutionRecord) => (
      <div>
        <div className="font-medium text-gray-900">{text}</div>
        <div className="text-gray-500 text-xs">{record.templateName}</div>
      </div>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Badge status={getStatusColor(status) as 'default' | 'processing' | 'success' | 'error' | 'warning'} text={WORKFLOW_STATUS_NAMES[status]} /> },
    { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType', width: 90, render: (t: string) => <Tag color={t === 'approval' ? 'purple' : 'blue'}>{t === 'approval' ? '审批触发' : '手动执行'}</Tag> },
    { title: '执行人', dataIndex: 'createdBy', key: 'createdBy', width: 80 },
    { title: '开始时间', dataIndex: 'startedAt', key: 'startedAt', width: 150, render: (time?: number) => time ? <span className="text-gray-600 text-sm">{new Date(time).toLocaleString('zh-CN')}</span> : '-' },
    { title: '耗时', dataIndex: 'duration', key: 'duration', width: 100, render: (d?: number) => formatDuration(d) },
    { title: '操作', key: 'actions', width: 80, render: (_: unknown, record: WorkflowExecutionRecord) => (
      <Button type="text" size="small" icon={<Eye size={14} />} onClick={() => {
        const inst = instances.find(i => i.id === record.workflowId);
        if (inst) showInstanceDetail(inst);
      }}>详情</Button>
    )},
  ];

  // ==================== 渲染 ====================
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">操作流管理</h1>
        <Space>
          {activeTab === 'operations' && <Button type="primary" icon={<Plus size={16} />} onClick={() => openOperationModal()}>新建操作</Button>}
          {activeTab === 'templates' && <Button type="primary" icon={<Plus size={16} />} onClick={() => openTemplateModal()}>新建模板</Button>}
        </Space>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'instances', label: '操作流实例', children: <Table columns={instanceColumns} dataSource={instances} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" /> },
          { key: 'templates', label: '操作流模板', children: (
            <Table columns={templateColumns} dataSource={templates} rowKey="id" loading={loading} pagination={false} size="middle"
              expandable={{ expandedRowRender: (record) => (
                <div className="py-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">执行步骤：</div>
                  <Steps size="small" items={record.steps.map(s => ({ title: <span className="text-gray-800">{s.name}</span>, description: <span className="text-xs text-gray-500">{WORKFLOW_STEP_TYPE_NAMES[s.type]}</span> }))} />
                </div>
              )}}
            />
          )},
          { key: 'operations', label: '原子操作', children: (
            <div>
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                <Code size={16} className="inline mr-2" />
                原子操作是操作流的基本组成单元，每个操作对应一次 ES/Kibana API 调用。可以组合多个原子操作构建操作流模板。
              </div>
              <Table columns={operationColumns} dataSource={operations} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
            </div>
          )},
          { key: 'history', label: <span><History size={14} className="inline mr-1" />执行历史</span>, children: (
            <Table columns={execRecordColumns} dataSource={execRecords} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="middle" />
          )},
        ]} />
      </Card>

      {/* 原子操作编辑弹窗 */}
      <Modal title={editingOperation ? (editingOperation.isBuiltin ? '查看操作' : '编辑操作') : '新建原子操作'} open={operationModalVisible} onOk={editingOperation?.isBuiltin ? undefined : handleSaveOperation} onCancel={() => setOperationModalVisible(false)} width={700} okText="保存" cancelText="取消" footer={editingOperation?.isBuiltin ? <Button onClick={() => setOperationModalVisible(false)}>关闭</Button> : undefined}>
        <Form form={operationForm} layout="vertical" className="mt-4" disabled={editingOperation?.isBuiltin}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="操作名称" rules={[{ required: true }]}><Input placeholder="例如：创建索引" /></Form.Item></Col>
            <Col span={12}><Form.Item name="type" label="操作类型" rules={[{ required: true }]}>
              <Select placeholder="选择类型">
                {Object.entries(ATOMIC_OPERATION_NAMES).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}
              </Select>
            </Form.Item></Col>
          </Row>
          <Form.Item name="description" label="描述"><Input placeholder="操作描述" /></Form.Item>
          <Divider plain>API 配置</Divider>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="method" label="HTTP方法" rules={[{ required: true }]}>
              <Select>
                {['GET', 'POST', 'PUT', 'DELETE', 'HEAD'].map(m => <Select.Option key={m} value={m}><Tag color={HTTP_METHOD_COLORS[m]}>{m}</Tag></Select.Option>)}
              </Select>
            </Form.Item></Col>
            <Col span={18}><Form.Item name="endpoint" label="API端点" rules={[{ required: true }]}><Input placeholder="/{{indexName}}/_settings" className="font-mono" /></Form.Item></Col>
          </Row>
          <Form.Item name="body" label="请求体 (JSON)"><TextArea rows={6} placeholder='{\n  "settings": {{settings}}\n}' className="font-mono text-sm" /></Form.Item>
        </Form>
      </Modal>

      {/* 模板编辑弹窗 */}
      <Modal title={editingTemplate ? '编辑模板' : '新建操作流模板'} open={templateModalVisible} onOk={handleSaveTemplate} onCancel={() => setTemplateModalVisible(false)} width={750} okText="保存" cancelText="取消">
        <Form form={templateForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={16}><Form.Item name="name" label="模板名称" rules={[{ required: true }]}><Input placeholder="例如：索引映射变更" /></Form.Item></Col>
            <Col span={8}><Form.Item name="category" label="分类" rules={[{ required: true }]}>
              <Select>{Object.entries(WORKFLOW_CATEGORY_NAMES).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
            </Form.Item></Col>
          </Row>
          <Form.Item name="description" label="描述"><Input placeholder="模板描述" /></Form.Item>
          <Divider plain>执行步骤</Divider>
          <Form.List name="steps">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="flex gap-2 items-start mb-2 p-3 bg-gray-50 rounded">
                    <span className="text-gray-400 mt-2">{index + 1}.</span>
                    <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true }]} className="w-40 mb-0">
                      <Select placeholder="操作类型" size="small">
                        {operations.map(op => <Select.Option key={op.id} value={op.type}>{op.name}</Select.Option>)}
                        <Select.Option value="notification">通知</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true }]} className="flex-1 mb-0">
                      <Input placeholder="步骤名称" size="small" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'description']} className="flex-1 mb-0">
                      <Input placeholder="描述(可选)" size="small" />
                    </Form.Item>
                    {fields.length > 1 && <Button type="text" danger size="small" icon={<Minus size={14} />} onClick={() => remove(name)} className="mt-1" />}
                  </div>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<Plus size={14} />}>添加步骤</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 执行实例弹窗 */}
      <Modal title={`执行: ${selectedTemplate?.name}`} open={instanceModalVisible} onOk={handleCreateInstance} onCancel={() => setInstanceModalVisible(false)} width={600} okText="立即执行" cancelText="取消">
        <Form form={instanceForm} layout="vertical" className="mt-4">
          <Form.Item name="templateId" hidden><Input /></Form.Item>
          <Form.Item name="name" label="执行名称" rules={[{ required: true }]}><Input placeholder="例如：用户索引字段扩展" /></Form.Item>
          <Form.Item name="description" label="描述"><TextArea rows={2} placeholder="描述此次执行的目的" /></Form.Item>
          {selectedTemplate?.steps.some(s => s.config && Object.keys(s.config).length > 0) && (
            <>
              <Divider plain>变量配置</Divider>
              <Form.Item name={['variables', 'sourceIndex']} label="源索引"><Input placeholder="源索引名称" /></Form.Item>
              <Form.Item name={['variables', 'targetIndex']} label="目标索引"><Input placeholder="目标索引名称" /></Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 绑定审批弹窗 */}
      <Modal title="绑定审批类型" open={bindModalVisible} onOk={handleSaveBind} onCancel={() => setBindModalVisible(false)} okText="保存" cancelText="取消">
        <div className="mb-4 text-gray-600 text-sm">选择此操作流模板关联的审批类型，审批通过后将自动触发此操作流。</div>
        <Form form={bindForm} layout="vertical">
          <Form.Item name="boundApprovalTypes" label="审批类型">
            <Select mode="multiple" placeholder="选择审批类型">
              {Object.entries(APPROVAL_TYPE_NAMES).map(([key, name]) => <Select.Option key={key} value={key}>{name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 实例详情弹窗 */}
      <Modal title="操作流执行详情" open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} footer={<Button onClick={() => setDetailModalVisible(false)}>关闭</Button>} width={850}>
        {selectedInstance && (
          <>
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="名称"><span className="font-medium">{selectedInstance.name}</span></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={getStatusColor(selectedInstance.status) as 'default' | 'processing' | 'success' | 'error' | 'warning'} text={WORKFLOW_STATUS_NAMES[selectedInstance.status]} /></Descriptions.Item>
              <Descriptions.Item label="模板">{selectedInstance.templateName}</Descriptions.Item>
              <Descriptions.Item label="触发方式"><Tag color={selectedInstance.triggerType === 'approval' ? 'purple' : 'blue'}>{selectedInstance.triggerType === 'approval' ? '审批触发' : '手动执行'}</Tag></Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedInstance.createdBy}</Descriptions.Item>
              <Descriptions.Item label="进度"><Progress percent={selectedInstance.progress || 0} size="small" status={selectedInstance.status === 'failed' ? 'exception' : selectedInstance.status === 'completed' ? 'success' : 'active'} /></Descriptions.Item>
              {selectedInstance.approvalId && <Descriptions.Item label="关联审批"><Button type="link" size="small" onClick={() => goToApproval(selectedInstance.approvalId)}>{selectedInstance.approvalId}</Button></Descriptions.Item>}
            </Descriptions>
            <div className="mb-3 font-medium text-gray-900">执行步骤</div>
            <Timeline items={selectedInstance.steps.map((step, idx) => ({
              dot: getStepIcon(step.status),
              children: (
                <div className={`pb-2 ${idx === selectedInstance.steps.length - 1 ? '' : 'border-b border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{step.name}</span>
                      <Tag className="text-xs">{WORKFLOW_STEP_TYPE_NAMES[step.type]}</Tag>
                      {step.status === 'running' && <Tag color="processing">执行中</Tag>}
                    </div>
                    {step.result?.duration && <span className="text-xs text-gray-500">耗时: {formatDuration(step.result.duration)}</span>}
                  </div>
                  {step.result?.message && <div className={`text-sm mt-1 ${step.status === 'failed' ? 'text-red-600' : 'text-gray-600'}`}>{step.result.message}</div>}
                  {step.error && <div className="text-sm text-red-600 mt-1">错误: {step.error}</div>}
                  {step.result?.data && <div className="text-xs text-gray-500 mt-1">{Object.entries(step.result.data as Record<string, unknown>).map(([k, v]) => <span key={k} className="mr-3">{k}: {String(v)}</span>)}</div>}
                  <div className="text-xs text-gray-400 mt-1">
                    {step.startedAt && <span>开始: {new Date(step.startedAt).toLocaleString('zh-CN')}</span>}
                    {step.completedAt && <span className="ml-3">完成: {new Date(step.completedAt).toLocaleString('zh-CN')}</span>}
                  </div>
                </div>
              ),
            }))} />
            {Object.keys(selectedInstance.variables).length > 0 && (
              <>
                <div className="mt-4 mb-2 font-medium text-gray-900">流程变量</div>
                <pre className="bg-gray-50 p-3 rounded text-xs text-gray-700">{JSON.stringify(selectedInstance.variables, null, 2)}</pre>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default Workflows;
