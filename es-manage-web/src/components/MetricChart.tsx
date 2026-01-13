/**
 * 指标图表组件
 * 用于展示时间序列监控数据
 */

import React from 'react';
import { Card } from 'antd';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { TimeSeriesDataPoint } from '@/types';
import { CHART_COLORS } from '@/constants';

interface MetricChartProps {
  title: string;
  data: TimeSeriesDataPoint[];
  color?: string;
  unit?: string;
  type?: 'line' | 'area';
  height?: number;
  loading?: boolean;
  showGrid?: boolean;
  yAxisDomain?: [number, number];
}

const MetricChart: React.FC<MetricChartProps> = ({
  title,
  data,
  color = CHART_COLORS.primary,
  unit = '',
  height = 200,
  loading = false,
  showGrid = true,
  yAxisDomain,
}) => {
  // 根据数据时间跨度决定时间格式
  const getTimeFormat = (): string => {
    if (data.length < 2) return 'HH:mm';
    
    const timeSpan = data[data.length - 1].timestamp - data[0].timestamp;
    const oneHour = 3600000;
    const oneDay = 86400000;
    
    if (timeSpan <= oneHour) {
      return 'HH:mm'; // 1小时内显示 时:分
    } else if (timeSpan <= oneDay) {
      return 'HH:mm'; // 1天内显示 时:分
    } else {
      return 'MM-DD HH:mm'; // 超过1天显示 月-日 时:分
    }
  };

  // 格式化时间戳
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const format = getTimeFormat();
    
    if (format === 'MM-DD HH:mm') {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${month}-${day} ${hours}:${minutes}`;
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 格式化 tooltip 时间（始终显示完整时间）
  const formatTooltipTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 自定义 Tooltip
  const CustomTooltip = ({ 
    active, 
    payload 
  }: { 
    active?: boolean; 
    payload?: Array<{ value: number; payload: TimeSeriesDataPoint }> 
  }) => {
    if (active && payload && payload.length) {
      const point = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-gray-500 text-xs mb-1">
            {formatTooltipTime(point.payload.timestamp)}
          </p>
          <p className="text-gray-800 font-medium">
            {point.value.toFixed(2)}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // 计算合适的 tick 数量
  const getTickCount = (): number => {
    if (data.length <= 10) return data.length;
    if (data.length <= 30) return 6;
    return 8;
  };

  return (
    <Card 
      title={title} 
      size="small" 
      loading={loading}
      styles={{ body: { padding: '12px' } }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tickCount={getTickCount()}
            minTickGap={50}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            domain={yAxisDomain || ['auto', 'auto']}
            tickFormatter={(value) => `${value}${unit}`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default MetricChart;
