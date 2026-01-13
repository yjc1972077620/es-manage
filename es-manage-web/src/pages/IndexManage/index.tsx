/**
 * 索引管理页面
 * 提供索引的创建、删除、别名管理、管道管理、模板管理等操作
 */

import React, { useState } from 'react';
import { Card, Tabs, Form, Input, InputNumber, Button, Select, Table, Tag, Modal, message, Space, Popconfirm, Switch, Tooltip, Descriptions } from 'antd';
import { Plus, Trash2, Edit, Link, Eye, Copy, FileJson } from 'lucide-react';

const { TextArea } = Input;

// 模拟索引数据
const mockIndices = [
  { name: 'logs-nginx-2024.01', docs: 1250000, size: '2.1gb', shards: 5, replicas: 1 },
  { name: 'logs-nginx-2024.02', docs: 980000, size: '1.8gb', shards: 5, replicas: 1 },
  { name: 'logs-app-2024.01', docs: 560000, size: '890mb', shards: 3, replicas: 1 },
  { name: 'logs-app-2024.02', docs: 420000, size: '650mb', shards: 3, replicas: 1 },
  { name: 'users', docs: 15000, size: '45mb', shards: 1, replicas: 1 },
  { name: 'products', docs: 8500, size: '32mb', shards: 1, replicas: 1 },
  { name: 'orders', docs: 125000, size: '180mb', shards: 2, replicas: 1 },
];

// 模拟别名数据
const mockAliasesData: Array<{ alias: string; index: string; filter: string | null; routing: string | null; isWriteIndex: boolean }> = [
  { alias: 'logs-current', index: 'logs-nginx-2024.02', filter: null, routing: null, isWriteIndex: true },
  { alias: 'logs-current', index: 'logs-app-2024.02', filter: null, routing: null, isWriteIndex: false },
  { alias: 'metrics-latest', index: 'metrics-system-2024.02', filter: null, routing: null, isWriteIndex: true },
  { alias: 'users-read', index: 'users', filter: null, routing: null, isWriteIndex: false },
];

// 模拟管道数据
const mockPipelinesData = [
  { 
    id: 'logs-pipeline', 
    description: '日志处理管道',
    processors: [
      { grok: { field: 'message', patterns: ['%{COMBINEDAPACHELOG}'] } },
      { date: { field: 'timestamp', formats: ['ISO8601'] } },
    ]
  },
  { 
    id: 'user-agent-pipeline', 
    description: 'User Agent 解析管道',
    processors: [
      { user_agent: { field: 'user_agent' } },
    ]
  },
  {
    id: 'geoip-pipeline',
    description: 'GeoIP 地理位置解析',
    processors: [
      { geoip: { field: 'client_ip', target_field: 'geo' } },
    ]
  },
];

// 模拟模板数据
const mockTemplatesData = [
  { name: 'logs-template', index_patterns: ['logs-*'], priority: 100, version: 1, settings: { number_of_shards: 5, number_of_replicas: 1 }, mappings: { properties: { '@timestamp': { type: 'date' }, message: { type: 'text' } } } },
  { name: 'metrics-template', index_patterns: ['metrics-*'], priority: 100, version: 1, settings: { number_of_shards: 3, number_of_replicas: 1 }, mappings: { properties: { '@timestamp': { type: 'date' }, value: { type: 'float' } } } },
  { name: 'business-template', index_patterns: ['business-*'], priority: 50, version: 2, settings: { number_of_shards: 1, number_of_replicas: 1 }, mappings: {} },
];

