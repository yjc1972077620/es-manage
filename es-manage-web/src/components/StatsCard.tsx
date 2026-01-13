/**
 * 统计卡片组件
 * 用于展示关键指标数据
 */

import React from 'react';
import { Card, Statistic, Progress, Tooltip } from 'antd';
import type { StatisticProps } from 'antd';

interface StatsCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  prefix?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  progress?: number;
  progressStatus?: 'success' | 'normal' | 'exception' | 'active';
  tooltip?: string;
  loading?: boolean;
  valueStyle?: React.CSSProperties;
  formatter?: StatisticProps['formatter'];
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  icon,
  progress,
  progressStatus = 'normal',
  tooltip,
  loading = false,
  valueStyle,
  formatter,
}) => {
  const cardContent = (
    <Card 
      size="small" 
      loading={loading}
      className="h-full"
      styles={{ body: { padding: '16px' } }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-gray-500 text-sm mb-2">{title}</div>
          <Statistic
            value={value}
            suffix={suffix}
            prefix={prefix}
            valueStyle={{ fontSize: 24, fontWeight: 600, ...valueStyle }}
            formatter={formatter}
          />
          {progress !== undefined && (
            <Progress
              percent={progress}
              status={progressStatus}
              size="small"
              showInfo={false}
              className="mt-2"
            />
          )}
        </div>
        {icon && (
          <div className="text-gray-400 ml-4">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
};

export default StatsCard;
