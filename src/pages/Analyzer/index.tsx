/**
 * 分析器测试页面
 * 测试 Elasticsearch 分词器效果
 */

import React, { useState } from 'react';
import { Card, Input, Select, Button, Table, Tag, Row, Col, Tabs, Descriptions } from 'antd';
import { Play, Zap } from 'lucide-react';

const { TextArea } = Input;

// 内置分析器
const BUILT_IN_ANALYZERS = [
  { value: 'standard', label: 'standard - 标准分析器' },
  { value: 'simple', label: 'simple - 简单分析器' },
  { value: 'whitespace', label: 'whitespace - 空白分析器' },
  { value: 'stop', label: 'stop - 停用词分析器' },
  { value: 'keyword', label: 'keyword - 关键词分析器' },
  { value: 'pattern', label: 'pattern - 正则分析器' },
  { value: 'fingerprint', label: 'fingerprint - 指纹分析器' },
];

// 内置分词器
const BUILT_IN_TOKENIZERS = [
  { value: 'standard', label: 'standard - 标准分词器' },
  { value: 'letter', label: 'letter - 字母分词器' },
  { value: 'lowercase', label: 'lowercase - 小写分词器' },
  { value: 'whitespace', label: 'whitespace - 空白分词器' },
  { value: 'uax_url_email', label: 'uax_url_email - URL/Email 分词器' },
  { value: 'classic', label: 'classic - 经典分词器' },
  { value: 'ngram', label: 'ngram - N-gram 分词器' },
  { value: 'edge_ngram', label: 'edge_ngram - Edge N-gram 分词器' },
  { value: 'keyword', label: 'keyword - 关键词分词器' },
  { value: 'pattern', label: 'pattern - 正则分词器' },
  { value: 'path_hierarchy', label: 'path_hierarchy - 路径层级分词器' },
];

// 模拟分析结果
const mockAnalyze = (text: string, analyzer: string): Array<{
  token: string;
  start_offset: number;
  end_offset: number;
  type: string;
  position: number;
}> => {
  if (!text) return [];
  
  switch (analyzer) {
    case 'standard':
      // 标准分析器：按词分割，转小写
      return text.toLowerCase().split(/\s+/).filter(Boolean).map((token, i) => ({
        token,
        start_offset: text.toLowerCase().indexOf(token),
        end_offset: text.toLowerCase().indexOf(token) + token.length,
        type: '<ALPHANUM>',
        position: i,
      }));
    
    case 'whitespace':
      // 空白分析器：仅按空白分割
      return text.split(/\s+/).filter(Boolean).map((token, i) => ({
        token,
        start_offset: text.indexOf(token),
        end_offset: text.indexOf(token) + token.length,
        type: 'word',
        position: i,
      }));
    
    case 'keyword':
      // 关键词分析器：整体作为一个词
      return [{
        token: text,
        start_offset: 0,
        end_offset: text.length,
        type: 'word',
        position: 0,
      }];
    
    case 'simple':
      // 简单分析器：按非字母分割，转小写
      return text.toLowerCase().split(/[^a-zA-Z]+/).filter(Boolean).map((token, i) => ({
        token,
        start_offset: 0,
        end_offset: token.length,
        type: 'word',
        position: i,
      }));
    
    default:
      // 默认按字符分割（模拟中文分词）
      const tokens: Array<{
        token: string;
        start_offset: number;
        end_offset: number;
        type: string;
        position: number;
      }> = [];
      let pos = 0;
      
      // 简单的中英文混合分词
      const regex = /[a-zA-Z]+|[\u4e00-\u9fa5]/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        tokens.push({
          token: match[0].toLowerCase(),
          start_offset: match.index,
          end_offset: match.index + match[0].length,
          type: /[a-zA-Z]/.test(match[0]) ? '<ALPHANUM>' : '<IDEOGRAPHIC>',
          position: pos++,
        });
      }
      return tokens;
  }
};