const IndexManage: React.FC = () => {
  const [createForm] = Form.useForm();
  const [aliasForm] = Form.useForm();
  const [pipelineForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [aliasModalVisible, setAliasModalVisible] = useState(false);
  const [pipelineModalVisible, setPipelineModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [aliases, setAliases] = useState(mockAliasesData);
  const [pipelines, setPipelines] = useState(mockPipelinesData);
  const [templates, setTemplates] = useState(mockTemplatesData);
  const [createFromExisting, setCreateFromExisting] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<string | null>(null);
  const [editingPipeline, setEditingPipeline] = useState<typeof mockPipelinesData[0] | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<typeof mockTemplatesData[0] | null>(null);
  const [detailData, setDetailData] = useState<{ type: string; data: unknown } | null>(null);

  // 从已有索引获取配置
  const handleSourceIndexChange = (indexName: string) => {
    setSelectedSourceIndex(indexName);
    const sourceIndex = mockIndices.find(i => i.name === indexName);
    if (sourceIndex) {
      createForm.setFieldsValue({
        shards: sourceIndex.shards,
        replicas: sourceIndex.replicas,
        mappings: JSON.stringify({
          properties: {
            '@timestamp': { type: 'date' },
            message: { type: 'text' },
            level: { type: 'keyword' },
          }
        }, null, 2),
      });
      message.info(`已加载 ${indexName} 的配置`);
    }
  };

  // 创建索引
  const handleCreateIndex = async (values: {
    indexName: string;
    shards: number;
    replicas: number;
    mappings: string;
    sourceIndex?: string;
  }) => {
    console.log('创建索引:', values);
    message.success(`索引 ${values.indexName} 创建成功（模拟）`);
    setCreateModalVisible(false);
    setCreateFromExisting(false);
    setSelectedSourceIndex(null);
    createForm.resetFields();
  };

  // 添加别名
  const handleAddAlias = async (values: {
    alias: string;
    index: string;
    filter?: string;
    isWriteIndex?: boolean;
  }) => {
    const newAlias = {
      alias: values.alias,
      index: values.index,
      filter: values.filter || null,
      routing: null,
      isWriteIndex: values.isWriteIndex || false,
    };
    setAliases([...aliases, newAlias]);
    message.success(`别名 ${values.alias} 添加成功（模拟）`);
    setAliasModalVisible(false);
    aliasForm.resetFields();
  };

  // 删除别名
  const handleDeleteAlias = (alias: string, index: string) => {
    setAliases(aliases.filter(a => !(a.alias === alias && a.index === index)));
    message.success(`别名 ${alias} -> ${index} 删除成功（模拟）`);
  };

  // 保存管道
  const handleSavePipeline = async (values: { id: string; description: string; processors: string }) => {
    try {
      const processorsJson = JSON.parse(values.processors);
      if (editingPipeline) {
        setPipelines(pipelines.map(p => p.id === editingPipeline.id ? { ...p, description: values.description, processors: processorsJson } : p));
        message.success('管道更新成功（模拟）');
      } else {
        setPipelines([...pipelines, { id: values.id, description: values.description, processors: processorsJson }]);
        message.success('管道创建成功（模拟）');
      }
      setPipelineModalVisible(false);
      setEditingPipeline(null);
      pipelineForm.resetFields();
    } catch {
      message.error('处理器 JSON 格式错误');
    }
  };

  // 删除管道
  const handleDeletePipeline = (id: string) => {
    setPipelines(pipelines.filter(p => p.id !== id));
    message.success('管道删除成功（模拟）');
  };

  // 保存模板
  const handleSaveTemplate = async (values: { name: string; index_patterns: string; priority: number; settings: string; mappings: string }) => {
    try {
      const settingsJson = values.settings ? JSON.parse(values.settings) : {};
      const mappingsJson = values.mappings ? JSON.parse(values.mappings) : {};
      const patterns = values.index_patterns.split(',').map(p => p.trim());
      
      if (editingTemplate) {
        setTemplates(templates.map(t => t.name === editingTemplate.name ? {
          ...t, index_patterns: patterns, priority: values.priority, settings: settingsJson, mappings: mappingsJson,
          version: t.version + 1,
        } : t));
        message.success('模板更新成功（模拟）');
      } else {
        setTemplates([...templates, { name: values.name, index_patterns: patterns, priority: values.priority, version: 1, settings: settingsJson, mappings: mappingsJson }]);
        message.success('模板创建成功（模拟）');
      }
      setTemplateModalVisible(false);
      setEditingTemplate(null);
      templateForm.resetFields();
    } catch {
      message.error('JSON 格式错误');
    }
  };

  // 删除模板
  const handleDeleteTemplate = (name: string) => {
    setTemplates(templates.filter(t => t.name !== name));
    message.success('模板删除成功（模拟）');
  };

  // 打开管道编辑
  const openPipelineModal = (pipeline?: typeof mockPipelinesData[0]) => {
    setEditingPipeline(pipeline || null);
    if (pipeline) {
      pipelineForm.setFieldsValue({ id: pipeline.id, description: pipeline.description, processors: JSON.stringify(pipeline.processors, null, 2) });
    } else {
      pipelineForm.resetFields();
    }
    setPipelineModalVisible(true);
  };

  // 打开模板编辑
  const openTemplateModal = (template?: typeof mockTemplatesData[0]) => {
    setEditingTemplate(template || null);
    if (template) {
      templateForm.setFieldsValue({
        name: template.name,
        index_patterns: template.index_patterns.join(', '),
        priority: template.priority,
        settings: JSON.stringify(template.settings, null, 2),
        mappings: JSON.stringify(template.mappings, null, 2),
      });
    } else {
      templateForm.resetFields();
    }
    setTemplateModalVisible(true);
  };

  // 查看详情
  const showDetail = (type: string, data: unknown) => {
    setDetailData({ type, data });
    setDetailModalVisible(true);
  };

  // 别名表格列
  const aliasColumns = [
    { title: '别名', dataIndex: 'alias', key: 'alias' },
    { title: '索引', dataIndex: 'index', key: 'index', render: (index: string) => <Tag color="blue">{index}</Tag> },
    { title: '写入索引', dataIndex: 'isWriteIndex', key: 'isWriteIndex', render: (v: boolean) => v ? <Tag color="green">是</Tag> : '-' },
    { title: '过滤器', dataIndex: 'filter', key: 'filter', render: (filter: string | null) => filter ? <Tooltip title={filter}><Tag>有</Tag></Tooltip> : '-' },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: { alias: string; index: string }) => (
        <Popconfirm title="确定删除此别名？" onConfirm={() => handleDeleteAlias(record.alias, record.index)}>
          <Button type="link" danger size="small" icon={<Trash2 size={14} />}>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  // 管道表格列
  const pipelineColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '处理器数量', dataIndex: 'processors', key: 'processors', render: (processors: unknown[]) => processors.length },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: typeof mockPipelinesData[0]) => (
        <Space>
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => showDetail('pipeline', record)}>查看</Button>
          <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => openPipelineModal(record)}>编辑</Button>
          <Popconfirm title="确定删除此管道？" onConfirm={() => handleDeletePipeline(record.id)}>
            <Button type="link" danger size="small" icon={<Trash2 size={14} />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 模板表格列
  const templateColumns = [
    { title: '模板名称', dataIndex: 'name', key: 'name' },
    { title: '索引模式', dataIndex: 'index_patterns', key: 'index_patterns', render: (patterns: string[]) => patterns.map(p => <Tag key={p}>{p}</Tag>) },
    { title: '优先级', dataIndex: 'priority', key: 'priority' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: typeof mockTemplatesData[0]) => (
        <Space>
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => showDetail('template', record)}>查看</Button>
          <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => openTemplateModal(record)}>编辑</Button>
          <Button type="link" size="small" icon={<Copy size={14} />} onClick={() => {
            const newTemplate = { ...record, name: `${record.name}-copy`, version: 1 };
            setTemplates([...templates, newTemplate]);
            message.success('模板复制成功');
          }}>复制</Button>
          <Popconfirm title="确定删除此模板？" onConfirm={() => handleDeleteTemplate(record.name)}>
            <Button type="link" danger size="small" icon={<Trash2 size={14} />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="索引管理" size="small">
        <Tabs items={[
          {
            key: 'create', label: '创建索引',
            children: (
              <div className="max-w-2xl">
                <div className="text-gray-500 text-sm mb-4">创建新的 Elasticsearch 索引，配置分片、副本和映射</div>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => { setCreateFromExisting(false); setCreateModalVisible(true); }}>创建新索引</Button>
                <Button className="ml-2" icon={<FileJson size={16} />} onClick={() => { setCreateFromExisting(true); setCreateModalVisible(true); }}>从已有索引创建</Button>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">快速模板</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { title: '日志索引模板', desc: '适用于日志数据，包含时间戳和消息字段' },
                      { title: '指标索引模板', desc: '适用于监控指标数据' },
                      { title: '业务数据模板', desc: '通用业务数据索引' },
                      { title: '时序数据模板', desc: '适用于时序数据，自动滚动' },
                    ].map(t => (
                      <Card key={t.title} size="small" hoverable className="cursor-pointer" onClick={() => { setCreateFromExisting(false); setCreateModalVisible(true); }}>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-gray-500">{t.desc}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'aliases', label: '别名管理',
            children: (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500 text-sm">管理索引别名，支持多索引指向同一别名</div>
                  <Button type="primary" icon={<Link size={16} />} onClick={() => setAliasModalVisible(true)}>添加别名</Button>
                </div>
                <Table dataSource={aliases} columns={aliasColumns} rowKey={(record) => `${record.alias}-${record.index}`} pagination={false} size="small" />
              </div>
            ),
          },
          {
            key: 'pipelines', label: 'Ingest 管道',
            children: (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500 text-sm">管理数据摄取管道，在索引前处理数据</div>
                  <Button type="primary" icon={<Plus size={16} />} onClick={() => openPipelineModal()}>创建管道</Button>
                </div>
                <Table dataSource={pipelines} columns={pipelineColumns} rowKey="id" pagination={false} size="small" />
              </div>
            ),
          },
          {
            key: 'templates', label: '索引模板',
            children: (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-500 text-sm">管理索引模板，自动应用到匹配的新索引</div>
                  <Button type="primary" icon={<Plus size={16} />} onClick={() => openTemplateModal()}>创建模板</Button>
                </div>
                <Table dataSource={templates} columns={templateColumns} rowKey="name" pagination={false} size="small" />
              </div>
            ),
          },
        ]} />
      </Card>

      {/* 创建索引弹窗 */}
      <Modal title={createFromExisting ? '从已有索引创建' : '创建新索引'} open={createModalVisible} onCancel={() => { setCreateModalVisible(false); setCreateFromExisting(false); setSelectedSourceIndex(null); }} footer={null} width={600}>
        <Form form={createForm} layout="vertical" onFinish={handleCreateIndex} initialValues={{ shards: 1, replicas: 1 }}>
          {createFromExisting && (
            <Form.Item name="sourceIndex" label="源索引" rules={[{ required: true, message: '请选择源索引' }]}>
              <Select placeholder="选择要复制配置的索引" onChange={handleSourceIndexChange} options={mockIndices.map(i => ({ value: i.name, label: `${i.name} (${i.docs.toLocaleString()} 文档, ${i.size})` }))} />
            </Form.Item>
          )}
          <Form.Item name="indexName" label="新索引名称" rules={[{ required: true, message: '请输入索引名称' }, { pattern: /^[a-z][a-z0-9_-]*$/, message: '索引名称必须以小写字母开头，只能包含小写字母、数字、下划线和连字符' }]}>
            <Input placeholder={createFromExisting && selectedSourceIndex ? `${selectedSourceIndex}-v2` : 'my-index'} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="shards" label="主分片数" rules={[{ required: true }]}><InputNumber min={1} max={100} className="w-full" /></Form.Item>
            <Form.Item name="replicas" label="副本数" rules={[{ required: true }]}><InputNumber min={0} max={10} className="w-full" /></Form.Item>
          </div>
          <Form.Item name="mappings" label="映射 (JSON)">
            <TextArea rows={8} placeholder='{\n  "properties": {\n    "title": { "type": "text" },\n    "created_at": { "type": "date" }\n  }\n}' className="font-mono text-sm" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => { setCreateModalVisible(false); setCreateFromExisting(false); setSelectedSourceIndex(null); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加别名弹窗 */}
      <Modal title="添加别名" open={aliasModalVisible} onCancel={() => setAliasModalVisible(false)} footer={null}>
        <Form form={aliasForm} layout="vertical" onFinish={handleAddAlias}>
          <Form.Item name="alias" label="别名" rules={[{ required: true, message: '请输入别名' }]}><Input placeholder="my-alias" /></Form.Item>
          <Form.Item name="index" label="目标索引" rules={[{ required: true, message: '请选择目标索引' }]}>
            <Select placeholder="选择索引" options={mockIndices.map(i => ({ value: i.name, label: i.name }))} />
          </Form.Item>
          <Form.Item name="isWriteIndex" label="设为写入索引" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="filter" label="过滤器 (可选)">
            <TextArea rows={4} placeholder='{\n  "term": { "status": "published" }\n}' className="font-mono text-sm" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space><Button type="primary" htmlType="submit">添加</Button><Button onClick={() => setAliasModalVisible(false)}>取消</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 管道编辑弹窗 */}
      <Modal title={editingPipeline ? '编辑管道' : '创建管道'} open={pipelineModalVisible} onCancel={() => { setPipelineModalVisible(false); setEditingPipeline(null); }} footer={null} width={600}>
        <Form form={pipelineForm} layout="vertical" onFinish={handleSavePipeline}>
          <Form.Item name="id" label="管道 ID" rules={[{ required: true, message: '请输入管道 ID' }]}><Input placeholder="my-pipeline" disabled={!!editingPipeline} /></Form.Item>
          <Form.Item name="description" label="描述"><Input placeholder="管道描述" /></Form.Item>
          <Form.Item name="processors" label="处理器 (JSON 数组)" rules={[{ required: true, message: '请输入处理器配置' }]}>
            <TextArea rows={10} placeholder='[\n  { "grok": { "field": "message", "patterns": ["%{COMBINEDAPACHELOG}"] } },\n  { "date": { "field": "timestamp", "formats": ["ISO8601"] } }\n]' className="font-mono text-sm" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space><Button type="primary" htmlType="submit">保存</Button><Button onClick={() => { setPipelineModalVisible(false); setEditingPipeline(null); }}>取消</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板编辑弹窗 */}
      <Modal title={editingTemplate ? '编辑模板' : '创建模板'} open={templateModalVisible} onCancel={() => { setTemplateModalVisible(false); setEditingTemplate(null); }} footer={null} width={650}>
        <Form form={templateForm} layout="vertical" onFinish={handleSaveTemplate} initialValues={{ priority: 100 }}>
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}><Input placeholder="my-template" disabled={!!editingTemplate} /></Form.Item>
          <Form.Item name="index_patterns" label="索引模式 (逗号分隔)" rules={[{ required: true, message: '请输入索引模式' }]}><Input placeholder="logs-*, metrics-*" /></Form.Item>
          <Form.Item name="priority" label="优先级"><InputNumber min={0} max={1000} className="w-full" /></Form.Item>
          <Form.Item name="settings" label="设置 (JSON)">
            <TextArea rows={4} placeholder='{\n  "number_of_shards": 5,\n  "number_of_replicas": 1\n}' className="font-mono text-sm" />
          </Form.Item>
          <Form.Item name="mappings" label="映射 (JSON)">
            <TextArea rows={6} placeholder='{\n  "properties": {\n    "@timestamp": { "type": "date" }\n  }\n}' className="font-mono text-sm" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space><Button type="primary" htmlType="submit">保存</Button><Button onClick={() => { setTemplateModalVisible(false); setEditingTemplate(null); }}>取消</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情查看弹窗 */}
      <Modal title={detailData?.type === 'pipeline' ? '管道详情' : '模板详情'} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} footer={<Button onClick={() => setDetailModalVisible(false)}>关闭</Button>} width={600}>
        {detailData?.type === 'pipeline' && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{(detailData.data as typeof mockPipelinesData[0]).id}</Descriptions.Item>
              <Descriptions.Item label="描述">{(detailData.data as typeof mockPipelinesData[0]).description}</Descriptions.Item>
            </Descriptions>
            <div className="mt-4 font-medium mb-2">处理器配置</div>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-80">{JSON.stringify((detailData.data as typeof mockPipelinesData[0]).processors, null, 2)}</pre>
          </div>
        )}
        {detailData?.type === 'template' && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="名称">{(detailData.data as typeof mockTemplatesData[0]).name}</Descriptions.Item>
              <Descriptions.Item label="版本">{(detailData.data as typeof mockTemplatesData[0]).version}</Descriptions.Item>
              <Descriptions.Item label="优先级">{(detailData.data as typeof mockTemplatesData[0]).priority}</Descriptions.Item>
              <Descriptions.Item label="索引模式">{(detailData.data as typeof mockTemplatesData[0]).index_patterns.join(', ')}</Descriptions.Item>
            </Descriptions>
            <div className="mt-4 font-medium mb-2">设置</div>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify((detailData.data as typeof mockTemplatesData[0]).settings, null, 2)}</pre>
            <div className="mt-4 font-medium mb-2">映射</div>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60">{JSON.stringify((detailData.data as typeof mockTemplatesData[0]).mappings, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IndexManage;
