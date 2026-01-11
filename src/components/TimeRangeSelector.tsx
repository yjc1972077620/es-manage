/**
 * 时间范围选择器组件
 * 用于统一控制所有图表的时间范围
 */

import React from 'react';
import { Select, DatePicker, Space, Button } from 'antd';
import { RefreshCw } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { TIME_RANGES } from '@/constants';

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
  size?: 'small' | 'middle' | 'large';
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  onRefresh,
  showRefresh = true,
  size = 'small',
}) => {
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

  return (
    <Space size="small">
      <Select
        value={getCurrentPreset()}
        onChange={handlePresetChange}
        style={{ width: 140 }}
        size={size}
        placeholder="选择时间范围"
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
      />
      {showRefresh && onRefresh && (
        <Button
          size={size}
          icon={<RefreshCw size={14} />}
          onClick={onRefresh}
        >
          刷新
        </Button>
      )}
    </Space>
  );
};

export default TimeRangeSelector;
