/**
 * 开发者控制台页面
 * 类似 Kibana Dev Tools，支持执行 ES 查询
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Button, Select, Input, message, Tabs, Row, Col, Collapse, Tag, Tooltip, Modal, Form, Popconfirm,
} from 'antd';
import { Play, Trash2, Copy, History, Plus, Edit, Star } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';

const { TextArea } = Input;

// 查询示例分类
interface QueryExample {
  id?: string;
  label: string;
  description?: string;
  method: string;
  path: string;
  body: string;
  isCustom?: boolean;
}

interface QueryCategory {
  key: string;
  label: string;
  examples: QueryExample[];
}

// 自定义模板存储键
const CUSTOM_TEMPLATES_KEY = 'devtools_custom_templates';

// 内置查询示例分类
const BUILTIN_CATEGORIES: QueryCategory[] = [
  {
    key: 'cluster',
    label: '集群操作',
    examples: [
      { label: '集群健康状态', description: '查看集群整体健康状况', method: 'GET', path: '/_cluster/health', body: '' },
      { label: '集群统计信息', description: '获取集群详细统计', method: 'GET', path: '/_cluster/stats', body: '' },
      { label: '集群设置', description: '查看集群配置', method: 'GET', path: '/_cluster/settings?include_defaults=true', body: '' },
      { label: '待处理任务', description: '查看集群待处理任务', method: 'GET', path: '/_cluster/pending_tasks', body: '' },
      { label: '集群分配解释', description: '解释分片分配决策', method: 'GET', path: '/_cluster/allocation/explain', body: JSON.stringify({ index: 'my-index', shard: 0, primary: true }, null, 2) },
      { label: '更新集群设置', description: '动态更新集群配置', method: 'PUT', path: '/_cluster/settings', body: JSON.stringify({ persistent: { 'cluster.routing.allocation.enable': 'all' } }, null, 2) },
    ],
  },
  {
    key: 'node',
    label: '节点操作',
    examples: [
      { label: '节点信息', description: '查看所有节点信息', method: 'GET', path: '/_nodes', body: '' },
      { label: '节点统计', description: '获取节点详细统计', method: 'GET', path: '/_nodes/stats', body: '' },
      { label: '热点线程', description: '查看节点热点线程', method: 'GET', path: '/_nodes/hot_threads', body: '' },
      { label: '节点使用情况', description: '查看节点资源使用', method: 'GET', path: '/_nodes/usage', body: '' },
    ],
  },
  {
    key: 'index',
    label: '索引操作',
    examples: [
      { label: '查看所有索引', description: '列出所有索引', method: 'GET', path: '/_cat/indices?v&s=index', body: '' },
      { label: '创建索引', description: '创建新索引', method: 'PUT', path: '/my-new-index', body: JSON.stringify({ settings: { number_of_shards: 3, number_of_replicas: 1 }, mappings: { properties: { title: { type: 'text' }, created_at: { type: 'date' }, status: { type: 'keyword' } } } }, null, 2) },
      { label: '删除索引', description: '删除指定索引', method: 'DELETE', path: '/my-index', body: '' },
      { label: '索引设置', description: '查看索引设置', method: 'GET', path: '/my-index/_settings', body: '' },
      { label: '索引映射', description: '查看索引映射', method: 'GET', path: '/my-index/_mapping', body: '' },
      { label: '更新映射', description: '添加新字段映射', method: 'PUT', path: '/my-index/_mapping', body: JSON.stringify({ properties: { new_field: { type: 'keyword' } } }, null, 2) },
      { label: '刷新索引', description: '刷新索引使文档可搜索', method: 'POST', path: '/my-index/_refresh', body: '' },
      { label: '强制合并', description: '强制合并索引段', method: 'POST', path: '/my-index/_forcemerge?max_num_segments=1', body: '' },
    ],
  },
  {
    key: 'alias',
    label: '别名操作',
    examples: [
      { label: '查看所有别名', description: '列出所有索引别名', method: 'GET', path: '/_cat/aliases?v', body: '' },
      { label: '创建别名', description: '为索引创建别名', method: 'POST', path: '/_aliases', body: JSON.stringify({ actions: [{ add: { index: 'my-index', alias: 'my-alias' } }] }, null, 2) },
      { label: '删除别名', description: '删除索引别名', method: 'POST', path: '/_aliases', body: JSON.stringify({ actions: [{ remove: { index: 'my-index', alias: 'my-alias' } }] }, null, 2) },
      { label: '切换别名', description: '原子切换别名到新索引', method: 'POST', path: '/_aliases', body: JSON.stringify({ actions: [{ remove: { index: 'old-index', alias: 'my-alias' } }, { add: { index: 'new-index', alias: 'my-alias' } }] }, null, 2) },
    ],
  },
  {
    key: 'search',
    label: '搜索查询',
    examples: [
      { label: 'Match All', description: '匹配所有文档', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { match_all: {} }, size: 10 }, null, 2) },
      { label: 'Match 查询', description: '全文匹配查询', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { match: { title: '搜索关键词' } } }, null, 2) },
      { label: 'Multi Match', description: '多字段匹配', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { multi_match: { query: '搜索词', fields: ['title^2', 'content', 'tags'] } } }, null, 2) },
      { label: 'Term 精确查询', description: '精确值匹配', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { term: { status: { value: 'published' } } } }, null, 2) },
      { label: 'Range 范围查询', description: '范围条件查询', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { range: { created_at: { gte: '2024-01-01', lte: '2024-12-31' } } } }, null, 2) },
      { label: 'Bool 组合查询', description: '布尔组合查询', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { bool: { must: [{ match: { title: '关键词' } }], filter: [{ term: { status: 'published' } }], must_not: [{ term: { deleted: true } }] } } }, null, 2) },
      { label: '高亮显示', description: '搜索结果高亮', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { match: { content: '关键词' } }, highlight: { fields: { content: {} } } }, null, 2) },
      { label: '排序和分页', description: '结果排序与分页', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { match_all: {} }, sort: [{ created_at: 'desc' }], from: 0, size: 20 }, null, 2) },
    ],
  },
  {
    key: 'aggregation',
    label: '聚合查询',
    examples: [
      { label: 'Terms 聚合', description: '按字段值分组统计', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ size: 0, aggs: { status_count: { terms: { field: 'status', size: 10 } } } }, null, 2) },
      { label: '数值统计聚合', description: '计算数值字段统计', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ size: 0, aggs: { price_stats: { stats: { field: 'price' } } } }, null, 2) },
      { label: '日期直方图', description: '按时间间隔分组', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ size: 0, aggs: { daily_count: { date_histogram: { field: 'created_at', calendar_interval: 'day' } } } }, null, 2) },
      { label: '嵌套聚合', description: '多层聚合', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ size: 0, aggs: { by_category: { terms: { field: 'category' }, aggs: { avg_price: { avg: { field: 'price' } } } } } }, null, 2) },
      { label: 'Cardinality 去重', description: '统计唯一值数量', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ size: 0, aggs: { unique_users: { cardinality: { field: 'user_id' } } } }, null, 2) },
      { label: 'Percentiles 百分位', description: '计算百分位数', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ size: 0, aggs: { response_percentiles: { percentiles: { field: 'response_time', percents: [50, 90, 95, 99] } } } }, null, 2) },
    ],
  },
  {
    key: 'pipeline',
    label: 'Ingest 管道',
    examples: [
      { label: '查看所有管道', description: '列出所有 ingest 管道', method: 'GET', path: '/_ingest/pipeline', body: '' },
      { label: '创建管道', description: '创建数据处理管道', method: 'PUT', path: '/_ingest/pipeline/my-pipeline', body: JSON.stringify({ description: '数据处理管道', processors: [{ set: { field: 'processed_at', value: '{{_ingest.timestamp}}' } }, { lowercase: { field: 'message' } }] }, null, 2) },
      { label: 'Grok 解析管道', description: '使用 Grok 解析日志', method: 'PUT', path: '/_ingest/pipeline/grok-pipeline', body: JSON.stringify({ description: 'Grok 日志解析', processors: [{ grok: { field: 'message', patterns: ['%{IP:client_ip} %{WORD:method} %{URIPATHPARAM:request}'] } }] }, null, 2) },
      { label: '模拟管道', description: '测试管道处理效果', method: 'POST', path: '/_ingest/pipeline/my-pipeline/_simulate', body: JSON.stringify({ docs: [{ _source: { message: 'TEST MESSAGE' } }] }, null, 2) },
      { label: '删除管道', description: '删除指定管道', method: 'DELETE', path: '/_ingest/pipeline/my-pipeline', body: '' },
    ],
  },
  {
    key: 'template',
    label: '索引模板',
    examples: [
      { label: '查看所有模板', description: '列出所有索引模板', method: 'GET', path: '/_index_template', body: '' },
      { label: '创建索引模板', description: '创建新的索引模板', method: 'PUT', path: '/_index_template/logs-template', body: JSON.stringify({ index_patterns: ['logs-*'], priority: 100, template: { settings: { number_of_shards: 3 }, mappings: { properties: { '@timestamp': { type: 'date' }, message: { type: 'text' } } } } }, null, 2) },
      { label: '删除模板', description: '删除索引模板', method: 'DELETE', path: '/_index_template/my-template', body: '' },
    ],
  },
  {
    key: 'document',
    label: '文档操作',
    examples: [
      { label: '获取文档', description: '根据ID获取文档', method: 'GET', path: '/my-index/_doc/1', body: '' },
      { label: '创建文档', description: '创建指定ID的文档', method: 'PUT', path: '/my-index/_doc/1', body: JSON.stringify({ title: '文档标题', content: '文档内容', created_at: '2024-01-15T10:30:00Z' }, null, 2) },
      { label: '更新文档', description: '部分更新文档', method: 'POST', path: '/my-index/_update/1', body: JSON.stringify({ doc: { status: 'updated' } }, null, 2) },
      { label: '删除文档', description: '删除指定文档', method: 'DELETE', path: '/my-index/_doc/1', body: '' },
      { label: '批量操作', description: 'Bulk API 批量处理', method: 'POST', path: '/_bulk', body: '{"index":{"_index":"my-index","_id":"1"}}\n{"title":"文档1"}\n{"index":{"_index":"my-index","_id":"2"}}\n{"title":"文档2"}\n' },
      { label: '按查询删除', description: '删除匹配的文档', method: 'POST', path: '/my-index/_delete_by_query', body: JSON.stringify({ query: { range: { created_at: { lt: 'now-30d' } } } }, null, 2) },
    ],
  },
  {
    key: 'reindex',
    label: '重建索引',
    examples: [
      { label: '基本重建索引', description: '复制索引到新索引', method: 'POST', path: '/_reindex', body: JSON.stringify({ source: { index: 'old-index' }, dest: { index: 'new-index' } }, null, 2) },
      { label: '带查询的重建', description: '只复制匹配的文档', method: 'POST', path: '/_reindex', body: JSON.stringify({ source: { index: 'old-index', query: { range: { created_at: { gte: '2024-01-01' } } } }, dest: { index: 'new-index' } }, null, 2) },
      { label: '异步重建', description: '后台执行重建', method: 'POST', path: '/_reindex?wait_for_completion=false', body: JSON.stringify({ source: { index: 'old-index' }, dest: { index: 'new-index' } }, null, 2) },
    ],
  },
  {
    key: 'task',
    label: '任务管理',
    examples: [
      { label: '查看所有任务', description: '列出正在执行的任务', method: 'GET', path: '/_tasks', body: '' },
      { label: '查看详细任务', description: '包含任务详情', method: 'GET', path: '/_tasks?detailed=true', body: '' },
      { label: '取消任务', description: '取消正在执行的任务', method: 'POST', path: '/_tasks/node_id:task_id/_cancel', body: '' },
    ],
  },
  {
    key: 'script',
    label: '脚本操作',
    examples: [
      { label: '存储脚本', description: '保存可复用脚本', method: 'PUT', path: '/_scripts/calculate-score', body: JSON.stringify({ script: { lang: 'painless', source: "doc['likes'].value * 2 + doc['views'].value" } }, null, 2) },
      { label: '脚本查询', description: '使用脚本进行查询', method: 'POST', path: '/my-index/_search', body: JSON.stringify({ query: { script_score: { query: { match_all: {} }, script: { source: "_score * doc['boost'].value" } } } }, null, 2) },
    ],
  },
  {
    key: 'analyzer',
    label: '分析器',
    examples: [
      { label: '标准分析器', description: '使用标准分析器', method: 'POST', path: '/_analyze', body: JSON.stringify({ analyzer: 'standard', text: 'Hello World 你好世界' }, null, 2) },
      { label: '中文分析器', description: '使用中文分析器', method: 'POST', path: '/_analyze', body: JSON.stringify({ analyzer: 'ik_max_word', text: '中华人民共和国国歌' }, null, 2) },
    ],
  },
  {
    key: 'cat',
    label: 'CAT API',
    examples: [
      { label: '索引列表', description: '查看所有索引', method: 'GET', path: '/_cat/indices?v&s=index', body: '' },
      { label: '节点列表', description: '查看所有节点', method: 'GET', path: '/_cat/nodes?v', body: '' },
      { label: '分片信息', description: '查看分片分布', method: 'GET', path: '/_cat/shards?v', body: '' },
      { label: '别名列表', description: '查看所有别名', method: 'GET', path: '/_cat/aliases?v', body: '' },
      { label: '线程池', description: '查看线程池状态', method: 'GET', path: '/_cat/thread_pool?v', body: '' },
      { label: '健康状态', description: '查看集群健康', method: 'GET', path: '/_cat/health?v', body: '' },
    ],
  },
];


// 模拟响应数据
const mockResponses: Record<string, unknown> = {
  '/_cluster/health': { cluster_name: 'es-production-cluster', status: 'green', number_of_nodes: 3, active_shards: 90 },
  '/_cat/indices?v&s=index': 'health status index                     pri rep docs.count store.size\ngreen  open   logs-nginx-2024.01          5   1    5000000     20gb',
  '/_analyze': { tokens: [{ token: 'hello', position: 0 }, { token: 'world', position: 1 }] },
};

interface HistoryItem {
  id: number;
  method: string;
  path: string;
  body: string;
  response: string;
  timestamp: number;
}

const DevTools: React.FC = () => {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/_cluster/health');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('console');
  
  // 自定义模板
  const [customTemplates, setCustomTemplates] = useState<QueryExample[]>([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QueryExample | null>(null);
  const [templateForm] = Form.useForm();

  // 加载自定义模板
  useEffect(() => {
    const saved = getStorageData<QueryExample[]>(CUSTOM_TEMPLATES_KEY, []);
    setCustomTemplates(saved);
  }, []);

  // 保存自定义模板
  const saveCustomTemplates = (templates: QueryExample[]) => {
    setCustomTemplates(templates);
    setStorageData(CUSTOM_TEMPLATES_KEY, templates);
  };

  // 执行查询
  const handleExecute = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      let mockResponse = mockResponses[path];
      if (!mockResponse) {
        if (path.includes('/_search')) {
          mockResponse = { took: 5, timed_out: false, hits: { total: { value: 100 }, hits: [{ _id: '1', _source: { message: 'Sample' } }] } };
        } else if (method === 'PUT' || method === 'POST') {
          mockResponse = { acknowledged: true };
        } else if (method === 'DELETE') {
          mockResponse = { acknowledged: true };
        } else {
          mockResponse = { status: 'ok', message: '操作成功（模拟响应）' };
        }
      }
      
      const responseStr = typeof mockResponse === 'string' ? mockResponse : JSON.stringify(mockResponse, null, 2);
      setResponse(responseStr);
      
      const newHistory: HistoryItem = { id: Date.now(), method, path, body, response: responseStr, timestamp: Date.now() };
      setHistory(prev => [newHistory, ...prev.slice(0, 19)]);
      message.success('执行成功');
    } catch {
      setResponse(JSON.stringify({ error: '执行失败' }, null, 2));
      message.error('执行失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载示例到控制台并切换到控制台 Tab
  const handleLoadToConsole = (example: QueryExample, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMethod(example.method);
    setPath(example.path);
    setBody(example.body);
    setActiveTab('console');
    message.success('已加载到控制台');
  };

  // 从历史记录加载
  const handleLoadHistory = (item: HistoryItem) => {
    setMethod(item.method);
    setPath(item.path);
    setBody(item.body);
    setResponse(item.response);
    setActiveTab('console');
  };

  // 复制响应
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(response);
    message.success('已复制到剪贴板');
  };

  // 清空
  const handleClear = () => {
    setBody('');
    setResponse('');
  };

  // 打开新建/编辑模板弹窗
  const openTemplateModal = (template?: QueryExample) => {
    setEditingTemplate(template || null);
    if (template) {
      templateForm.setFieldsValue(template);
    } else {
      templateForm.resetFields();
      // 如果控制台有内容，自动填充
      if (path || body) {
        templateForm.setFieldsValue({ method, path, body });
      }
    }
    setTemplateModalVisible(true);
  };

  // 保存模板
  const handleSaveTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      if (editingTemplate?.id) {
        // 编辑
        const updated = customTemplates.map(t => 
          t.id === editingTemplate.id ? { ...t, ...values } : t
        );
        saveCustomTemplates(updated);
        message.success('模板更新成功');
      } else {
        // 新建
        const newTemplate: QueryExample = {
          ...values,
          id: `custom-${Date.now()}`,
          isCustom: true,
        };
        saveCustomTemplates([newTemplate, ...customTemplates]);
        message.success('模板保存成功');
      }
      setTemplateModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除自定义模板
  const handleDeleteTemplate = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    saveCustomTemplates(updated);
    message.success('模板删除成功');
  };

  // 保存当前查询为模板
  const handleSaveCurrentAsTemplate = () => {
    if (!path) {
      message.warning('请先输入查询路径');
      return;
    }
    templateForm.setFieldsValue({ method, path, body, label: '', description: '' });
    setEditingTemplate(null);
    setTemplateModalVisible(true);
  };

  // 获取所有分类（自定义模板在最前面）
  const getAllCategories = (): QueryCategory[] => {
    const categories: QueryCategory[] = [];
    
    // 自定义模板分类（如果有）
    if (customTemplates.length > 0) {
      categories.push({
        key: 'custom',
        label: '我的模板',
        examples: customTemplates,
      });
    }
    
    // 内置分类
    categories.push(...BUILTIN_CATEGORIES);
    
    return categories;
  };

  // 渲染示例卡片
  const renderExampleCard = (example: QueryExample, index: number) => (
    <Card key={example.id || index} size="small" hoverable className="cursor-pointer">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0" onClick={() => handleLoadToConsole(example)}>
          <div className="font-medium text-sm flex items-center gap-2">
            <Tag color={example.method === 'GET' ? 'green' : example.method === 'POST' ? 'blue' : example.method === 'PUT' ? 'orange' : 'red'} className="text-xs">
              {example.method}
            </Tag>
            {example.isCustom && <Star size={12} className="text-yellow-500" />}
            {example.label}
          </div>
          {example.description && <div className="text-xs text-gray-400 mt-1">{example.description}</div>}
          <div className="text-xs text-gray-500 font-mono mt-1 truncate">{example.path}</div>
        </div>
        <div className="flex-shrink-0 flex gap-1">
          <Tooltip title="到控制台执行">
            <Button type="text" size="small" icon={<Play size={14} />} onClick={(e) => handleLoadToConsole(example, e)} />
          </Tooltip>
          {example.isCustom && (
            <>
              <Tooltip title="编辑">
                <Button type="text" size="small" icon={<Edit size={14} />} onClick={(e) => { e.stopPropagation(); openTemplateModal(example); }} />
              </Tooltip>
              <Popconfirm title="确定删除此模板？" onConfirm={() => handleDeleteTemplate(example.id!)} okText="确定" cancelText="取消">
                <Tooltip title="删除">
                  <Button type="text" size="small" danger icon={<Trash2 size={14} />} onClick={(e) => e.stopPropagation()} />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Card title="开发者控制台" size="small">
        <div className="text-gray-500 text-sm mb-4">
          在这里可以执行 Elasticsearch REST API 请求（当前为模拟模式，连接真实 ES 后可执行实际请求）
        </div>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'console',
              label: '控制台',
              children: (
                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Select value={method} onChange={setMethod} style={{ width: 100 }} options={[
                          { value: 'GET', label: 'GET' },
                          { value: 'POST', label: 'POST' },
                          { value: 'PUT', label: 'PUT' },
                          { value: 'DELETE', label: 'DELETE' },
                          { value: 'HEAD', label: 'HEAD' },
                        ]} />
                        <Input value={path} onChange={e => setPath(e.target.value)} placeholder="请求路径，如 /_cluster/health" className="flex-1" />
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">请求体 (JSON)</div>
                        <TextArea value={body} onChange={e => setBody(e.target.value)} placeholder='{\n  "query": {\n    "match_all": {}\n  }\n}' rows={12} className="font-mono text-sm" />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="primary" icon={<Play size={16} />} onClick={handleExecute} loading={loading}>执行</Button>
                        <Button icon={<Trash2 size={16} />} onClick={handleClear}>清空</Button>
                        <Tooltip title="保存为模板">
                          <Button icon={<Star size={16} />} onClick={handleSaveCurrentAsTemplate}>保存模板</Button>
                        </Tooltip>
                      </div>
                    </div>
                  </Col>
                  
                  <Col xs={24} lg={12}>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-500">响应</span>
                        {response && <Button type="text" size="small" icon={<Copy size={14} />} onClick={handleCopyResponse}>复制</Button>}
                      </div>
                      <TextArea value={response} readOnly rows={15} className="font-mono text-sm bg-gray-50" placeholder="响应结果将显示在这里..." />
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'examples',
              label: '查询示例',
              children: (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <span className="text-gray-500 text-sm">点击示例可加载到控制台执行</span>
                    <Button type="primary" icon={<Plus size={16} />} onClick={() => openTemplateModal()}>新建模板</Button>
                  </div>
                  <Collapse
                    accordion
                    defaultActiveKey={customTemplates.length > 0 ? ['custom'] : ['cluster']}
                    items={getAllCategories().map(category => ({
                      key: category.key,
                      label: (
                        <span className="font-medium">
                          {category.key === 'custom' && <Star size={14} className="text-yellow-500 mr-1 inline" />}
                          {category.label}
                          <Tag className="ml-2" color={category.key === 'custom' ? 'gold' : 'blue'}>{category.examples.length}</Tag>
                        </span>
                      ),
                      children: (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {category.examples.map((example, index) => renderExampleCard(example, index))}
                        </div>
                      ),
                    }))}
                  />
                </div>
              ),
            },
            {
              key: 'history',
              label: <span className="flex items-center gap-1"><History size={14} />历史记录</span>,
              children: history.length > 0 ? (
                <div className="space-y-2">
                  {history.map(item => (
                    <Card key={item.id} size="small" hoverable onClick={() => handleLoadHistory(item)} className="cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div className="font-mono text-sm">
                          <Tag color={item.method === 'GET' ? 'green' : item.method === 'POST' ? 'blue' : item.method === 'PUT' ? 'orange' : 'red'}>{item.method}</Tag>
                          {item.path}
                        </div>
                        <div className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString('zh-CN')}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">暂无历史记录</div>
              ),
            },
          ]}
        />
      </Card>

      {/* 新建/编辑模板弹窗 */}
      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={templateModalVisible}
        onOk={handleSaveTemplate}
        onCancel={() => setTemplateModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={templateForm} layout="vertical" className="mt-4">
          <Form.Item name="label" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="例如：查询用户订单" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="模板用途说明（可选）" />
          </Form.Item>
          <Form.Item name="method" label="请求方法" rules={[{ required: true }]} initialValue="GET">
            <Select options={[
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
            ]} />
          </Form.Item>
          <Form.Item name="path" label="请求路径" rules={[{ required: true, message: '请输入请求路径' }]}>
            <Input placeholder="例如：/my-index/_search" />
          </Form.Item>
          <Form.Item name="body" label="请求体 (JSON)">
            <TextArea rows={8} className="font-mono text-sm" placeholder='{\n  "query": {\n    "match_all": {}\n  }\n}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DevTools;
