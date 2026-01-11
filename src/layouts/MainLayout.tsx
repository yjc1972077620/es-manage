/**
 * 主布局组件
 * 类似 Kibana 的侧边栏布局，支持二级菜单折叠
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Select, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  LayoutDashboard,
  RefreshCw,
  Settings,
  Menu as MenuIcon,
  Terminal,
  FolderCog,
  Bell,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { REFRESH_INTERVALS } from '@/constants';

const { Sider, Content, Header } = Layout;

// 菜单项配置 - 使用 SubMenu 支持折叠
type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: 'monitoring',
    label: '监控',
    icon: <LayoutDashboard size={18} />,
    children: [
      { key: '/', label: '监控概览' },
      { key: '/cluster', label: '集群信息' },
      { key: '/nodes', label: '节点管理' },
      { key: '/indices', label: '索引列表' },
    ],
  },
  {
    key: 'alerts',
    label: '告警',
    icon: <Bell size={18} />,
    children: [
      { key: '/alerts', label: '告警中心' },
      { key: '/alert-rules', label: '告警规则' },
      { key: '/alert-records', label: '告警记录' },
      { key: '/notification-channels', label: '通知渠道' },
    ],
  },
  {
    key: 'approval',
    label: '审批',
    icon: <ClipboardList size={18} />,
    children: [
      { key: '/approvals', label: '审批管理' },
    ],
  },
  {
    key: 'management',
    label: '管理',
    icon: <FolderCog size={18} />,
    children: [
      { key: '/index-manage', label: '索引管理' },
      { key: '/workflows', label: '操作流' },
    ],
  },
  {
    key: 'devtools',
    label: '开发工具',
    icon: <Terminal size={18} />,
    children: [
      { key: '/dev-tools', label: '控制台' },
      { key: '/analyzer', label: '分析器' },
    ],
  },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(0);

  // 获取当前选中的菜单项和展开的子菜单
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/nodes/')) return '/nodes';
    if (path.startsWith('/indices/')) return '/indices';
    if (path.startsWith('/approvals')) return '/approvals';
    if (path.startsWith('/workflows')) return '/workflows';
    return path;
  };

  // 获取默认展开的子菜单
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/cluster') || path.startsWith('/nodes') || path.startsWith('/indices')) {
      return ['monitoring'];
    }
    if (path.startsWith('/alert')) return ['alerts'];
    if (path.startsWith('/approval')) return ['approval'];
    if (path.startsWith('/index-manage') || path.startsWith('/workflow')) return ['management'];
    if (path.startsWith('/dev-tools') || path.startsWith('/analyzer')) return ['devtools'];
    return ['monitoring'];
  };

  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys());

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  // 处理子菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  // 手动刷新
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        collapsedWidth={60}
        className="bg-[#1D1E24]"
        style={{ 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#006BB4] rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">ES</span>
            </div>
            {!collapsed && (
              <span className="text-white font-semibold text-lg">Monitor</span>
            )}
          </div>
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          className="bg-transparent border-none mt-2"
          theme="dark"
          items={menuItems}
          inlineCollapsed={collapsed}
        />

        {/* 折叠按钮 */}
        <div 
          className="absolute bottom-4 left-0 right-0 flex justify-center"
        >
          <Button
            type="text"
            size="small"
            icon={collapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronLeft size={16} className="text-gray-400" />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white"
          />
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout style={{ marginLeft: collapsed ? 60 : 220, transition: 'margin-left 0.2s' }}>
        {/* 顶部栏 */}
        <Header 
          className="bg-white px-4 flex items-center justify-between shadow-sm"
          style={{ position: 'sticky', top: 0, zIndex: 99, height: 56, lineHeight: '56px' }}
        >
          <div className="flex items-center gap-4">
            <Button type="text" icon={<MenuIcon size={20} className="text-gray-600" />} onClick={() => setCollapsed(!collapsed)} />
            <span className="text-xl font-semibold text-gray-900">Elasticsearch 监控平台</span>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={refreshInterval}
              onChange={setRefreshInterval}
              style={{ width: 120 }}
              size="small"
              options={REFRESH_INTERVALS.map(item => ({ value: item.value, label: item.label }))}
            />
            <Tooltip title="刷新数据">
              <Button type="text" icon={<RefreshCw size={18} />} onClick={handleRefresh} />
            </Tooltip>
            <Tooltip title="设置">
              <Button type="text" icon={<Settings size={18} />} />
            </Tooltip>
          </div>
        </Header>

        {/* 内容区 */}
        <Content className="p-6 bg-gray-50 min-h-[calc(100vh-56px)]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
