/**
 * 状态徽章组件
 * 用于显示集群/索引健康状态
 */

import React from 'react';
import { Tag } from 'antd';
import { CLUSTER_STATUS_COLORS, CLUSTER_STATUS_TEXT } from '@/constants';
import type { ClusterHealthStatus } from '@/types';

interface StatusBadgeProps {
  status: ClusterHealthStatus;
  showText?: boolean;
  size?: 'small' | 'default';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showText = true,
  size = 'default' 
}) => {
  const color = CLUSTER_STATUS_COLORS[status];
  const text = CLUSTER_STATUS_TEXT[status];
  
  return (
    <Tag 
      color={color}
      style={{ 
        margin: 0,
        fontSize: size === 'small' ? 12 : 14,
        padding: size === 'small' ? '0 6px' : '2px 8px',
      }}
    >
      {showText ? text : status.toUpperCase()}
    </Tag>
  );
};

export default StatusBadge;
