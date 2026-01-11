/**
 * 操作流模块 Mock 数据
 * 包含原子操作、操作流模板、操作流实例、执行记录
 */

import type { WorkflowTemplate, WorkflowInstance, WorkflowStepType, AtomicOperation, AtomicOperationType, ApprovalRequestType, WorkflowExecutionRecord } from '@/types';

// ==================== 原子操作定义 ====================

export const atomicOperations: AtomicOperation[] = [
  {
    id: 'op-001',
    name: '读取索引配置',
    type: 'read_index_config',
    description: '读取已有索引的设置、映射等配置信息',
    apiConfig: {
      method: 'GET',
      endpoint: '/{{indexName}}',
      successCondition: 'response.status === 200',
    },
    inputSchema: { indexName: { type: 'string', required: true, description: '索引名称' } },
    outputSchema: { settings: { type: 'object' }, mappings: { type: 'object' } },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-002',
    name: '创建索引',
    type: 'create_index',
    description: '创建新的 Elasticsearch 索引',
    apiConfig: {
      method: 'PUT',
      endpoint: '/{{indexName}}',
      body: '{\n  "settings": {{settings}},\n  "mappings": {{mappings}}\n}',
      successCondition: 'response.acknowledged === true',
    },
    inputSchema: {
      indexName: { type: 'string', required: true, description: '索引名称' },
      settings: { type: 'object', description: '索引设置' },
      mappings: { type: 'object', description: '映射定义' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-003',
    name: '数据迁移 (Reindex)',
    type: 'reindex',
    description: '将数据从源索引迁移到目标索引',
    apiConfig: {
      method: 'POST',
      endpoint: '/_reindex?wait_for_completion=true',
      body: '{\n  "source": { "index": "{{sourceIndex}}" },\n  "dest": { "index": "{{destIndex}}" }\n}',
      successCondition: 'response.failures.length === 0',
    },
    inputSchema: {
      sourceIndex: { type: 'string', required: true, description: '源索引' },
      destIndex: { type: 'string', required: true, description: '目标索引' },
      script: { type: 'string', description: 'Painless脚本' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-004',
    name: '切换别名',
    type: 'switch_alias',
    description: '原子性地将别名从一个索引切换到另一个索引',
    apiConfig: {
      method: 'POST',
      endpoint: '/_aliases',
      body: '{\n  "actions": [\n    { "remove": { "index": "{{oldIndex}}", "alias": "{{alias}}" } },\n    { "add": { "index": "{{newIndex}}", "alias": "{{alias}}" } }\n  ]\n}',
      successCondition: 'response.acknowledged === true',
    },
    inputSchema: {
      alias: { type: 'string', required: true, description: '别名' },
      oldIndex: { type: 'string', required: true, description: '旧索引' },
      newIndex: { type: 'string', required: true, description: '新索引' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-005',
    name: '删除索引',
    type: 'delete_index',
    description: '删除指定的索引',
    apiConfig: {
      method: 'DELETE',
      endpoint: '/{{indexName}}',
      successCondition: 'response.acknowledged === true',
    },
    inputSchema: { indexName: { type: 'string', required: true, description: '索引名称' } },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-006',
    name: '验证数据',
    type: 'verify_data',
    description: '验证数据完整性，比较文档数量',
    apiConfig: {
      method: 'GET',
      endpoint: '/{{sourceIndex}},{{targetIndex}}/_count',
      successCondition: 'true',
    },
    inputSchema: {
      sourceIndex: { type: 'string', required: true, description: '源索引' },
      targetIndex: { type: 'string', required: true, description: '目标索引' },
    },
    outputSchema: { sourceCount: { type: 'number' }, targetCount: { type: 'number' }, match: { type: 'boolean' } },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-007',
    name: '创建别名',
    type: 'create_alias',
    description: '为索引创建别名',
    apiConfig: {
      method: 'POST',
      endpoint: '/_aliases',
      body: '{\n  "actions": [\n    { "add": { "index": "{{indexName}}", "alias": "{{alias}}" } }\n  ]\n}',
      successCondition: 'response.acknowledged === true',
    },
    inputSchema: {
      indexName: { type: 'string', required: true, description: '索引名称' },
      alias: { type: 'string', required: true, description: '别名' },
      filter: { type: 'object', description: '过滤条件' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-008',
    name: '备份索引',
    type: 'backup_index',
    description: '创建索引快照备份',
    apiConfig: {
      method: 'PUT',
      endpoint: '/_snapshot/{{repository}}/{{snapshotName}}',
      body: '{\n  "indices": "{{indexName}}",\n  "ignore_unavailable": true\n}',
      successCondition: 'response.accepted === true',
    },
    inputSchema: {
      indexName: { type: 'string', required: true, description: '索引名称' },
      repository: { type: 'string', required: true, description: '仓库名称' },
      snapshotName: { type: 'string', description: '快照名称' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-009',
    name: '更新映射',
    type: 'update_mapping',
    description: '更新索引映射（只能添加字段）',
    apiConfig: {
      method: 'PUT',
      endpoint: '/{{indexName}}/_mapping',
      body: '{{mappings}}',
      successCondition: 'response.acknowledged === true',
    },
    inputSchema: {
      indexName: { type: 'string', required: true, description: '索引名称' },
      mappings: { type: 'object', required: true, description: '映射定义' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-010',
    name: '更新设置',
    type: 'update_settings',
    description: '更新索引设置',
    apiConfig: {
      method: 'PUT',
      endpoint: '/{{indexName}}/_settings',
      body: '{{settings}}',
      successCondition: 'response.acknowledged === true',
    },
    inputSchema: {
      indexName: { type: 'string', required: true, description: '索引名称' },
      settings: { type: 'object', required: true, description: '设置' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
  {
    id: 'op-011',
    name: '删除别名',
    type: 'delete_alias',
    description: '删除索引别名',
    apiConfig: {
      method: 'POST',
      endpoint: '/_aliases',
      body: '{\n  "actions": [\n    { "remove": { "index": "{{indexName}}", "alias": "{{alias}}" } }\n  ]\n}',
      successCondition: 'response.acknowledged === true',
    },
    inputSchema: {
      indexName: { type: 'string', required: true, description: '索引名称' },
      alias: { type: 'string', required: true, description: '别名' },
    },
    isBuiltin: true,
    createdAt: Date.now() - 90 * 86400000,
  },
];

// ==================== 原子操作名称映射 ====================

export const ATOMIC_OPERATION_NAMES: Record<AtomicOperationType, string> = {
  read_index_config: '读取索引配置',
  create_index: '创建索引',
  update_mapping: '更新映射',
  update_settings: '更新设置',
  reindex: '数据迁移',
  create_alias: '创建别名',
  switch_alias: '切换别名',
  delete_alias: '删除别名',
  delete_index: '删除索引',
  verify_data: '验证数据',
  backup_index: '备份索引',
  custom_api: '自定义API',
  custom_script: '自定义脚本',
};

export const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  HEAD: 'purple',
};

// ==================== 内置操作流模板 ====================

export const builtinWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-001',
    name: '索引映射变更',
    description: '修改索引映射：读取配置 → 创建新索引 → 迁移数据 → 验证 → 切换别名 → 删除旧索引',
    category: 'migration',
    isBuiltin: true,
    boundApprovalTypes: ['update_mapping'],
    steps: [
      { name: '读取源索引配置', type: 'read_index_config', description: '读取源索引的设置和映射', config: { indexName: '{{sourceIndex}}' } },
      { name: '创建新索引', type: 'create_index', description: '基于修改后的映射创建新索引', config: { indexName: '{{targetIndex}}', copyFrom: '{{sourceIndex}}' } },
      { name: '迁移数据', type: 'reindex', description: '将数据从旧索引迁移到新索引', config: { sourceIndex: '{{sourceIndex}}', destIndex: '{{targetIndex}}' } },
      { name: '验证数据', type: 'verify_data', description: '验证迁移后的数据完整性', config: { sourceIndex: '{{sourceIndex}}', targetIndex: '{{targetIndex}}' } },
      { name: '切换别名', type: 'switch_alias', description: '将别名切换到新索引', config: { alias: '{{alias}}', oldIndex: '{{sourceIndex}}', newIndex: '{{targetIndex}}' } },
      { name: '删除旧索引', type: 'delete_index', description: '删除旧索引释放空间', config: { indexName: '{{sourceIndex}}' } },
      { name: '完成通知', type: 'notification', description: '通知相关人员变更完成', config: { channels: [] } },
    ],
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'tpl-002',
    name: '新建业务索引',
    description: '创建新的业务索引并配置别名',
    category: 'index',
    isBuiltin: true,
    boundApprovalTypes: ['create_index'],
    steps: [
      { name: '创建索引', type: 'create_index', description: '创建新索引', config: {} },
      { name: '创建别名', type: 'create_alias', description: '为索引创建别名', config: {} },
      { name: '完成通知', type: 'notification', description: '通知申请人索引已创建', config: {} },
    ],
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'tpl-003',
    name: '别名切换',
    description: '将别名从一个索引切换到另一个索引',
    category: 'alias',
    isBuiltin: true,
    boundApprovalTypes: ['update_alias'],
    steps: [
      { name: '切换别名', type: 'switch_alias', description: '原子切换别名', config: {} },
      { name: '完成通知', type: 'notification', description: '通知相关人员', config: {} },
    ],
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'tpl-004',
    name: '索引数据迁移',
    description: '将数据从一个索引迁移到另一个索引（含备份）',
    category: 'migration',
    isBuiltin: true,
    boundApprovalTypes: ['reindex'],
    steps: [
      { name: '备份源索引', type: 'backup_index', description: '创建源索引快照', config: { repository: 'default' } },
      { name: '执行迁移', type: 'reindex', description: '执行 reindex 操作', config: {} },
      { name: '验证数据', type: 'verify_data', description: '验证迁移后的数据完整性', config: {} },
      { name: '完成通知', type: 'notification', description: '通知迁移完成', config: {} },
    ],
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000,
  },
  {
    id: 'tpl-005',
    name: '索引删除（含备份）',
    description: '安全删除索引：先备份再删除',
    category: 'index',
    isBuiltin: true,
    boundApprovalTypes: ['delete_index'],
    steps: [
      { name: '备份索引', type: 'backup_index', description: '创建索引快照备份', config: { repository: 'default' } },
      { name: '删除索引', type: 'delete_index', description: '删除索引', config: {} },
      { name: '完成通知', type: 'notification', description: '通知删除完成', config: {} },
    ],
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 30 * 86400000,
  },
];

// ==================== Mock 操作流实例 ====================

export const mockWorkflowInstances: WorkflowInstance[] = [
  {
    id: 'wf-001',
    templateId: 'tpl-001',
    templateName: '索引映射变更',
    name: '用户索引字段扩展',
    description: '为用户索引添加新的标签字段',
    status: 'running',
    currentStepIndex: 2,
    progress: 45,
    triggerType: 'approval',
    variables: {
      sourceIndex: 'users-v1',
      targetIndex: 'users-v2',
      alias: 'users',
    },
    steps: [
      { id: 's1', name: '读取源索引配置', type: 'read_index_config', config: {}, status: 'completed', completedAt: Date.now() - 5400000, result: { success: true, message: '配置读取成功', data: { shards: 5, replicas: 1 }, duration: 1200 } },
      { id: 's2', name: '创建新索引', type: 'create_index', config: {}, status: 'completed', completedAt: Date.now() - 3600000, result: { success: true, message: '索引 users-v2 创建成功', duration: 2500 } },
      { id: 's3', name: '迁移数据', type: 'reindex', config: {}, status: 'running', startedAt: Date.now() - 1800000, result: { success: true, message: '已迁移 45000/100000 文档', data: { progress: 45, docsProcessed: 45000, totalDocs: 100000 } } },
      { id: 's4', name: '验证数据', type: 'verify_data', config: {}, status: 'pending' },
      { id: 's5', name: '切换别名', type: 'switch_alias', config: {}, status: 'pending' },
      { id: 's6', name: '删除旧索引', type: 'delete_index', config: {}, status: 'pending' },
      { id: 's7', name: '完成通知', type: 'notification', config: {}, status: 'pending' },
    ],
    approvalId: 'approval-001',
    createdBy: '张三',
    createdAt: Date.now() - 86400000,
    startedAt: Date.now() - 7200000,
    updatedAt: Date.now() - 60000,
  },
  {
    id: 'wf-002',
    templateId: 'tpl-002',
    templateName: '新建业务索引',
    name: '创建订单归档索引',
    description: '创建用于存储历史订单的归档索引',
    status: 'pending_approval',
    currentStepIndex: 0,
    progress: 0,
    triggerType: 'approval',
    variables: {
      indexName: 'orders-archive-2024',
      alias: 'orders-archive',
    },
    steps: [
      { id: 's1', name: '创建索引', type: 'create_index', config: {}, status: 'pending' },
      { id: 's2', name: '创建别名', type: 'create_alias', config: {}, status: 'pending' },
      { id: 's3', name: '完成通知', type: 'notification', config: {}, status: 'pending' },
    ],
    approvalId: 'approval-002',
    createdBy: '李四',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'wf-003',
    templateId: 'tpl-003',
    templateName: '别名切换',
    name: '日志索引别名切换',
    description: '将 logs-current 别名切换到新的月度索引',
    status: 'completed',
    currentStepIndex: 1,
    progress: 100,
    triggerType: 'approval',
    variables: {
      alias: 'logs-current',
      oldIndex: 'logs-2024-01',
      newIndex: 'logs-2024-02',
    },
    steps: [
      { id: 's1', name: '切换别名', type: 'switch_alias', config: {}, status: 'completed', completedAt: Date.now() - 86400000, result: { success: true, message: '别名切换成功', duration: 150 } },
      { id: 's2', name: '完成通知', type: 'notification', config: {}, status: 'completed', completedAt: Date.now() - 86400000, result: { success: true, duration: 500 } },
    ],
    createdBy: '王五',
    createdAt: Date.now() - 259200000,
    startedAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000,
    completedAt: Date.now() - 86400000,
  },
  {
    id: 'wf-004',
    templateId: 'tpl-004',
    templateName: '索引数据迁移',
    name: '产品索引迁移',
    description: '将产品数据迁移到新集群',
    status: 'failed',
    currentStepIndex: 2,
    progress: 40,
    triggerType: 'manual',
    variables: {
      sourceIndex: 'products-old',
      targetIndex: 'products-new',
    },
    steps: [
      { id: 's1', name: '备份源索引', type: 'backup_index', config: {}, status: 'completed', completedAt: Date.now() - 36000000, result: { success: true, message: '快照创建成功', duration: 120000 } },
      { id: 's2', name: '执行迁移', type: 'reindex', config: {}, status: 'failed', completedAt: Date.now() - 28800000, error: '目标索引磁盘空间不足', result: { success: false, message: '迁移失败: 磁盘空间不足' } },
      { id: 's3', name: '验证数据', type: 'verify_data', config: {}, status: 'skipped' },
      { id: 's4', name: '完成通知', type: 'notification', config: {}, status: 'skipped' },
    ],
    createdBy: '赵六',
    createdAt: Date.now() - 86400000,
    startedAt: Date.now() - 43200000,
    updatedAt: Date.now() - 28800000,
  },
];

// ==================== 执行记录 ====================

export const mockExecutionRecords: WorkflowExecutionRecord[] = [
  ...mockWorkflowInstances.filter(i => i.status !== 'pending_approval').map(i => ({
    id: `exec-${i.id}`,
    workflowId: i.id,
    workflowName: i.name,
    templateId: i.templateId,
    templateName: i.templateName,
    status: i.status,
    triggerType: i.triggerType || 'manual' as const,
    approvalId: i.approvalId,
    steps: i.steps,
    variables: i.variables,
    createdBy: i.createdBy,
    createdAt: i.createdAt,
    startedAt: i.startedAt,
    completedAt: i.completedAt,
    duration: i.completedAt && i.startedAt ? i.completedAt - i.startedAt : undefined,
  })),
];

// ==================== 名称映射 ====================

export const WORKFLOW_STEP_TYPE_NAMES: Record<WorkflowStepType, string> = {
  read_index_config: '读取配置',
  create_index: '创建索引',
  update_mapping: '更新映射',
  update_settings: '更新设置',
  reindex: '数据迁移',
  create_alias: '创建别名',
  switch_alias: '切换别名',
  delete_alias: '删除别名',
  delete_index: '删除索引',
  verify_data: '验证数据',
  backup_index: '备份索引',
  custom_api: '自定义API',
  custom_script: '自定义脚本',
  approval: '审批',
  notification: '通知',
};

export const WORKFLOW_STATUS_NAMES: Record<string, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已审批',
  running: '执行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
};

export const WORKFLOW_CATEGORY_NAMES: Record<string, string> = {
  index: '索引操作',
  alias: '别名操作',
  migration: '数据迁移',
  custom: '自定义',
};

// 审批类型与操作流模板的绑定关系
export const APPROVAL_WORKFLOW_BINDINGS: Record<ApprovalRequestType, string[]> = {
  create_index: ['tpl-002'],
  delete_index: ['tpl-005'],
  update_mapping: ['tpl-001'],
  update_settings: [],
  create_alias: [],
  delete_alias: [],
  update_alias: ['tpl-003'],
  create_template: [],
  delete_template: [],
  create_pipeline: [],
  delete_pipeline: [],
  reindex: ['tpl-004'],
  other: [],
};