const Analyzer: React.FC = () => {
  const [text, setText] = useState('Hello World 你好世界 Elasticsearch 全文搜索');
  const [analyzer, setAnalyzer] = useState('standard');
  const [tokenizer, setTokenizer] = useState('standard');
  const [tokens, setTokens] = useState<Array<{
    token: string;
    start_offset: number;
    end_offset: number;
    type: string;
    position: number;
  }>>([]);
  const [loading, setLoading] = useState(false);

  // 执行分析
  const handleAnalyze = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = mockAnalyze(text, analyzer);
    setTokens(result);
    setLoading(false);
  };

  // Token 表格列
  const tokenColumns = [
    { 
      title: '位置', 
      dataIndex: 'position', 
      key: 'position',
      width: 60,
    },
    { 
      title: 'Token', 
      dataIndex: 'token', 
      key: 'token',
      render: (token: string) => (
        <Tag color="blue" className="font-mono">{token}</Tag>
      ),
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    { 
      title: '起始偏移', 
      dataIndex: 'start_offset', 
      key: 'start_offset',
      width: 80,
    },
    { 
      title: '结束偏移', 
      dataIndex: 'end_offset', 
      key: 'end_offset',
      width: 80,
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="分析器测试" size="small">
        <div className="text-gray-500 text-sm mb-4">
          测试 Elasticsearch 分析器和分词器的效果，了解文本如何被处理和索引
        </div>

        <Tabs
          items={[
            {
              key: 'analyzer',
              label: '分析器测试',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">输入文本</div>
                        <TextArea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          rows={4}
                          placeholder="输入要分析的文本..."
                        />
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">选择分析器</div>
                        <Select
                          value={analyzer}
                          onChange={setAnalyzer}
                          options={BUILT_IN_ANALYZERS}
                          className="w-full"
                        />
                      </div>
                      
                      <Button
                        type="primary"
                        icon={<Play size={16} />}
                        onClick={handleAnalyze}
                        loading={loading}
                      >
                        分析
                      </Button>
                    </div>
                  </Col>
                  
                  <Col xs={24} lg={12}>
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        分析结果 ({tokens.length} 个 token)
                      </div>
                      <Table
                        dataSource={tokens}
                        columns={tokenColumns}
                        rowKey="position"
                        pagination={false}
                        size="small"
                        scroll={{ y: 300 }}
                      />
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'tokenizer',
              label: '分词器测试',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">输入文本</div>
                        <TextArea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          rows={4}
                          placeholder="输入要分词的文本..."
                        />
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">选择分词器</div>
                        <Select
                          value={tokenizer}
                          onChange={setTokenizer}
                          options={BUILT_IN_TOKENIZERS}
                          className="w-full"
                        />
                      </div>
                      
                      <Button
                        type="primary"
                        icon={<Zap size={16} />}
                        onClick={handleAnalyze}
                        loading={loading}
                      >
                        分词
                      </Button>
                    </div>
                  </Col>
                  
                  <Col xs={24} lg={12}>
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        分词结果 ({tokens.length} 个 token)
                      </div>
                      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded min-h-[200px]">
                        {tokens.map((token, index) => (
                          <Tag key={index} color="blue" className="text-base">
                            {token.token}
                          </Tag>
                        ))}
                        {tokens.length === 0 && (
                          <span className="text-gray-400">点击"分词"按钮查看结果</span>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'reference',
              label: '分析器参考',
              children: (
                <div className="space-y-4">
                  <Card size="small" title="内置分析器说明">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="standard">
                        标准分析器，基于 Unicode 文本分割算法，适用于大多数语言
                      </Descriptions.Item>
                      <Descriptions.Item label="simple">
                        简单分析器，按非字母字符分割，转换为小写
                      </Descriptions.Item>
                      <Descriptions.Item label="whitespace">
                        空白分析器，仅按空白字符分割，不转换大小写
                      </Descriptions.Item>
                      <Descriptions.Item label="stop">
                        停用词分析器，类似 simple，但会过滤停用词
                      </Descriptions.Item>
                      <Descriptions.Item label="keyword">
                        关键词分析器，将整个输入作为单个 token
                      </Descriptions.Item>
                      <Descriptions.Item label="pattern">
                        正则分析器，使用正则表达式分割文本
                      </Descriptions.Item>
                      <Descriptions.Item label="fingerprint">
                        指纹分析器，用于生成文本指纹，去重和排序
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                  
                  <Card size="small" title="自定义分析器示例">
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
{`{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_custom_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "char_filter": ["html_strip"],
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  }
}`}
                    </pre>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Analyzer;
