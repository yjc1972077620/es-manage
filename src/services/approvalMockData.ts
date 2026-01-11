/**
 * 审批模块 Mock 数据
 */

import type {
  ApprovalRequest,
  ApprovalRequestType,
  ApprovalStatus,
} from '@/types';

// ==================== Mock 审批申请 ====================

export const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: 'approval-001',
    title: '新建用户行为日志索引',
    type: 'create_index',
    status: 'pending',
    applicant: '张三',
    applicantDept: '数据平台部',
    description: '业务需要存储用户行为日志数据，预计日增量 500 万条',
    content: {
      type: 'create_index',
      indexName: 'user-behavior-logs-2026',
      numberOfShards: 5,
      numberOfReplicas: 1,
      mappings: {
        properties: {
          userId: { type: 'keyword' },
          action: { type: 'keyword' },
          timestamp: { type: 'date' },
          details: { type: 'text' },
        },
      },
      aliases: ['user-behavior-logs'],
    },
    priority: 'high',
    nodes: [
      { id: 'node-1', name: '技术评审', type: 'approval', assigneeRole: '技术负责人', status: 'pending' },
      { id: 'node-2', name: 'DBA 审批', type: 'approval', assigneeRole: 'DBA', status: 'pending' },
      { id: 'node-3', name: '执行创建', type: 'execution', status: 'pending' },
    ],
    logs: [
      { id: 'log-1', action: '提交申请', operator: '张三', operatedAt: Date.now() - 3600000 },
    ],
    notificationChannels: ['channel-001', 'channel-003'],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'approval-002',
    title: '修改订单索引别名',
    type: 'update_alias',
    status: 'approved',
    applicant: '李四',
    applicantDept: '电商业务部',
    description: '需要将 orders-2025 别名切换到新索引 orders-2026',
    content: {
      type: 'update_alias',
      aliasName: 'orders-current',
      indexName: 'orders-2026',
    },
    priority: 'urgent',
    nodes: [
      { id: 'node-1', name: '技术评审', type: 'approval', assigneeRole: '技术负责人', status: 'approved', operatedAt: Date.now() - 7200000, operatedBy: '王五', comment: '同意切换' },
      { id: 'node-2', name: 'DBA 审批', type: 'approval', assigneeRole: 'DBA', status: 'approved', operatedAt: Date.now() - 3600000, operatedBy: '赵六', comment: '已确认新索引数据完整' },
      { id: 'node-3', name: '执行操作', type: 'execution', status: 'pending' },
    ],
    logs: [
      { id: 'log-1', action: '提交申请', operator: '李四', operatedAt: Date.now() - 86400000 },
      { id: 'log-2', action: '技术评审通过', operator: '王五', operatedAt: Date.now() - 7200000, comment: '同意切换' },
      { id: 'log-3', action: 'DBA 审批通过', operator: '赵六', operatedAt: Date.now() - 3600000, comment: '已确认新索引数据完整' },
    ],
    notificationChannels: ['channel-001', 'channel-002'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'approval-003',
    title: '删除过期日志索引',
    type: 'delete_index',
    status: 'completed',
    applicant: '王五',
    applicantDept: '运维部',
    description: '清理 2024 年之前的日志索引，释放存储空间',
    content: {
      type: 'delete_index',
      indexName: 'app-logs-2023-*',
      reason: '数据已归档，需要释放存储空间',
      backupRequired: true,
    },
    priority: 'normal',
    nodes: [
      { id: 'node-1', name: '技术评审', type: 'approval', assigneeRole: '技术负责人', status: 'approved', operatedAt: Date.now() - 172800000, operatedBy: '张三' },
      { id: 'node-2', name: 'DBA 审批', type: 'approval', assigneeRole: 'DBA', status: 'approved', operatedAt: Date.now() - 86400000, operatedBy: '赵六' },
      { id: 'node-3', name: '执行删除', type: 'execution', status: 'approved', operatedAt: Date.now() - 43200000, operatedBy: 'system' },
    ],
    logs: [
      { id: 'log-1', action: '提交申请', operator: '王五', operatedAt: Date.now() - 259200000 },
      { id: 'log-2', action: '技术评审通过', operator: '张三', operatedAt: Date.now() - 172800000 },
      { id: 'log-3', action: 'DBA 审批通过', operator: '赵六', operatedAt: Date.now() - 86400000 },
      { id: 'log-4', action: '执行完成', operator: 'system', operatedAt: Date.now() - 43200000, comment: '已删除 15 个索引，释放 120GB 空间' },
    ],
    notificationChannels: ['channel-001'],
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 43200000,
    completedAt: Date.now() - 43200000,
  },
  {
    id: 'approval-004',
    title: '新增商品索引字段映射',
    type: 'update_mapping',
    status: 'rejected',
    applicant: '赵六',
    applicantDept: '商品中心',
    description: '需要为商品索引添加新的标签字段',
    content: {
      type: 'update_mapping',
      indexName: 'products',
      mappings: {
        properties: {
          tags: { type: 'keyword' },
          tagCount: { type: 'integer' },
        },
      },
      reason: '支持商品标签功能上线',
    },
    priority: 'normal',
    nodes: [
      { id: 'node-1', name: '技术评审', type: 'approval', assigneeRole: '技术负责人', status: 'rejected', operatedAt: Date.now() - 86400000, operatedBy: '张三', comment: '建议使用 nested 类型存储标签' },
      { id: 'node-2', name: 'DBA 审批', type: 'approval', assigneeRole: 'DBA', status: 'skipped' },
      { id: 'node-3', name: '执行操作', type: 'execution', status: 'skipped' },
    ],
    logs: [
      { id: 'log-1', action: '提交申请', operator: '赵六', operatedAt: Date.now() - 172800000 },
      { id: 'log-2', action: '技术评审驳回', operator: '张三', operatedAt: Date.now() - 86400000, comment: '建议使用 nested 类型存储标签，请修改后重新提交' },
    ],
    notificationChannels: ['channel-003'],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'approval-005',
    title: '创建搜索建议管道',
    type: 'create_pipeline',
    status: 'processing',
    applicant: '李四',
    applicantDept: '搜索团队',
    description: '创建用于处理搜索建议数据的 ingest pipeline',
    content: {
      type: 'create_pipeline',
      pipelineName: 'search-suggestion-pipeline',
      description: '处理搜索建议数据，包括分词和权重计算',
      processors: [
        { set: { field: 'processed_at', value: '{{_ingest.timestamp}}' } },
        { lowercase: { field: 'keyword' } },
      ],
    },
    priority: 'normal',
    nodes: [
      { id: 'node-1', name: '技术评审', type: 'approval', assigneeRole: '技术负责人', status: 'approved', operatedAt: Date.now() - 7200000, operatedBy: '王五' },
      { id: 'node-2', name: 'DBA 审批', type: 'approval', assigneeRole: 'DBA', status: 'approved', operatedAt: Date.now() - 3600000, operatedBy: '赵六' },
      { id: 'node-3', name: '执行创建', type: 'execution', status: 'pending' },
    ],
    logs: [
      { id: 'log-1', action: '提交申请', operator: '李四', operatedAt: Date.now() - 86400000 },
      { id: 'log-2', action: '技术评审通过', operator: '王五', operatedAt: Date.now() - 7200000 },
      { id: 'log-3', action: 'DBA 审批通过', operator: '赵六', operatedAt: Date.now() - 3600000 },
      { id: 'log-4', action: '开始执行', operator: 'system', operatedAt: Date.now() - 1800000 },
    ],
    notificationChannels: ['channel-001', 'channel-002'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 1800000,
  },
];


