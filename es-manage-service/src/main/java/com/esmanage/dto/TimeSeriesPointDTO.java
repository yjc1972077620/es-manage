package com.esmanage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 时序数据点 DTO
 * 转换后的简化格式，便于前端使用
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeSeriesPointDTO {

    /** 时间戳（毫秒） */
    private Long timestamp;

    /** 值 */
    private Double value;
}
