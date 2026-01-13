package com.esmanage.dto;

import lombok.Data;

/**
 * 指标元信息 DTO
 * 对应 Kibana 返回的 metric 结构
 */
@Data
public class MetricInfoDTO {

    /** 应用名称 */
    private String app;

    /** 字段路径 */
    private String field;

    /** 聚合方式 */
    private String metricAgg;

    /** 标签名称 */
    private String label;

    /** 图表标题 */
    private String title;

    /** 描述 */
    private String description;

    /** 单位 */
    private String units;

    /** 格式化模式 */
    private String format;

    /** 是否有计算 */
    private Boolean hasCalculation;

    /** 是否是导数 */
    private Boolean isDerivative;
}