// ==================== 名称映射 ====================

export const APPROVAL_TYPE_NAMES: Record<ApprovalRequestType, string> = {
  create_index: '新建索引',
  delete_index: '删除索引',
  update_mapping: '修改映射',
  update_settings: '修改设置',
  create_alias: '创建别名',
  delete_alias: '删除别名',
  update_alias: '修改别名',
  create_template: '创建模板',
  delete_template: '删除模板',
  create_pipeline: '创建管道',
  delete_pipeline: '删除管道',
  reindex: '重建索引',
  other: '其他操作',
};

export const APPROVAL_STATUS_NAMES: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已取消',
  processing: '处理中',
  completed: '已完成',
  failed: '执行失败',
};

export const APPROVAL_PRIORITY_NAMES: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
};

export const APPROVAL_NODE_STATUS_NAMES: Record<string, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已驳回',
  skipped: '已跳过',
};

// ==================== 辅助函数 ====================

/** 生成审批统计 */
export function generateApprovalStatistics() {
  const requests = mockApprovalRequests;
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    processing: requests.filter(r => r.status === 'processing').length,
    completed: requests.filter(r => r.status === 'completed').length,
    byType: Object.keys(APPROVAL_TYPE_NAMES).reduce((acc, type) => {
      acc[type] = requests.filter(r => r.type === type).length;
      return acc;
    }, {} as Record<string, number>),
  };
}
