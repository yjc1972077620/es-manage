/**
 * 审批详情页面
 * 展示审批流程、进度、日志、申请内容预览和操作流执行状态
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Descriptions, Tag, Steps, Timeline, Button, Space, Modal, Input, message, Row, Col, Progress, Badge, Alert,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Play, GitBranch, Loader, AlertCircle } from 'lucide-react';
import {
  mockApprovalRequests,
  APPROVAL_TYPE_NAMES,
  APPROVAL_STATUS_NAMES,
  APPROVAL_PRIORITY_NAMES,
} from '@/services/approvalMockData';
import { mockNotificationChannels } from '@/services/alertMockData';
import { mockWorkflowInstances, WORKFLOW_STATUS_NAMES, WORKFLOW_STEP_TYPE_NAMES, builtinWorkflowTemplates } from '@/services/workflowMockData';
import type { ApprovalRequest, ApprovalStatus, WorkflowInstance } from '@/types';

const ApprovalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowInstance | null>(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setTimeout(() => {
      const found = mockApprovalRequests.find(r => r.id === id);
      setRequest(found || null);
      // 查找关联的操作流
      if (found) {
        const wf = mockWorkflowInstances.find(w => w.approvalId === found.id);
        setWorkflow(wf || null);
      }
      setLoading(false);
    }, 300);
  }, [id]);

  // 获取绑定的操作流模板
  const getBoundWorkflows = () => {
    if (!request) return [];
    return builtinWorkflowTemplates.filter(t => t.boundApprovalTypes?.includes(request.type));
  };

  // 状态颜色
  const getStatusColor = (status: ApprovalStatus | string) => {
    const colors: Record<string, string> = {
      pending: 'orange', approved: 'cyan', rejected: 'red',
      cancelled: 'default', processing: 'blue', completed: 'green', failed: 'red',
      running: 'processing',
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

  // 获取当前步骤
  const getCurrentStep = () => {
    if (!request) return 0;
    const idx = request.nodes.findIndex(n => n.status === 'pending');
    return idx === -1 ? request.nodes.length : idx;
  };

  // 审批通过
  const handleApprove = () => {
    message.success('审批通过，操作流已自动触发');
    setApproveModalVisible(false);
    setComment('');
    // 模拟触发操作流
    if (getBoundWorkflows().length > 0 && !workflow) {
      const tpl = getBoundWorkflows()[0];
      const newWf: WorkflowInstance = {
        id: `wf-${Date.now()}`,
        templateId: tpl.id,
        templateName: tpl.name,
        name: `${request?.title} - 自动执行`,
        status: 'running',
        triggerType: 'approval',
        approvalId: request?.id,
        currentStepIndex: 0,
        progress: 10,
        variables: {},
        steps: tpl.steps.map((s, i) => ({ ...s, id: `s${i + 1}`, status: i === 0 ? 'running' : 'pending', startedAt: i === 0 ? Date.now() : undefined })),
        createdBy: 'system',
        createdAt: Date.now(),
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
      setWorkflow(newWf);
    }
  };

  // 审批驳回
  const handleReject = () => {
    if (!comment.trim()) {
      message.error('请输入驳回原因');
      return;
    }
    message.success('已驳回');
    setRejectModalVisible(false);
    setComment('');
  };

  // 执行操作
  const handleExecute = () => {
    message.loading('正在执行...', 1.5);
    setTimeout(() => message.success('执行完成'), 1500);
  };

  // 格式化耗时
  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  // 渲染申请内容预览
  const renderContentPreview = () => {
    if (!request) return null;
    return <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">{JSON.stringify(request.content, null, 2)}</pre>;
  };

  // 判断是否可以审批
  const canApprove = request?.status === 'pending' || request?.status === 'approved';
  const canExecute = request?.status === 'approved' && request.nodes.every(n => n.type !== 'approval' || n.status === 'approved');
  const boundWorkflows = getBoundWorkflows();

  if (loading) return <Card loading />;

  if (!request) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-500">申请不存在</p>
          <Button type="link" onClick={() => navigate('/approvals')}>返回列表</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="text" icon={<ArrowLeft size={20} />} onClick={() => navigate('/approvals')} />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{request.title}</h1>
            <div className="text-gray-500 text-sm mt-1">{request.id}</div>
          </div>
        </div>
        <Space>
          {canApprove && (
            <>
              <Button type="primary" icon={<CheckCircle size={16} />} onClick={() => setApproveModalVisible(true)}>通过</Button>
              <Button danger icon={<XCircle size={16} />} onClick={() => setRejectModalVisible(true)}>驳回</Button>
            </>
          )}
          {canExecute && !workflow && <Button type="primary" icon={<Play size={16} />} onClick={handleExecute}>执行</Button>}
        </Space>
      </div>

      {/* 操作流执行状态提示 */}
      {workflow && (
        <Alert
          type={workflow.status === 'completed' ? 'success' : workflow.status === 'failed' ? 'error' : 'info'}
          showIcon
          icon={workflow.status === 'running' ? <Loader size={16} className="animate-spin" /> : workflow.status === 'completed' ? <CheckCircle size={16} /> : <GitBranch size={16} />}
          message={
            <div className="flex items-center justify-between">
              <span>
                操作流 <span className="font-medium">{workflow.templateName}</span> {WORKFLOW_STATUS_NAMES[workflow.status]}
              </span>
              <Button type="link" size="small" onClick={() => setWorkflowModalVisible(true)}>查看执行详情</Button>
            </div>
          }
          description={
            workflow.status === 'running' && (
              <div className="mt-2">
                <Progress percent={workflow.progress || 0} size="small" status="active" />
                <div className="text-xs text-gray-500 mt-1">
                  当前步骤: {workflow.steps.find(s => s.status === 'running')?.name || '-'}
                </div>
              </div>
            )
          }
        />
      )}

      {/* 绑定操作流提示 */}
      {!workflow && boundWorkflows.length > 0 && request.status === 'pending' && (
        <Alert
          type="info"
          showIcon
          icon={<GitBranch size={16} />}
          message="关联操作流"
          description={
            <div>
              <span>审批通过后将自动执行：</span>
              {boundWorkflows.map(w => <Tag key={w.id} color="purple" className="ml-2">{w.name}</Tag>)}
            </div>
          }
        />
      )}

      <Row gutter={16}>
        {/* 左侧：基本信息和内容预览 */}
        <Col span={16}>
          <Card title="申请信息" className="mb-4">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="申请类型">{APPROVAL_TYPE_NAMES[request.type]}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={getStatusColor(request.status)}>{APPROVAL_STATUS_NAMES[request.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="申请人">{request.applicant}</Descriptions.Item>
              <Descriptions.Item label="部门">{request.applicantDept || '-'}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={request.priority === 'urgent' ? 'red' : request.priority === 'high' ? 'orange' : 'blue'}>
                  {APPROVAL_PRIORITY_NAMES[request.priority]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">{new Date(request.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
              <Descriptions.Item label="申请说明" span={2}>{request.description}</Descriptions.Item>
              <Descriptions.Item label="通知渠道" span={2}>
                {request.notificationChannels.map(chId => {
                  const ch = mockNotificationChannels.find(c => c.id === chId);
                  return ch ? <Tag key={chId}>{ch.name}</Tag> : null;
                })}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="申请内容预览">{renderContentPreview()}</Card>
        </Col>

        {/* 右侧：审批流程和日志 */}
        <Col span={8}>
          <Card title="审批流程" className="mb-4">
            <Steps
              direction="vertical"
              size="small"
              current={getCurrentStep()}
              items={request.nodes.map(node => ({
                title: node.name,
                description: (
                  <div className="text-xs">
                    <div>{node.assigneeRole || node.assignee || '-'}</div>
                    {node.operatedAt && (
                      <div className="text-gray-400">{node.operatedBy} · {new Date(node.operatedAt).toLocaleString('zh-CN')}</div>
                    )}
                    {node.comment && <div className="text-gray-500 mt-1">"{node.comment}"</div>}
                  </div>
                ),
                status: node.status === 'approved' ? 'finish' : node.status === 'rejected' ? 'error' : node.status === 'pending' ? 'process' : 'wait',
              }))}
            />
          </Card>
          <Card title="审批日志">
            <Timeline
              items={request.logs.map(log => ({
                color: log.action.includes('驳回') ? 'red' : log.action.includes('通过') || log.action.includes('完成') ? 'green' : 'blue',
                children: (
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-gray-500 text-xs">{log.operator} · {new Date(log.operatedAt).toLocaleString('zh-CN')}</div>
                    {log.comment && <div className="text-gray-600 text-sm mt-1">{log.comment}</div>}
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* 审批通过弹窗 */}
      <Modal title="审批通过" open={approveModalVisible} onOk={handleApprove} onCancel={() => setApproveModalVisible(false)} okText="确认通过" cancelText="取消">
        <div className="py-4">
          {boundWorkflows.length > 0 && (
            <Alert type="info" message={`通过后将自动执行操作流: ${boundWorkflows.map(w => w.name).join(', ')}`} className="mb-4" />
          )}
          <p className="mb-2">审批意见（可选）：</p>
          <Input.TextArea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="请输入审批意见" />
        </div>
      </Modal>

      {/* 审批驳回弹窗 */}
      <Modal title="审批驳回" open={rejectModalVisible} onOk={handleReject} onCancel={() => setRejectModalVisible(false)} okText="确认驳回" okButtonProps={{ danger: true }} cancelText="取消">
        <div className="py-4">
          <p className="mb-2">驳回原因（必填）：</p>
          <Input.TextArea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="请输入驳回原因" />
        </div>
      </Modal>

      {/* 操作流执行详情弹窗 */}
      <Modal title="操作流执行详情" open={workflowModalVisible} onCancel={() => setWorkflowModalVisible(false)} footer={<Button onClick={() => setWorkflowModalVisible(false)}>关闭</Button>} width={750}>
        {workflow && (
          <>
            <Descriptions column={2} bordered size="small" className="mb-4">
              <Descriptions.Item label="操作流"><span className="font-medium">{workflow.name}</span></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={getStatusColor(workflow.status) as 'default' | 'processing' | 'success' | 'error' | 'warning'} text={WORKFLOW_STATUS_NAMES[workflow.status]} /></Descriptions.Item>
              <Descriptions.Item label="模板">{workflow.templateName}</Descriptions.Item>
              <Descriptions.Item label="进度"><Progress percent={workflow.progress || 0} size="small" status={workflow.status === 'failed' ? 'exception' : workflow.status === 'completed' ? 'success' : 'active'} /></Descriptions.Item>
            </Descriptions>
            <div className="mb-3 font-medium text-gray-900">执行步骤</div>
            <Timeline items={workflow.steps.map((step, idx) => ({
              dot: getStepIcon(step.status),
              children: (
                <div className={`pb-2 ${idx === workflow.steps.length - 1 ? '' : 'border-b border-gray-100'}`}>
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
                </div>
              ),
            }))} />
          </>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalDetail;
