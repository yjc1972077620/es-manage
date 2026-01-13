package com.esmanage.dto;

import lombok.Data;

/**
 * 节点指标 DTO
 * 对应 Kibana 返回的节点指标结构
 */
@Data
public class NodeMetricDTO {

    /** 指标元信息 */
    private MetricInfoDTO metric;

    /** 指标摘要 */
    private MetricSummaryDTO summary;
}
