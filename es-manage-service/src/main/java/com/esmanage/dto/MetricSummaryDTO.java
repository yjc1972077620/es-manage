package com.esmanage.dto;

import lombok.Data;

/**
 * 指标摘要 DTO
 * 对应 Kibana 返回的 summary 结构
 */
@Data
public class MetricSummaryDTO {

    /** 最小值 */
    private Double minVal;

    /** 最大值 */
    private Double maxVal;

    /** 最新值 */
    private Double lastVal;

    /** 趋势: 1=上升, -1=下降, 0=持平 */
    private Integer slope;
}
