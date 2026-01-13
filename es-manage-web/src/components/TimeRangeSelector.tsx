/**
 * 时间范围选择器组件
 * 用于统一控制所有图表的时间范围，支持自动刷新
 */

import React, { useEffect, useRef, useState } from 'react';
import { Select, DatePicker, Space, Button, Tooltip } from 'antd';
import { RefreshCw, Loader2 } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { TIME_RANGES, REFRESH_INTERVALS } from '@/constants';

const { RangePicker } = DatePicker;

export interface TimeRange {
  start: number;
  end: number;
  label?: string;
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  onRefresh?: () => void;
  showRefresh?: boolean;
  showAutoRefresh?: boolean;
  loading?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  onRefresh,
  showRefresh = true,
  showAutoRefresh = true,
  loading = false,
  size = 'small',
}) => {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 自动刷新逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 如果设置了自动刷新间隔且有刷新回调
    if (autoRefreshInterval > 0 && onRefresh) {
      timerRef.current = setInterval(() => {
        // 只有在不加载时才触发刷新
        if (!loading) {
          onRefresh();
        }
      }, autoRefreshInterval);
    }

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoRefreshInterval, onRefresh, loading]);

  // 处理预设时间范围选择
  const handlePresetChange = (duration: number) => {
    const now = Date.now();
    onChange({
      start: now - duration,
      end: now,
      label: TIME_RANGES.find(r => r.value === duration)?.label,
    });
  };

  // 处理自定义时间范围选择
  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onChange({
        start: dates[0].valueOf(),
        end: dates[1].valueOf(),
        label: '自定义',
      });
    }
  };

  // 获取当前选中的预设值
  const getCurrentPreset = (): number | undefined => {
    const duration = value.end - value.start;
    const preset = TIME_RANGES.find(r => Math.abs(r.value - duration) < 60000);
    return preset?.value;
  };

  // 处理刷新按钮点击
  const handleRefresh = () => {
    if (!loading && onRefresh) {
      onRefresh();
    }
  };

  return (
    <Space size="small">
      <Select
        value={getCurrentPreset()}
        onChange={handlePresetChange}
        style={{ width: 130 }}
        size={size}
        placeholder="时间范围"
        options={TIME_RANGES.map(item => ({
          value: item.value,
          label: item.label,
        }))}
      />
      <RangePicker
        size={size}
        showTime
        value={[dayjs(value.start), dayjs(value.end)]}
        onChange={handleRangeChange}
        format="MM-DD HH:mm"
        allowClear={false}
        disabled={loading}
      />
      {showAutoRefresh && (
        <Tooltip title="自动刷新间隔">
          <Select
            value={autoRefreshInterval}
            onChange={setAutoRefreshInterval}
            style={{ width: 90 }}
            size={size}
            options={REFRESH_INTERVALS.map(item => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </Tooltip>
      )}
      {showRefresh && onRefresh && (
        <Tooltip title={loading ? '加载中...' : '刷新数据'}>
          <Button
            size={size}
            icon={loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? '加载中' : '刷新'}
          </Button>
        </Tooltip>
      )}
    </Space>
  );
};

export default TimeRangeSelector;
