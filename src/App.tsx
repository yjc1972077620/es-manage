/**
 * 应用主组件
 * 配置路由和全局布局
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { MainLayout } from '@/layouts';
import { 
  Overview, 
  Cluster, 
  Nodes, 
  NodeDetail,
  Indices, 
  IndexDetail,
  DevTools,
  IndexManage,
  Analyzer,
  Alerts,
  AlertRules,
  AlertRecords,
  NotificationChannels,
  ApprovalList,
  ApprovalSubmit,
  ApprovalDetail,
  Workflows,
} from '@/pages';

// Ant Design 主题配置
const theme = {
  token: {
    colorPrimary: '#006BB4',
    borderRadius: 4,
  },
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* 监控 */}
            <Route index element={<Overview />} />
            <Route path="cluster" element={<Cluster />} />
            <Route path="nodes" element={<Nodes />} />
            <Route path="nodes/:id" element={<NodeDetail />} />
            <Route path="indices" element={<Indices />} />
            <Route path="indices/:name" element={<IndexDetail />} />
            
            {/* 管理 */}
            <Route path="index-manage" element={<IndexManage />} />
            <Route path="workflows" element={<Workflows />} />
            
            {/* 告警 */}
            <Route path="alerts" element={<Alerts />} />
            <Route path="alert-rules" element={<AlertRules />} />
            <Route path="alert-records" element={<AlertRecords />} />
            <Route path="notification-channels" element={<NotificationChannels />} />
            
            {/* 审批 */}
            <Route path="approvals" element={<ApprovalList />} />
            <Route path="approvals/submit" element={<ApprovalSubmit />} />
            <Route path="approvals/:id" element={<ApprovalDetail />} />
            
            {/* 开发工具 */}
            <Route path="dev-tools" element={<DevTools />} />
            <Route path="analyzer" element={<Analyzer />} />
            
            {/* 默认重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
