package com.esmanage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 索引信息 DTO
 * 对应 Kibana API: /api/monitoring/v1/clusters/{clusterId}/elasticsearch/indices
 */
@Data
public class IndexInfoDTO {

    /** 索引名称 */
    private String name;

    /** 健康状态: green/yellow/red */
    private String status;

    /** 文档数量 */
    @JsonProperty("doc_count")
    private Long docCount;

    /** 数据大小（字节） */
    @JsonProperty("data_size")
    private Long dataSize;

    /** 索引速率（文档/秒） */
    @JsonProperty("index_rate")
    private Double indexRate;

    /** 搜索速率（查询/秒） */
    @JsonProperty("search_rate")
    private Double searchRate;

    /** 未分配分片数 */
    @JsonProperty("unassigned_shards")
    private Integer unassignedShards;

    /** 状态排序值 */
    @JsonProperty("status_sort")
    private Integer statusSort;
}
