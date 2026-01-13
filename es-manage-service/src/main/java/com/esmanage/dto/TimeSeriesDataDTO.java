package com.esmanage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

/**
 * 时序数据 DTO
 * 对应 Kibana 返回的时序图表数据
 */
@Data
public class TimeSeriesDataDTO {

    /** 时间桶大小 */
    @JsonProperty("bucket_size")
    private String bucketSize;

    /** 时间范围 */
    private TimeRangeDTO timeRange;

    /** 指标元信息 */
    private MetricInfoDTO metric;

    /** 数据点列表: [[timestamp, value], ...] */
    private List<List<Object>> data;

    /**
     * 时间范围
     */
    @Data
    public static class TimeRangeDTO {
        /** 开始时间戳（毫秒） */
        private Long min;
        /** 结束时间戳（毫秒） */
        private Long max;
    }
}
